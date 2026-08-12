import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, '../earn_data.json');

// Initial default state
const defaultData = {
  users: [
    {
      id: 99887766,
      username: 'crypto_earner',
      first_name: 'Alex',
      balance: 81000,
      ads_watched_total: 10,
      ads_watched_today: 4,
      ads_date: new Date().toISOString().split('T')[0],
      referrer_id: null,
      referral_count: 5,
      verified_ref_count: 3,
      withdrawal_unlocked: 1,
      flagged: 0,
      onboarding_completed: 1,
      ip_address: '127.0.0.1',
      device_id: 'device_demo_alex_9988',
      created_at: new Date().toISOString()
    }
  ],
  ad_sessions: [],
  tasks: [
    { id: 't1', title: 'Join Official Telegram Channel', type: 'join_tg', reward_amount: 5000, verification_data: JSON.stringify({ url: 'https://t.me/EarnOfficialChannel' }), active: 1, created_at: new Date().toISOString() },
    { id: 't2', title: 'Follow Official X (Twitter)', type: 'follow_x', reward_amount: 5000, verification_data: JSON.stringify({ url: 'https://x.com/EarnAppOfficial' }), active: 1, created_at: new Date().toISOString() },
    { id: 't3', title: 'Visit Sponsor Website', type: 'visit_url', reward_amount: 2500, verification_data: JSON.stringify({ url: 'https://earn.app/sponsor' }), active: 1, created_at: new Date().toISOString() }
  ],
  task_completions: [],
  withdrawals: [
    { id: 'w_101', user_id: 99887766, amount: 50000, wallet_address: '7xKXtg2CW87d9C72...89aX', status: 'completed', requested_at: '2026-08-06 14:30', processed_at: '2026-08-06 15:00', admin_note: null }
  ],
  transactions: [
    { id: 'tx_01', user_id: 99887766, type: 'ad_reward', amount: 1200, description: 'Watched Premium Video Ad #4', created_at: '2026-08-07 19:40' },
    { id: 'tx_02', user_id: 99887766, type: 'task_reward', amount: 5000, description: 'Completed: Join Telegram Channel', created_at: '2026-08-07 18:20' },
    { id: 'tx_03', user_id: 99887766, type: 'referral_verified', amount: 10000, description: 'Verified Referral Bonus (Ref #102 watched 10 ads)', created_at: '2026-08-07 16:10' },
    { id: 'tx_04', user_id: 99887766, type: 'withdrawal', amount: -50000, description: 'Submitted Withdrawal Request to 7xKX...89aX', created_at: '2026-08-06 14:30' }
  ]
};

