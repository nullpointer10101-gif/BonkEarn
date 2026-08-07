import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://bonk-earn.vercel.app';

if (!BOT_TOKEN || BOT_TOKEN === 'MOCK_BOT_TOKEN') {
  console.error('No valid BOT_TOKEN found in .env');
  process.exit(1);
}

const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function setupBot() {
  try {
    // 1. Set Chat Menu Button
    const menuRes = await fetch(`${API_URL}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: 'Start Earning 🔥',
          web_app: { url: MINI_APP_URL }
        }
      })
    });
    
    // 2. High FOMO Bot Description
    const descText = 
      `🐕 Welcome to BONK Earn — The Ultimate Solana Money Machine!\n\n` +
      `Stop scrolling and start earning REAL crypto. $BONK is the fastest-growing token on Solana, and we are giving it away for FREE.\n\n` +
      `🔥 Why Join Right Now?\n` +
      `🎁 Instant 10,000 $BONK Welcome Bonus!\n` +
      `📺 Watch simple ads and get paid immediately.\n` +
      `💸 Withdraw straight to your Phantom/Binance wallet instantly.\n\n` +
      `Join thousands of users who are already cashing out every single day. The earlier you start, the more you earn.\n\n` +
      `👇 Tap 'Start Earning' below before the reward pool runs out!`;
      
    await fetch(`${API_URL}/setMyDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: descText })
    });

    // 3. High FOMO Short Description
    const shortDescText = `🔥 Turn your time into Solana! Earn massive $BONK rewards instantly by watching ads and inviting friends. Play, earn, and withdraw today! 🐕💰`;
    await fetch(`${API_URL}/setMyShortDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ short_description: shortDescText })
    });

    console.log('✅ Hype FOMO Bot Profile Successfully Configured!');
  } catch (err) {
    console.error('Error:', err);
  }
}

setupBot();
