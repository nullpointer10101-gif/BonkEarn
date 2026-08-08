import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

import db, { resetDatabase } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'earn_app_jwt_secret_key_2026';
const BOT_TOKEN = process.env.BOT_TOKEN || 'MOCK_BOT_TOKEN';

// Helper: Verify Telegram initData and parse user object
// Full HMAC-SHA256 signature check when a real bot token is configured
// (prevents forging/stealing other users' identities); dev mode accepts raw data.
function verifyTelegramInitData(initDataRaw) {
  if (!initDataRaw) return null;

  try {
    const urlParams = new URLSearchParams(initDataRaw);
    const userParam = urlParams.get('user');
    if (!userParam) return null;

    const isRealBot = BOT_TOKEN && BOT_TOKEN !== 'MOCK_BOT_TOKEN' && BOT_TOKEN.includes(':');
    if (isRealBot) {
      const hash = urlParams.get('hash');
      if (!hash) return null;
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
      const checkParts = [];
      for (const [key, value] of urlParams.entries()) {
        if (key !== 'hash') checkParts.push(`${key}=${value}`);
      }
      const checkString = checkParts.sort().join('\n');
      const computed = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
      if (computed !== hash) return null;
    }

    try {
      return JSON.parse(decodeURIComponent(userParam));
    } catch (e) {
      try { return JSON.parse(userParam); } catch (err) { return null; }
    }
  } catch (e) {
    return null;
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });

    req.user = decoded;
    next();
  });
}

// Admin Authentication Middleware: requires a valid admin JWT (issued by /admin/login)
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Admin access required' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded || decoded.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid or expired admin session' });
    }
    req.admin = decoded;
    next();
  });
}

