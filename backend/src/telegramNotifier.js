import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const PAYMENT_CHANNEL_ID = process.env.PAYMENT_CHANNEL_ID;
const BOT_LINK = process.env.BOT_LINK || 'https://t.me/BonkEarnSol_bot';

/**
 * Sends a formatted payment proof to the configured Telegram channel.
 * 
 * @param {string} username - User's name or masked name (e.g., 'AB***CD')
 * @param {number|string} amount - Amount of BONK withdrawn
 * @param {string} wallet - User's masked wallet address
 * @param {string} gateway - Gateway used (e.g., 'Solana Network', 'FaucetPay')
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function sendPaymentProof(username, amount, wallet, gateway) {
  if (!BOT_TOKEN || BOT_TOKEN === 'MOCK_BOT_TOKEN') {
    console.warn('[Notifier] MOCK_BOT_TOKEN is set. Skipping payment proof broadcast.');
    return false;
  }
  if (!PAYMENT_CHANNEL_ID) {
    console.warn('[Notifier] PAYMENT_CHANNEL_ID is not set in .env. Skipping broadcast.');
    return false;
  }

  let chatId = PAYMENT_CHANNEL_ID.trim();
  if (!chatId.startsWith('@') && !chatId.startsWith('-100') && !chatId.match(/^[0-9]+$/)) {
    // If they pasted a link like https://t.me/channelname
    if (chatId.includes('t.me/')) {
      chatId = '@' + chatId.split('t.me/')[1].split('/')[0];
    } else {
      chatId = '@' + chatId;
    }
  }

  // Format amount cleanly
  const formattedAmount = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  });

  // Current time formatted cleanly
  const now = new Date();
  const timeString = now.toISOString().replace('T', ' ').substring(0, 19) + ' +0000';

  const messageText = 
    `💸 <b>PAYMENT PROOF</b>\n\n` +
    `✅ <b>Withdrawal Successful!</b>\n\n` +
    `👤 User: ${username}\n` +
    `💰 Amount: ${formattedAmount} BONK\n` +
    `💼 Wallet: ${wallet}\n` +
    `🏦 Gateway: ${gateway}\n` +
    `🕒 Time: ${timeString}\n\n` +
    `🚀 Join BonkEarn and earn BONK today!`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '🚀 Start Earning',
          url: BOT_LINK
        }
      ]
    ]
  };

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    console.log(`[Notifier] Attempting to send message to chatId: ${chatId}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('[Notifier] Telegram API Error:', data.description);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Notifier] Failed to send payment proof:', error);
    return false;
  }
}
