import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const MINI_APP_URL = process.env.MINI_APP_URL || 'http://localhost:5173';

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  const startPayload = ctx.startPayload || '';
  const firstName = ctx.from.first_name || 'User';

  ctx.reply(
    `🐕 Welcome to *BonkEarn*, ${firstName}!\n\n` +
    `Watch ads, complete easy social tasks, and invite friends to earn BONK rewards directly into your Solana wallet.\n\n` +
    `⚡ Click below to launch the Mini App:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Launch BonkEarn Mini App',
              web_app: { url: `${MINI_APP_URL}?start=${startPayload}` }
            }
          ],
          [
            { text: '💬 Support Group', url: 'https://t.me/EarnAppOfficial' },
            { text: '📢 Channel', url: 'https://t.me/EarnOfficialChannel' }
          ]
        ]
      }
    }
  );
});

bot.help((ctx) => {
  ctx.reply('Launch the Mini App to start earning rewards and track your withdrawals!');
});

console.log('🤖 BonkEarn Telegram Bot service initialized.');

if (process.env.BOT_TOKEN && process.env.BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
  bot.launch();
  console.log('⚡ Bot is running...');
}