// --- 6.1 AUTHENTICATION ENDPOINTS ---
app.post('/auth/login', (req, res) => {
  const { initData, referrerId, deviceId: clientDeviceId, persistentToken: clientPersistentToken, fpVisitorId } = req.body;
  let tgUser = verifyTelegramInitData(initData);

  // Extract client IP and Device Fingerprint
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
  const deviceId = clientDeviceId || fpVisitorId || req.headers['user-agent'] || 'dev_fingerprint_default';
  const persistentToken = clientPersistentToken || ('token_' + deviceId);

  // Fallback for development/testing if initData is raw JSON or demo user
  if (!tgUser && req.body.demoUser) {
    tgUser = req.body.demoUser;
  }

  if (!tgUser || !tgUser.id) {
    // Default demo user fallback for smooth instant preview
    tgUser = { id: 99887766, username: 'demo_user', first_name: 'Demo Earner' };
  }

  const userId = tgUser.id;
  const username = tgUser.username || '';
  const firstName = tgUser.first_name || 'User';

  const todayStr = new Date().toISOString().split('T')[0];

  // Check if user is already registered
  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    let validReferrer = null;
    let refRejectReason = null;

    // 1. Strict Anti-Fraud Multi-Account HARD BLOCK on Device ID / Fingerprint
    const existingDeviceUser = db.prepare('SELECT * FROM users WHERE device_id = ?').get(deviceId, userId);
    if (existingDeviceUser && existingDeviceUser.id !== userId) {
      // Save blocked account so it appears in Admin Panel
      db.prepare(`
        INSERT INTO users (id, username, first_name, ads_date, referrer_id, ip_address, device_id, persistent_token, flagged)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, username, firstName, todayStr, referrerId ? Number(referrerId) : null, clientIp, deviceId, persistentToken, 1);

      const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(txId, userId, 'anti_fraud_alert', 0, `⛔ FORBIDDEN REGISTRATION: Device HWID matches User #${existingDeviceUser.id} (@${existingDeviceUser.username || 'user'})`);
      
      return res.status(403).json({ 
        error: `⛔ FORBIDDEN: Duplicate account creation blocked. This physical device is already registered with User #${existingDeviceUser.id} (@${existingDeviceUser.username || 'user'}). Multi-accounting is strictly prohibited.` 
      });
    }

    // 2. Strict Anti-Fraud Multi-Account HARD BLOCK on Persistent Device Token
    const existingTokenUser = db.prepare('SELECT * FROM users WHERE persistent_token = ?').get(persistentToken, userId);
    if (existingTokenUser && existingTokenUser.id !== userId) {
      // Save blocked account so it appears in Admin Panel
      db.prepare(`
        INSERT INTO users (id, username, first_name, ads_date, referrer_id, ip_address, device_id, persistent_token, flagged)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, username, firstName, todayStr, referrerId ? Number(referrerId) : null, clientIp, deviceId, persistentToken, 1);

      const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(txId, userId, 'anti_fraud_alert', 0, `⛔ FORBIDDEN REGISTRATION: Persistent device token matches User #${existingTokenUser.id}`);
      
      return res.status(403).json({ 
        error: `⛔ FORBIDDEN: Duplicate account creation blocked. Device storage token is already linked to User #${existingTokenUser.id}. Only 1 account per device is allowed.` 
      });
    }

    // 3. Referral Anti-Sybil & Anti-Self Referral Validation
    if (referrerId && Number(referrerId) !== userId) {
      const refUser = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(referrerId));
      if (refUser) {
        if (refUser.device_id && refUser.device_id === deviceId) {
          refRejectReason = 'REJECTED: Referrer has same Device Fingerprint';
        } else if (refUser.persistent_token && refUser.persistent_token === persistentToken) {
          refRejectReason = 'REJECTED: Referrer has same Device Storage Token';
        } else if (refUser.ip_address && refUser.ip_address === clientIp && clientIp !== '127.0.0.1') {
          refRejectReason = 'REJECTED: Referrer has same IP Address';
        } else {
          validReferrer = refUser.id;
        }
      }
    }
    
    // Register new user
    db.prepare(`
      INSERT INTO users (id, username, first_name, ads_date, referrer_id, ip_address, device_id, persistent_token, flagged)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, firstName, todayStr, validReferrer, clientIp, deviceId, persistentToken, 0);

    if (validReferrer) {
      // Award signup bonus (+100 BONK) to referrer
      db.prepare('UPDATE users SET balance = balance + 100, referral_count = referral_count + 1 WHERE id = ?').run(validReferrer);
      const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(txId, validReferrer, 'referral_signup', 100, `Referral Signup Bonus from User #${userId}`);
    } else if (refRejectReason) {
      // Log anti-fraud alert in audit ledger
      const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(txId, userId, 'anti_fraud_alert', 0, `🚨 ${refRejectReason} (Attempted Referrer: #${referrerId})`);
    }
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  } else {
    // Update active IP, Device ID, and Persistent Token on existing account login
    db.prepare('UPDATE users SET ip_address = ?, device_id = ?, persistent_token = ? WHERE id = ?').run(clientIp, deviceId, persistentToken, userId);
    // Check UTC date reset for daily ad counter
    if (user.ads_date !== todayStr) {
      db.prepare('UPDATE users SET ads_watched_today = 0, ads_date = ? WHERE id = ?').run(todayStr, userId);
      user.ads_watched_today = 0;
      user.ads_date = todayStr;
    }
  }

  // Note: flagged accounts are NOT blocked at login anymore.
  // They still get the mandatory channel onboarding (boosts channel members),
  // but the onboarding bonus claim is denied server-side with a clear FORBIDDEN message.

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, refreshToken, user });
});

// --- 6.2 USER PROFILE & REFERRALS ---
app.get('/user/me', authenticateToken, (req, res) => {
  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Guarantee demo account test balance update for testing
  if (user.id === 99887766 && user.balance < 81000) {
    db.prepare('UPDATE users SET balance = 81000, verified_ref_count = 3, withdrawal_unlocked = 1, ads_watched_total = 10 WHERE id = ?').run(99887766);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  }

  res.json(user);
});

app.get('/user/referrals', authenticateToken, (req, res) => {
  const referrals = db.prepare(`
    SELECT id, username, first_name, ads_watched_total, created_at,
           (ads_watched_total >= 10) as is_verified
    FROM users WHERE referrer_id = ?
  `).all(req.user.id);
  res.json({ referrals, total: referrals.length });
});

