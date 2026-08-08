import http from 'http';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://bonk-earn.vercel.app';
// Backend API (the Render "BonkEarn" web service). Used to keep bot copy in
// sync with the real admin settings. Falls back to defaults if unset/unreachable.
const API_BASE_URL = process.env.API_BASE_URL || '';
const BONK_IMAGE_URL = 'https://raw.githubusercontent.com/nullpointer10101-gif/BonkEarn/main/frontend/public/bonk_coin.png';

let botConfig = {
  onboardingBonus: 1000,
  referralSignupBonus: 100,
  verifiedRefBonus: 10000,
  minWithdrawalAmount: 50000,
  adRewardAmount: 1200
};

async function refreshConfig() {
  if (!API_BASE_URL) return;
  try {
    const res = await fetch(`${API_BASE_URL}/config`);
    if (res.ok) {
      const c = await res.json();
      botConfig.onboardingBonus = Number(c.onboardingBonus) || botConfig.onboardingBonus;
      botConfig.referralSignupBonus = Number(c.referralSignupBonus) || botConfig.referralSignupBonus;
      botConfig.verifiedRefBonus = Number(c.verifiedRefBonus) || botConfig.verifiedRefBonus;
      botConfig.minWithdrawalAmount = Number(c.minWithdrawalAmount) || botConfig.minWithdrawalAmount;
      botConfig.adRewardAmount = Number(c.adRewardAmount) || botConfig.adRewardAmount;
    }
  } catch (e) { /* keep defaults if API is unreachable */ }
}

const bot = new Telegraf(BOT_TOKEN);

function getWelcomeKeyboard(startPayload) {
  const launchUrl = startPayload ? `${MINI_APP_URL}?start=${startPayload}` : MINI_APP_URL;
  const inviteText = `🎁 Join BONK Earn and get ${botConfig.referralSignupBonus.toLocaleString()} free BONK tokens instantly!`;
  return {
    inline_keyboard: [
      [
        {
          text: '🚀 Launch BONK Mini App',
          web_app: { url: launchUrl }
        }
      ],
      [
        { text: '📢 Official Channel', url: 'https://t.me/BonkEarnNews' },
        { text: '💳 Payment Proofs', url: 'https://t.me/BonkEarnPayouts' }
      ],
      [
        { text: '💬 Community Chat', url: 'https://t.me/BonkEarnChat' },
        // Plain bot link: the mini app generates the correct per-user referral
        // link after login (https://t.me/BonkEarnSol_bot?start=<id>). A fake
        // r_<code> deep link here yielded NaN referrer ids and lost referrals.
        { text: '👥 Invite Friends', url: `https://t.me/share/url?url=${encodeURIComponent('https://t.me/BonkEarnSol_bot')}&text=${encodeURIComponent(inviteText)}` }
      ]
    ]
  };
}

bot.start(async (ctx) => {
  await refreshConfig();
  const startPayload = ctx.startPayload || '';
  const firstName = ctx.from?.first_name || 'Earner';

  const caption =
    `🔥 *BONK Earn is LIVE, ${firstName}!* 🚀\n\n` +
    `💰 *Your Status:* ${botConfig.onboardingBonus.toLocaleString()} BONK Ready to Claim!\n\n` +
    `Tap the button below to claim your free $BONK, watch sponsor ads (${botConfig.adRewardAmount.toLocaleString()} BONK each), and cash out instantly to your Solana wallet 👇`;

  try {
    await ctx.replyWithPhoto(BONK_IMAGE_URL, {
      caption,
      parse_mode: 'Markdown',
      reply_markup: getWelcomeKeyboard(startPayload)
    });
  } catch (err) {
    // Fallback to text if image fails to load
    await ctx.reply(caption, {
      parse_mode: 'Markdown',
      reply_markup: getWelcomeKeyboard(startPayload)
    });
  }
});

bot.help(async (ctx) => {
  await refreshConfig();
  ctx.reply(
    `🐕 *BonkEarn Quick Help:*\n\n` +
    `1. Launch the Mini App using the button below.\n` +
    `2. Complete social tasks & watch daily sponsor ads.\n` +
    `3. Share your referral link to earn ${botConfig.referralSignupBonus.toLocaleString()} BONK per verified friend.\n` +
    `4. Withdraw directly to your Solana wallet (min ${botConfig.minWithdrawalAmount.toLocaleString()} BONK).\n\n` +
    `📢 Updates: @BonkEarnNews\n` +
    `💳 Proofs: @BonkEarnPayouts`,
    {
      parse_mode: 'Markdown',
      reply_markup: getWelcomeKeyboard('')
    }
  );
});

bot.command('balance', (ctx) => {
  ctx.reply(`💰 Launch the Mini App to check your real-time BONK balance and withdrawal status!`, {
    reply_markup: getWelcomeKeyboard('')
  });
});

console.log('🤖 BonkEarn Telegram Bot initialized.');

// Keep copy in sync with admin settings even between /start commands.
setInterval(() => refreshConfig(), 10 * 60 * 1000);

if (process.env.BOT_TOKEN && process.env.BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
  bot.launch({
    dropPendingUpdates: true // Drop stale queued updates on startup to prevent backlog lag
  }).then(() => {
    console.log('⚡ Telegram Bot is active and listening for messages!');
  }).catch((err) => {
    console.error('❌ Error launching Telegram Bot:', err);
  });
}

// Lightweight HTTP server for Render free web service health probes & keep-alive
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', bot: 'BonkEarnSol_bot', time: new Date().toISOString() }));
});

server.listen(PORT, () => {
  console.log(`🌐 Bot Health Server listening on port ${PORT}`);
});

// Auto Keep-Alive Self-Ping every 4 minutes to prevent Render Free Tier sleep
const RENDER_APP_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_APP_URL) {
  setInterval(async () => {
    try {
      const res = await fetch(`${RENDER_APP_URL}/`);
      console.log(`[Keep-Alive] Pinged ${RENDER_APP_URL}: ${res.status}`);
    } catch (e) {
      console.warn('[Keep-Alive] Ping notice:', e.message);
    }
  }, 4 * 60 * 1000);
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