// Load or persist JSON storage
function loadData() {
  if (!fs.existsSync(dbFilePath)) {
    saveData(defaultData);
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(dbFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    saveData(defaultData);
    return defaultData;
  }
}

// --- Git snapshot mirror ----------------------------------------------------
// Render's filesystem is ephemeral (wiped on every redeploy), so a local
// earn_data.json alone means user accounts/balances reset on deploy. To survive,
// the app mirrors the db file back to the GitHub repo via the Contents API
// (no git binary / .git folder required). Restore is automatic: the tracked
// file comes down with the deploy and is loaded on boot.
// Required env vars (set in Render dashboard):
//   GIT_PERSIST_TOKEN = GitHub personal access token with "Contents: write" (repo) scope
//   GIT_PERSIST_REPO  = "owner/repo" e.g. "nullpointer10101-gif/BonkEarn"
const GIT_REPO_PATH = 'backend/earn_data.json';
let lastPushedFingerprint = '';
let gitPushTimer = null;

function scheduleGitPush() {
  if (gitPushTimer) clearTimeout(gitPushTimer);
  gitPushTimer = setTimeout(() => { flushGitPush(); }, 45000);
}

async function flushGitPush() {
  const token = process.env.GIT_PERSIST_TOKEN;
  const repo = process.env.GIT_PERSIST_REPO;
  if (!token || !repo) return;

  let content;
  try {
    content = fs.readFileSync(dbFilePath, 'utf8');
  } catch (e) {
    return;
  }
  if (content === lastPushedFingerprint) return;

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${GIT_REPO_PATH}`;
  const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' };
  try {
    // Fetch current SHA so GitHub updates (not duplicates) the file.
    let sha;
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) sha = (await getRes.json()).sha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'db: persist earn_data snapshot',
        content: Buffer.from(content, 'utf8').toString('base64'),
        ...(sha ? { sha } : {})
      })
    });

    if (putRes.ok) {
      lastPushedFingerprint = content;
    } else {
      const body = (await putRes.text()).slice(0, 300);
      console.log(`git-persist: push failed (${putRes.status}) ${body}`);
    }
  } catch (e) {
    console.log(`git-persist: error ${e.message}`);
  }
}

// Flush pending snapshot before shutdown (Render sends SIGTERM on redeploy).
process.on('SIGTERM', () => { flushGitPush(); });
process.on('SIGINT', () => { flushGitPush(); });

function saveData(data) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
  scheduleGitPush();
}

const memoryDb = loadData();

// Seed fingerprint with what we just loaded so boot doesn't create a no-op push.
try { lastPushedFingerprint = fs.readFileSync(dbFilePath, 'utf8'); } catch (e) {}

// Clean SQLite query interface emulation for seamless backend operation
class DbWrapper {
  exec(sql) {
    // Schema initialized in memory structure
    return true;
  }

  prepare(sql) {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');

    // Fix schema updates if missing
    memoryDb.users.forEach(u => {
      if (u.onboarding_completed === undefined) {
        u.onboarding_completed = 0;
      }
    });

    return {
      get: (...params) => {
        if (cleanSql.startsWith('SELECT COUNT(*) as count FROM tasks') || cleanSql.startsWith('SELECT COUNT(*) as c FROM users')) {
          return { count: memoryDb.users.length, c: memoryDb.users.length };
        }

        if (cleanSql.includes('SELECT * FROM users WHERE id = ?')) {
          const userId = Number(params[0]);
          return memoryDb.users.find(u => u.id === userId) || null;
        }

        if (cleanSql.includes('SELECT ads_watched_today, ads_watched_total FROM users WHERE id = ?')) {
          const u = memoryDb.users.find(x => x.id === Number(params[0]));
          return u ? { ads_watched_today: u.ads_watched_today, ads_watched_total: u.ads_watched_total } : null;
        }

        if (cleanSql.includes('SELECT verified_ref_count FROM users WHERE id = ?')) {
          const u = memoryDb.users.find(x => x.id === Number(params[0]));
          return u ? { verified_ref_count: u.verified_ref_count } : null;
        }

        if (cleanSql.includes('SELECT balance FROM users WHERE id = ?')) {
          const u = memoryDb.users.find(x => x.id === Number(params[0]));
          return u ? { balance: u.balance } : null;
        }

        if (cleanSql.includes('FROM users WHERE referrer_id = ?')) {
          const referrerId = Number(params[0]);
          return memoryDb.users
            .filter(x => x.referrer_id === referrerId)
            .map(x => ({ id: x.id, username: x.username || '', first_name: x.first_name || '', ads_watched_total: x.ads_watched_total || 0 }));
        }

        if (cleanSql.includes('SELECT * FROM ad_sessions WHERE user_id = ? AND claimed_at IS NULL')) {
          const userId = Number(params[0]);
          const sessions = memoryDb.ad_sessions.filter(s => s.user_id === userId && !s.claimed_at);
          return sessions.length ? sessions[sessions.length - 1] : null;
        }

        if (cleanSql.includes('SELECT * FROM ad_sessions WHERE id = ?')) {
          if (!memoryDb.ad_sessions) memoryDb.ad_sessions = [];
          if (cleanSql.includes('AND user_id = ?')) {
            return memoryDb.ad_sessions.find(s => String(s.id) === String(params[0]) && Number(s.user_id) === Number(params[1])) || null;
          }
          return memoryDb.ad_sessions.find(s => String(s.id) === String(params[0])) || null;
        }

        if (cleanSql.includes('SELECT * FROM tasks WHERE id = ?')) {
          return memoryDb.tasks.find(t => t.id === params[0] && t.active === 1) || null;
        }

        if (cleanSql.includes('SELECT * FROM task_completions WHERE user_id = ? AND task_id = ?')) {
          return memoryDb.task_completions.find(tc => tc.user_id === Number(params[0]) && tc.task_id === params[1]) || null;
        }

        if (cleanSql.includes('SELECT * FROM withdrawals WHERE id = ?')) {
          return memoryDb.withdrawals.find(w => w.id === params[0]) || null;
        }

        if (cleanSql.includes('SELECT SUM(ads_watched_total) as c FROM users')) {
          const total = memoryDb.users.reduce((acc, u) => acc + (u.ads_watched_total || 0), 0);
          return { c: total };
        }

        if (cleanSql.includes('FROM users WHERE device_id = ?')) {
          const devId = String(params[0] || '');
          const excludeId = params[1] !== undefined ? Number(params[1]) : -1;
          return memoryDb.users.find(u => u.device_id && u.device_id === devId && u.id !== excludeId) || null;
        }

        if (cleanSql.includes('FROM users WHERE persistent_token = ?')) {
          const token = String(params[0] || '');
          const excludeId = params[1] !== undefined ? Number(params[1]) : -1;
          return memoryDb.users.find(u => u.persistent_token && u.persistent_token === token && u.id !== excludeId) || null;
        }

        if (cleanSql.includes('FROM users WHERE ip_address = ?')) {
          const ip = String(params[0] || '');
          const excludeId = params[1] !== undefined ? Number(params[1]) : -1;
          if (cleanSql.includes('COUNT(*)')) {
            const count = memoryDb.users.filter(u => u.ip_address && u.ip_address === ip && u.id !== excludeId && ip !== '127.0.0.1').length;
            return { c: count, count };
          }
          return memoryDb.users.find(u => u.ip_address && u.ip_address === ip && u.id !== excludeId && ip !== '127.0.0.1') || null;
        }

        if (cleanSql.includes('SELECT COUNT(*) as c FROM withdrawals WHERE status = "pending"')) {
          const count = memoryDb.withdrawals.filter(w => w.status === 'pending').length;
          return { c: count };
        }

        return null;
      },

      all: (...params) => {
        if (cleanSql.includes('SELECT * FROM tasks WHERE active = 1')) {
          return memoryDb.tasks.filter(t => t.active === 1);
        }

        if (cleanSql.includes('SELECT * FROM tasks')) {
          return memoryDb.tasks;
        }

        if (cleanSql.includes('SELECT task_id FROM task_completions WHERE user_id = ?')) {
          return memoryDb.task_completions.filter(tc => tc.user_id === Number(params[0]));
        }

        if (cleanSql.includes('FROM users WHERE referrer_id = ?')) {
          const refId = Number(params[0]);
          return memoryDb.users
            .filter(u => u.referrer_id === refId)
            .map(u => ({
              id: u.id,
              username: u.username,
              first_name: u.first_name,
              ads_watched_total: u.ads_watched_total,
              created_at: u.created_at,
              is_verified: u.ads_watched_total >= 10 ? 1 : 0
            }));
        }

        if (cleanSql.includes('SELECT * FROM users')) {
          if (cleanSql.includes('WHERE id = ?')) {
            return memoryDb.users.filter(u => u.id === Number(params[0]));
          }
          return memoryDb.users;
        }

        if (cleanSql.includes('FROM transactions')) {
          if (cleanSql.includes('WHERE user_id = ?')) {
            const uid = Number(params[0]);
            return (memoryDb.transactions || []).filter(t => t.user_id === uid).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          }
          return (memoryDb.transactions || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        if (cleanSql.includes('FROM withdrawals')) {
          if (cleanSql.includes('WHERE user_id = ?')) {
            const userId = Number(params[0]);
            return memoryDb.withdrawals
              .filter(w => w.user_id === userId)
              .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
          }
          // Return all withdrawals sorted newest first
          return memoryDb.withdrawals.slice().sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
        }

        return [];
      },

      run: (...params) => {
        if (cleanSql.includes('INSERT INTO users')) {
          const newUser = {
            id: Number(params[0]),
            username: params[1] || '',
            first_name: params[2] || 'User',
            balance: 0,
            ads_watched_total: 0,
            ads_watched_today: 0,
            ads_date: params[3],
            referrer_id: params[4] ? Number(params[4]) : null,
            ip_address: params[5] || '127.0.0.1',
            device_id: params[6] || '',
            persistent_token: params[7] || '',
            flagged: params[8] !== undefined ? Number(params[8]) : 0,
            referral_count: 0,
            verified_ref_count: 0,
            withdrawal_unlocked: 0,
            onboarding_completed: 0,
            created_at: new Date().toISOString()
          };
          memoryDb.users.push(newUser);
          saveData(memoryDb);
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET balance = balance + 100, referral_count = referral_count + 1 WHERE id = ?')) {
          const u = memoryDb.users.find(x => x.id === Number(params[0]));
          if (u) {
            u.balance += 100;
            u.referral_count += 1;
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET ads_watched_today = 0, ads_date = ? WHERE id = ?')) {
          const u = memoryDb.users.find(x => x.id === Number(params[1]));
          if (u) {
            u.ads_watched_today = 0;
            u.ads_date = params[0];
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET balance = balance + ?, ads_watched_today = ads_watched_today + 1, ads_watched_total = ads_watched_total + 1 WHERE id = ?')) {
          const amt = Number(params[0]);
          const u = memoryDb.users.find(x => x.id === Number(params[1]));
          if (u) {
            u.balance += amt;
            u.ads_watched_today = (u.ads_watched_today || 0) + 1;
            u.ads_watched_total = (u.ads_watched_total || 0) + 1;
            u.last_ad_watched_at = new Date().toISOString();
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET verified_ref_count = verified_ref_count + 1, balance = balance + ?')) {
          const bonus = Number(params[0]) || 0;
          const u = memoryDb.users.find(x => x.id === Number(params[1]));
          if (u) {
            u.verified_ref_count += 1;
            u.balance += bonus;
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET balance = balance + ?, referral_count = referral_count + 1 WHERE id = ?')) {
          const bonus = Number(params[0]) || 0;
          const u = memoryDb.users.find(x => x.id === Number(params[1]));
          if (u) {
            u.balance += bonus;
            u.referral_count = (u.referral_count || 0) + 1;
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET onboarding_completed = 1, balance = balance + 1000 WHERE id = ?')) {
          const u = memoryDb.users.find(x => x.id === Number(params[0]));
          if (u) {
            u.onboarding_completed = 1;
            u.balance += 1000;
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET onboarding_completed = 1, balance = balance + ? WHERE id = ?')) {
          const u = memoryDb.users.find(x => x.id === Number(params[1]));
          if (u) {
            u.onboarding_completed = 1;
            u.balance += Number(params[0] || 1000);
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET ip_address')) {
          const u = memoryDb.users.find(x => x.id === Number(params[params.length - 1]));
          if (u) {
            u.ip_address = params[0] || u.ip_address;
            u.device_id = params[1] || u.device_id;
            if (params.length > 3) {
              u.persistent_token = params[2] || u.persistent_token;
            }
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET withdrawal_unlocked = 1 WHERE id = ?')) {
          const u = memoryDb.users.find(x => x.id === Number(params[0]));
          if (u) {
            u.withdrawal_unlocked = 1;
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET balance = balance - ? WHERE id = ?')) {
          const amt = Number(params[0]);
          const u = memoryDb.users.find(x => x.id === Number(params[1]));
          if (u) {
            u.balance -= amt;
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET last_ad_watched_at = ? WHERE id = ?')) {
          const u = memoryDb.users.find(x => x.id === Number(params[1]));
          if (u) {
            u.last_ad_watched_at = String(params[0]);
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET balance = balance + ?')) {
          const amt = Number(params[0]);
          const userId = Number(params[params.length - 1]);
          const u = memoryDb.users.find(x => x.id === userId);
          if (u) {
            u.balance += amt;
            if (cleanSql.includes('ads_watched_today') || cleanSql.includes('ads_watched_total')) {
              u.ads_watched_today = (u.ads_watched_today || 0) + 1;
              u.ads_watched_total = (u.ads_watched_total || 0) + 1;
              u.last_ad_watched_at = new Date().toISOString();
            }
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('INSERT INTO ad_sessions')) {
          const session = {
            id: params[0],
            user_id: Number(params[1]),
            step: params[2] === 2 ? 2 : 1,
            ad_token: params[2] === 2 ? params[3] : params[2],
            reward_amount: 1200,
            created_at: new Date().toISOString(),
            claimed_at: null
          };
          if (!memoryDb.ad_sessions) memoryDb.ad_sessions = [];
          memoryDb.ad_sessions.push(session);
          saveData(memoryDb);
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE ad_sessions SET step = 2 WHERE id = ?')) {
          if (!memoryDb.ad_sessions) memoryDb.ad_sessions = [];
          const s = memoryDb.ad_sessions.find(x => String(x.id) === String(params[0]));
          if (s) {
            s.step = 2;
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE ad_sessions SET step = 3, claimed_at = ? WHERE id = ?')) {
          if (!memoryDb.ad_sessions) memoryDb.ad_sessions = [];
          const s = memoryDb.ad_sessions.find(x => String(x.id) === String(params[1]));
          if (s) {
            s.step = 3;
            s.claimed_at = params[0];
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('INSERT INTO task_completions')) {
          memoryDb.task_completions.push({
            user_id: Number(params[0]),
            task_id: params[1],
            completed_at: new Date().toISOString()
          });
          saveData(memoryDb);
          return { changes: 1 };
        }

        if (cleanSql.includes('INSERT INTO withdrawals')) {
          memoryDb.withdrawals.push({
            id: params[0],
            user_id: Number(params[1]),
            amount: Number(params[2]),
            wallet_address: params[3],
            status: params[4] || 'pending',
            requested_at: new Date().toISOString()
          });
          saveData(memoryDb);
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE withdrawals SET status = ?')) {
          const w = memoryDb.withdrawals.find(x => x.id === params[params.length - 1]);
          if (w) {
            w.status = params[0];
            if (params[1]) w.tx_hash = params[1];
            if (params[2]) w.processed_at = params[2];
            if (params[3]) w.admin_note = params[3];
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('INSERT INTO transactions')) {
          if (!memoryDb.transactions) memoryDb.transactions = [];
          memoryDb.transactions.push({
            id: params[0],
            user_id: Number(params[1]),
            type: params[2],
            amount: Number(params[3]),
            description: params[4],
            created_at: new Date().toISOString()
          });
          saveData(memoryDb);
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE users SET flagged')) {
          const targetId = Number(params[params.length - 1]);
          const u = memoryDb.users.find(x => x.id === targetId);
          if (u) {
            if (cleanSql.includes('flagged = 0')) {
              u.flagged = 0;
            } else if (cleanSql.includes('flagged = 1')) {
              u.flagged = 1;
            } else {
              u.flagged = Number(params[0]);
            }
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('INSERT INTO tasks')) {
          memoryDb.tasks.push({
            id: params[0],
            title: params[1],
            type: params[2],
            reward_amount: Number(params[3]),
            verification_data: params[4] || '{}',
            active: 1,
            created_at: new Date().toISOString()
          });
          saveData(memoryDb);
          return { changes: 1 };
        }

        if (cleanSql.includes('DELETE FROM tasks WHERE id = ?')) {
          memoryDb.tasks = memoryDb.tasks.filter(t => t.id !== params[0]);
          saveData(memoryDb);
          return { changes: 1 };
        }

        if (cleanSql.includes('DELETE FROM users WHERE id = ?')) {
          const userId = Number(params[0]);
          const userExists = memoryDb.users.some(u => u.id === userId);
          if (userExists) {
            // Remove user
            memoryDb.users = memoryDb.users.filter(u => u.id !== userId);
            
            // Unlink referrals
            memoryDb.users.forEach(u => {
              if (u.referrer_id === userId) u.referrer_id = null;
            });

            // Cascade deletes
            if (memoryDb.ad_sessions) {
              memoryDb.ad_sessions = memoryDb.ad_sessions.filter(s => s.user_id !== userId);
            }
            if (memoryDb.task_completions) {
              memoryDb.task_completions = memoryDb.task_completions.filter(tc => tc.user_id !== userId);
            }
            if (memoryDb.withdrawals) {
              memoryDb.withdrawals = memoryDb.withdrawals.filter(w => w.user_id !== userId);
            }
            if (memoryDb.transactions) {
              memoryDb.transactions = memoryDb.transactions.filter(t => t.user_id !== userId);
            }

            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('INSERT INTO withdrawals')) {
          memoryDb.withdrawals.push({
            id: params[0],
            user_id: Number(params[1]),
            amount: Number(params[2]),
            wallet_address: params[3],
            status: 'pending',
            requested_at: new Date().toISOString(),
            processed_at: null,
            admin_note: null,
            tx_hash: null
          });
          saveData(memoryDb);
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE withdrawals SET status = ?, tx_hash = ?, processed_at = ? WHERE id = ?')) {
          const w = memoryDb.withdrawals.find(x => x.id === params[3]);
          if (w) {
            w.status = params[0];
            w.tx_hash = params[1];
            w.processed_at = params[2];
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        if (cleanSql.includes('UPDATE withdrawals SET status = ?, processed_at = ?, admin_note = ? WHERE id = ?')) {
          const w = memoryDb.withdrawals.find(x => x.id === params[3]);
          if (w) {
            w.status = params[0];
            w.processed_at = params[1];
            w.admin_note = params[2];
            saveData(memoryDb);
          }
          return { changes: 1 };
        }

        return { changes: 0 };
      }
    };
  }
}

export function resetDatabase() {
  memoryDb.users = [];
  memoryDb.ad_sessions = [];
  memoryDb.task_completions = [];
  memoryDb.withdrawals = [];
  memoryDb.transactions = [];
  saveData(memoryDb);
  return true;
}

// Durability: admin settings are also snapshotted inside the db file so a fresh
// settings.json (e.g. after a redeploy) still restores the admin's last-saved values.
export function getStoredSettings() {
  return memoryDb._settings || null;
}

export function storeSettingsSnapshot(settings) {
  memoryDb._settings = { ...settings };
  saveData(memoryDb);
}

const db = new DbWrapper();
export default db;