// --- ONBOARDING GATE (MANDATORY CHANNEL JOIN + REG BONUS) ---
function verifyChannelMember(channelUsername, userId) {
  return new Promise((resolve) => {
    if (!botInstance) {
      return resolve({ verified: false, error: 'Bot not configured. No channel verification available.' });
    }
    const username = String(channelUsername || '').replace('@', '').trim();
    if (!username) {
      return resolve({ verified: false, error: 'Channel not configured by admin.' });
    }
    botInstance.telegram
      .getChatMember('@' + username, userId)
      .then((member) => {
        const status = member && member.status;
        const ok = status === 'creator' || status === 'administrator' || status === 'member';
        if (ok) {
          resolve({ verified: true, status });
        } else {
          resolve({ verified: false, status, error: `You have not joined @${username} yet! Tap JOIN CHANNEL first, then VERIFY again.` });
        }
      })
      .catch((err) => {
        resolve({ verified: false, error: (err && err.message) || 'Verification failed. Bot must be admin in this channel.' });
      });
  });
}

app.get('/onboarding', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const channels = (systemSettings.onboardingChannels || []).map(u => ({
    username: u,
    title: '@' + u,
    url: 'https://t.me/' + u
  }));

  res.json({
    required: Number(user.onboarding_completed) !== 1,
    completed: Number(user.onboarding_completed) === 1,
    bonus: Number(systemSettings.onboardingBonus) || 1000,
    channels
  });
});

app.post('/onboarding/verify', authenticateToken, async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (Number(user.onboarding_completed) === 1) {
    return res.json({ completed: true, verified: true });
  }

  const requested = String((req.body && (req.body.username || req.body.channel)) || '').replace('@', '').toLowerCase();
  const channel = (systemSettings.onboardingChannels || []).find(u => String(u).replace('@', '').toLowerCase() === requested);
  if (!channel) return res.status(400).json({ error: 'Unknown or unconfigured channel', verified: false });

  const result = await verifyChannelMember(channel, user.id);
  res.json({ verified: result.verified, error: result.error, username: channel });
});

app.post('/onboarding/claim-bonus', authenticateToken, async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (Number(user.onboarding_completed) === 1) {
    const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({ success: true, alreadyClaimed: true, newBalance: fresh.balance });
  }

  const channels = systemSettings.onboardingChannels || [];
  const failures = [];
  for (const ch of channels) {
    const result = await verifyChannelMember(ch, req.user.id);
    if (!result.verified) failures.push('@' + String(ch).replace('@', ''));
  }
  if (failures.length) {
    return res.status(400).json({ error: `Please join all channels first: ${failures.join(', ')}`, unverifiedChannels: failures });
  }

  // Flagged accounts: channels completed, but bonus is DENIED with clear message
  if (Number(user.flagged) === 1) {
    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
      .run(txId, req.user.id, 'onboarding_denied', 0, `⛔ Onboarding bonus DENIED: Account #${req.user.id} flagged for policy review`);
    return res.status(403).json({
      error: `⛔ ACCESS FORBIDDEN: Account #${req.user.id} is under policy review. Channels joined, but the registration bonus cannot be credited. Contact support.`
    });
  }

  const bonus = Number(systemSettings.onboardingBonus) || 1000;
  db.prepare('UPDATE users SET onboarding_completed = 1, balance = balance + ? WHERE id = ?').run(bonus, req.user.id);

  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(txId, req.user.id, 'onboarding_bonus', bonus, `Onboarding Registration Bonus (joined ${channels.length} channels)`);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, bonus, newBalance: updated.balance });
});

// --- 6.3 TASKS & PREMIUM ADS ---
app.get('/tasks', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const tasks = db.prepare('SELECT * FROM tasks WHERE active = 1').all();
  const completions = db.prepare('SELECT task_id FROM task_completions WHERE user_id = ?').all(userId);
  const completedSet = new Set(completions.map(c => c.task_id));

  const result = tasks.map(task => ({
    ...task,
    completed: completedSet.has(task.id),
    verification_data: JSON.parse(task.verification_data || '{}')
  }));

  res.json(result);
});

