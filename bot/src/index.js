import http from 'http';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://bonk-earn.vercel.app';
const BONK_IMAGE_URL = 'https://raw.githubusercontent.com/nullpointer10101-gif/BonkEarn/main/frontend/public/bonk_coin.png';

const bot = new Telegraf(BOT_TOKEN);

function getWelcomeKeyboard(startPayload) {
  const launchUrl = startPayload ? `${MINI_APP_URL}?start=${startPayload}` : MINI_APP_URL;
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
        { text: '👥 Invite Friends', url: `https://t.me/share/url?url=https://t.me/BonkEarnSol_bot/app?startapp=r_${startPayload || 'earn'}&text=🎁 Join BONK Earn and get 10,000 free BONK tokens instantly!` }
      ]
    ]
  };
}

bot.start(async (ctx) => {
  const startPayload = ctx.startPayload || '';
  const firstName = ctx.from?.first_name || 'Earner';

  const caption = 
    `🐕 *Welcome to BONK Earn, ${firstName}!* 🚀\n\n` +
    `The #1 Solana Meme Reward Bot! Earn free *$BONK* by watching verified sponsor ads, completing daily tasks & inviting friends.\n\n` +
    `⚡ *REWARD SYSTEM:*\n` +
    `🎁 *+10,000 BONK* Free Welcome Bonus\n` +
    `🎬 *+1,200 BONK* per Video Ad (10 Daily)\n` +
    `👥 *+10,000 BONK* per Valid Referral\n` +
    `🏆 *Daily Solana Airdrops & Leaderboards*\n\n` +
    `💳 *Direct Solana SPL Transfers* to Phantom, Solflare, OKX & Binance.\n\n` +
    `👇 *Tap below to launch the Mini App and claim your 10,000 BONK:*`;

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

bot.help((ctx) => {
  ctx.reply(
    `🐕 *BonkEarn Quick Help:*\n\n` +
    `1. Launch the Mini App using the button below.\n` +
    `2. Complete social tasks & watch daily sponsor ads.\n` +
    `3. Share your referral link to earn 10,000 BONK per friend.\n` +
    `4. Withdraw directly to your Solana wallet (min 100k BONK).\n\n` +
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