app.post('/tasks/:id/claim', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND active = 1').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const existing = db.prepare('SELECT * FROM task_completions WHERE user_id = ? AND task_id = ?').get(userId, taskId);
  if (existing) return res.status(400).json({ error: 'Task already completed' });

  db.prepare('INSERT INTO task_completions (user_id, task_id) VALUES (?, ?)').run(userId, taskId);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(task.reward_amount, userId);

  // Audit log
  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(txId, userId, 'task_reward', task.reward_amount, `Completed Bonus Task: ${task.title}`);

  const updatedUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  res.json({ success: true, reward: task.reward_amount, newBalance: updatedUser.balance });
});

// ADS WORKFLOW (3-step)
app.get('/ads/status', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const user = db.prepare('SELECT ads_watched_today, ads_watched_total FROM users WHERE id = ?').get(userId);
  const currentSession = db.prepare('SELECT * FROM ad_sessions WHERE user_id = ? AND claimed_at IS NULL ORDER BY created_at DESC LIMIT 1').get(userId);

  res.json({
    adsWatchedToday: user.ads_watched_today,
    adsWatchedTotal: user.ads_watched_total,
    dailyCap: 10,
    currentStep: currentSession ? currentSession.step : 1,
    activeSessionId: currentSession ? currentSession.id : null
  });
});

app.post('/ads/start', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  // 0. UTC daily window reset (handles users logged in across midnight)
  const todayStr = new Date().toISOString().split('T')[0];
  if (user.ads_date !== todayStr) {
    db.prepare('UPDATE users SET ads_watched_today = 0, ads_date = ? WHERE id = ?').run(todayStr, userId);
    user.ads_watched_today = 0;
    user.ads_date = todayStr;
  }

  // 1. Strict Daily Limit Enforcement (Anti-Bypass)
  const DAILY_CAP = 10;
  if ((user.ads_watched_today || 0) >= DAILY_CAP) {
    return res.status(400).json({ 
      error: `Daily ad limit reached (${DAILY_CAP}/${DAILY_CAP}). Resets daily at 00:00 UTC.`,
      isLimitReached: true,
      dailyCap: DAILY_CAP
    });
  }

  // 2. High CPM Cooldown Protection (Prevents rapid bot spamming & protects ad network fill rate)
  const COOLDOWN_SEC = 20;
  if (user.last_ad_watched_at) {
    const elapsedSec = Math.floor((Date.now() - new Date(user.last_ad_watched_at).getTime()) / 1000);
    if (elapsedSec < COOLDOWN_SEC) {
      const waitTime = COOLDOWN_SEC - elapsedSec;
      return res.status(429).json({ 
        error: `⏳ Cooldown active: Please wait ${waitTime}s before watching the next ad.`,
        cooldownRemaining: waitTime 
      });
    }
  }

  const sessionId = 'ad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const adToken = 'token_' + Math.random().toString(36).substr(2, 9);

  db.prepare(`
    INSERT INTO ad_sessions (id, user_id, step, ad_token, reward_amount)
    VALUES (?, ?, 1, ?, 1200)
  `).run(sessionId, userId, adToken);

  // Stamp the cooldown clock at session START so repeated start/abandon spam is also throttled
  db.prepare('UPDATE users SET last_ad_watched_at = ? WHERE id = ?').run(new Date().toISOString(), userId);

  res.json({ 
    success: true, 
    sessionId, 
    step: 1, 
    adToken, 
    minDuration: 15,
    rewardAmount: 1200,
    dailyCap: DAILY_CAP,
    remainingToday: DAILY_CAP - (user.ads_watched_today || 0)
  });
});

app.post('/ads/callback', (req, res) => {
  const { sessionId, adToken, signature } = req.body;
  let session = db.prepare('SELECT * FROM ad_sessions WHERE id = ?').get(sessionId);

  if (!session || !session.created_at) {
    return res.status(404).json({ error: '⚠️ Ad session not found. Please click START to watch an ad.' });
  }

  // Strict 14s Minimum Duration Verification on Verification Step
  const MIN_WATCH_MS = 14000;
  const elapsedMs = Date.now() - new Date(session.created_at).getTime();
  if (elapsedMs < MIN_WATCH_MS) {
    const remainingSec = Math.ceil((MIN_WATCH_MS - elapsedMs) / 1000);
    return res.status(400).json({ 
      error: `⚠️ Ad watch incomplete! Please watch the full 15 seconds before verifying (${remainingSec}s remaining).`,
      remainingSec
    });
  }

  // Update session state to step 2 (verified view)
  db.prepare('UPDATE ad_sessions SET step = 2 WHERE id = ?').run(sessionId);
  res.json({ success: true, step: 2, provider: 'GigaPub / Monetag' });
});

app.post('/ads/claim', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // 0. Daily Reset Window Enforcement (cross-midnight sessions)
  const todayStr = new Date().toISOString().split('T')[0];
  if (user.ads_date !== todayStr) {
    db.prepare('UPDATE users SET ads_watched_today = 0, ads_date = ? WHERE id = ?').run(todayStr, userId);
    user.ads_watched_today = 0;
    user.ads_date = todayStr;
  }

  // 1. Strict Anti-Race Daily Cap Check
  const DAILY_CAP = 10;
  if ((user.ads_watched_today || 0) >= DAILY_CAP) {
    return res.status(400).json({ error: `Daily ad cap (${DAILY_CAP}/${DAILY_CAP}) reached.` });
  }

  const session = db.prepare('SELECT * FROM ad_sessions WHERE id = ? AND user_id = ?').get(sessionId, userId);
  
  if (!session || !session.created_at) {
    return res.status(400).json({ error: '⚠️ Valid active ad session not found. Please click START to watch an ad.' });
  }

  if (session.claimed_at) {
    return res.status(400).json({ error: '⚠️ Ad reward has already been claimed.' });
  }

  if (session.step < 2) {
    return res.status(400).json({ error: '⚠️ Please verify playback in Step 2 before claiming your reward.' });
  }

  // 2. Minimum Watch Duration Verification (Anti-Cheat / High CPM compliance)
  const MIN_WATCH_MS = 14000; // 14s minimum elapsed for valid rewarded video
  const elapsedMs = Date.now() - new Date(session.created_at).getTime();
  if (elapsedMs < MIN_WATCH_MS) {
    const remainingSec = Math.ceil((MIN_WATCH_MS - elapsedMs) / 1000);
    return res.status(400).json({ 
      error: `⚠️ Incomplete view! You must watch the complete video ad (minimum 15s) to receive your reward (${remainingSec}s remaining).` 
    });
  }

  const nowStr = new Date().toISOString();
  db.prepare('UPDATE ad_sessions SET step = 3, claimed_at = ? WHERE id = ?').run(nowStr, session.id);

  // Credit 1200 BONK & update user stats with timestamp for cooldown
  db.prepare(`
    UPDATE users 
    SET balance = balance + ?, 
        ads_watched_today = ads_watched_today + 1, 
        ads_watched_total = ads_watched_total + 1 
    WHERE id = ?
  `).run(session.reward_amount, userId);

  // Audit log
  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(txId, userId, 'ad_reward', session.reward_amount, `Watched Premium Video Ad (Session: ${sessionId})`);

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  // Check if referrer should get verified bonus (+10,000 BONK when user reaches 10 total ads)
  if (updatedUser.ads_watched_total === 10 && updatedUser.referrer_id) {
    const referrer = db.prepare('SELECT * FROM users WHERE id = ?').get(updatedUser.referrer_id);
    if (referrer) {
      // Anti-Fraud Verification
      if (referrer.device_id && referrer.device_id === updatedUser.device_id) {
        const refTxId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(refTxId, referrer.id, 'anti_fraud_alert', 0, `🚨 REJECTED VERIFIED BONUS: Same Device Fingerprint with User #${userId}`);
      } else if (referrer.ip_address && referrer.ip_address === updatedUser.ip_address && referrer.ip_address !== '127.0.0.1') {
        const refTxId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(refTxId, referrer.id, 'anti_fraud_alert', 0, `🚨 REJECTED VERIFIED BONUS: Same IP Address (${referrer.ip_address}) with User #${userId}`);
      } else {
        db.prepare('UPDATE users SET verified_ref_count = verified_ref_count + 1, balance = balance + 10000 WHERE id = ?').run(updatedUser.referrer_id);
        const refTxId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(refTxId, updatedUser.referrer_id, 'referral_verified', 10000, `Verified Referral Bonus (Ref #${userId} completed 10 ads)`);

        if (referrer.verified_ref_count + 1 >= 3) {
          db.prepare('UPDATE users SET withdrawal_unlocked = 1 WHERE id = ?').run(updatedUser.referrer_id);
        }
      }
    }
  }

  res.json({
    success: true,
    reward: session.reward_amount,
    newBalance: updatedUser.balance,
    adsWatchedToday: updatedUser.ads_watched_today,
    adsWatchedTotal: updatedUser.ads_watched_total
  });
});

// --- 6.4 WITHDRAWALS ---
app.post('/withdraw/request', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { amount, walletAddress } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.flagged) {
    return res.status(403).json({ error: '🚨 Account suspended for Anti-Fraud / Multi-Account policy violation. Withdrawals disabled.' });
  }

  // Strict amount validation (blocks NaN / negative / decimals / strings)
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0 || !Number.isInteger(numAmount)) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }
  if (user.balance < numAmount) return res.status(400).json({ error: 'Insufficient balance' });
  if (numAmount < 50000) return res.status(400).json({ error: 'Minimum withdrawal is 50,000 BONK' });
  
  // Base58 check heuristic for Solana address
  if (!walletAddress || walletAddress.length < 32 || walletAddress.length > 44) {
    return res.status(400).json({ error: 'Invalid Solana wallet address format (32-44 base58 chars)' });
  }

  if (user.verified_ref_count < 3 && !user.withdrawal_unlocked) {
    return res.status(400).json({ error: 'Minimum 3 verified referrals required to unlock withdrawals' });
  }

  const withdrawId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

  // Deduct balance & create request
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(numAmount, userId);
  db.prepare(`
    INSERT INTO withdrawals (id, user_id, amount, wallet_address, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(withdrawId, userId, numAmount, walletAddress);

  res.json({ success: true, withdrawId, status: 'pending', remainingBalance: user.balance - numAmount });
});

app.get('/withdraw/history', authenticateToken, (req, res) => {
  const history = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC').all(req.user.id);
  res.json(history);
});

// --- 6.5 ADMIN OPERATIONS ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'meela';

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const adminToken = jwt.sign({ role: 'admin', authorized: true }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ success: true, adminToken });
  } else {
    res.status(401).json({ error: 'Invalid admin password' });
  }
});

app.all('/admin/wipe-db', (req, res) => {
  const password = req.body?.password || req.query?.password;
  if (password === ADMIN_PASSWORD) {
    resetDatabase();
    return res.json({ success: true, message: 'All users, sessions, and transactions purged successfully. Database is clean.' });
  }
  return res.status(401).json({ error: 'Unauthorized: Invalid admin password' });
});

// --- ADMIN ENDPOINTS ---
app.get('/admin/analytics', authenticateAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalAds = db.prepare('SELECT SUM(ads_watched_total) as c FROM users').get().c || 0;
  const pendingWithdrawals = db.prepare('SELECT COUNT(*) as c FROM withdrawals WHERE status = "pending"').get().c;

  res.json({ totalUsers, totalAds, pendingWithdrawals });
});

app.get('/admin/withdrawals', authenticateAdmin, (req, res) => {
  const list = db.prepare('SELECT * FROM withdrawals').all();
  res.json(list);
});

app.get('/admin/users', authenticateAdmin, (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.get('/admin/transactions', authenticateAdmin, (req, res) => {
  const logs = db.prepare('SELECT * FROM transactions').all();
  res.json(logs);
});

app.post('/admin/users/:id/balance', authenticateAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const { amount, reason } = req.body; // amount can be positive (+) or negative (-)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const numAmount = Number(amount);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(numAmount, userId);

  // Audit log
  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  const type = numAmount >= 0 ? 'admin_credit' : 'admin_debit';
  const note = reason || (numAmount >= 0 ? 'Admin Manual Credit' : 'Admin Manual Debit');
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(txId, userId, type, numAmount, note);

  const updated = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  res.json({ success: true, userId, newBalance: updated.balance });
});

app.post('/admin/users/:id/flag', authenticateAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const { flagged } = req.body;

  db.prepare('UPDATE users SET flagged = ? WHERE id = ?').run(flagged ? 1 : 0, userId);
  res.json({ success: true, userId, flagged: flagged ? 1 : 0 });
});

app.post('/admin/users/:id/unblock', authenticateAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET flagged = 0 WHERE id = ?').run(0, userId);

  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(txId, userId, 'admin_unblock', 0, `🔓 Admin Unlocked Account #${userId} (@${user.username || 'user'})`);

  res.json({ success: true, userId, message: `Account #${userId} unblocked successfully.` });
});

app.post('/admin/users/:id/block', authenticateAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const { reason } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET flagged = 1 WHERE id = ?').run(1, userId);

  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(txId, userId, 'admin_block', 0, `🔒 Admin Flagged & Blocked Account #${userId}: ${reason || 'Sybil/Policy Review'}`);

  res.json({ success: true, userId, message: `Account #${userId} blocked successfully.` });
});

app.post('/admin/tasks', authenticateAdmin, (req, res) => {
  const { title, type, rewardAmount, verificationData } = req.body;
  const taskId = 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

  db.prepare('INSERT INTO tasks (id, title, type, reward_amount, verification_data) VALUES (?, ?, ?, ?, ?)')
    .run(taskId, title, type || 'custom', Number(rewardAmount) || 1000, JSON.stringify(verificationData || { url: 'https://earn.app' }));

  res.json({ success: true, taskId });
});

app.get('/admin/tasks', authenticateAdmin, (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks').all();
  res.json(tasks.map(task => ({
    ...task,
    verification_data: JSON.parse(task.verification_data || '{}')
  })));
});

app.delete('/admin/tasks/:id', authenticateAdmin, (req, res) => {
  const taskId = req.params.id;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  res.json({ success: true, taskId });
});

app.get('/admin/users/:id/details', authenticateAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const referrals = db.prepare('SELECT id, username, first_name, ads_watched_total FROM users WHERE referrer_id = ?').all(userId);
  const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC').all(userId);
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(userId);

  res.json({ user, referrals, withdrawals, transactions });
});

// Default settings memory store
let systemSettings = {
  adRewardAmount: 1200,
  dailyAdCap: 10,
  minWithdrawalAmount: 50000,
  minVerifiedRefs: 3,
  referralSignupBonus: 100,
  verifiedRefBonus: 10000,
  onboardingBonus: 1000,
  onboardingChannels: ['BonkEarnNews', 'BonkEarnPayouts', 'BonkEarnChat']
};

app.get('/admin/settings', authenticateAdmin, (req, res) => {
  res.json(systemSettings);
});

app.post('/admin/settings', authenticateAdmin, (req, res) => {
  systemSettings = { ...systemSettings, ...req.body };
  res.json({ success: true, settings: systemSettings });
});

app.post('/admin/withdraw/:id/approve', authenticateAdmin, (req, res) => {
  const withdrawId = req.params.id;
  const { txHash } = req.body;
  const nowStr = new Date().toISOString();
  const generatedTx = txHash || 'sol_' + Math.random().toString(36).substr(2, 12) + '_sig';

  db.prepare('UPDATE withdrawals SET status = ?, tx_hash = ?, processed_at = ? WHERE id = ?')
    .run('completed', generatedTx, nowStr, withdrawId);

  res.json({ success: true, withdrawId, status: 'completed', txHash: generatedTx });
});

app.post('/admin/withdraw/:id/reject', authenticateAdmin, (req, res) => {
  const withdrawId = req.params.id;
  const { reason } = req.body;
  const nowStr = new Date().toISOString();
  const adminNote = reason || 'Rejected by Admin';

  const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(withdrawId);
  if (withdrawal && withdrawal.status === 'pending') {
    // Refund user balance
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(withdrawal.amount, withdrawal.user_id);
    db.prepare('UPDATE withdrawals SET status = ?, processed_at = ?, admin_note = ? WHERE id = ?')
      .run('failed', nowStr, adminNote, withdrawId);
  }

  res.json({ success: true, withdrawId, status: 'failed', adminNote });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'BonkEarnSol_bot', timestamp: new Date().toISOString() });
});

// --- TELEGRAM BOT INTEGRATION (Instant Response & Webhook Support) ---
import { Telegraf } from 'telegraf';

const MINI_APP_URL = process.env.MINI_APP_URL || 'https://bonk-earn.vercel.app';
const BONK_IMAGE_URL = 'https://raw.githubusercontent.com/nullpointer10101-gif/BonkEarn/main/frontend/public/bonk_coin.png';

let botInstance = null;

if (BOT_TOKEN && BOT_TOKEN !== 'MOCK_BOT_TOKEN' && BOT_TOKEN.includes(':')) {
  try {
    botInstance = new Telegraf(BOT_TOKEN);

    const getBotWelcomeKeyboard = (startPayload) => {
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
    };

    botInstance.start(async (ctx) => {
      const startPayload = ctx.startPayload || '';
      const firstName = ctx.from?.first_name || 'Earner';

      const caption = 
        `🔥 *BONK Earn is LIVE, ${firstName}!* 🚀\n\n` +
        `💰 *Your Status:* 10,000 BONK Ready to Claim!\n\n` +
        `Tap the button below to claim your free $BONK, watch simple ads, and cash out instantly to your Solana wallet! 👇`;

      try {
        await ctx.replyWithPhoto(BONK_IMAGE_URL, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: getBotWelcomeKeyboard(startPayload)
        });
      } catch (err) {
        await ctx.reply(caption, {
          parse_mode: 'Markdown',
          reply_markup: getBotWelcomeKeyboard(startPayload)
        });
      }
    });

    botInstance.help((ctx) => {
      ctx.reply(
        `🐕 *BonkEarn Quick Guide:*\n\n` +
        `1. Tap the button below to launch the Mini App.\n` +
        `2. Complete tasks & watch sponsor ads.\n` +
        `3. Share your referral link for 10,000 BONK per friend.\n` +
        `4. Instant Solana withdrawals (min 100k BONK).\n\n` +
        `📢 Updates: @BonkEarnNews\n` +
        `💳 Proofs: @BonkEarnPayouts`,
        {
          parse_mode: 'Markdown',
          reply_markup: getBotWelcomeKeyboard('')
        }
      );
    });

    // Webhook Route for Zero-Delay Incoming Updates
    app.use('/api/bot-webhook', (req, res) => {
      botInstance.handleUpdate(req.body, res);
    });

    // Launch bot
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_EXTERNAL_URL) {
      const webhookUrl = `${RENDER_EXTERNAL_URL}/api/bot-webhook`;
      botInstance.telegram.setWebhook(webhookUrl).then(() => {
        console.log(`⚡ Telegram Webhook successfully active at ${webhookUrl}`);
      }).catch(err => {
        console.warn('Webhook setup notice, starting polling fallback:', err.message);
        botInstance.launch({ dropPendingUpdates: true });
      });
    } else {
      botInstance.launch({ dropPendingUpdates: true }).then(() => {
        console.log('⚡ Telegram Bot polling active with 0ms delay!');
      }).catch(err => {
        console.warn('Bot launch notice:', err.message);
      });
    }
  } catch (err) {
    console.error('Error initializing Telegram bot in server:', err);
  }
}

// Keep-Alive Ping every 4 minutes to prevent Render Free Tier sleep
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
  setInterval(async () => {
    try {
      const res = await fetch(`${RENDER_URL}/health`);
      console.log(`[Keep-Alive] Pinged ${RENDER_URL}/health: ${res.status}`);
    } catch (e) {
      console.warn('[Keep-Alive] Ping notice:', e.message);
    }
  }, 4 * 60 * 1000);
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`⚡ BonkEarn Backend API & Bot running on port ${PORT}`);
});

