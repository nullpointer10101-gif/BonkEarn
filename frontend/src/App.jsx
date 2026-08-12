import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { 
  Home, 
  CheckCircle2, 
  ArrowUpRight, 
  Users, 
  HelpCircle, 
  Headphones, 
  PlayCircle, 
  Award, 
  Copy, 
  ChevronRight, 
  Wallet, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  Search,
  Sliders,
  AlertTriangle,
  TrendingUp,
  LogOut,
  Plus,
  Trash2,
  Eye,
  Settings,
  Activity,
  FileText,
  Filter
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Admin/owner accounts are permanently protected: block & flag are disabled for them in the UI and API.
const PROTECTED_ADMIN_IDS = [6909180225, 99887766];
const isProtectedAdmin = (id) => PROTECTED_ADMIN_IDS.includes(Number(id));

async function getAdvancedDeviceIdentity() {
  // 1. Universal Storage Persistence (localStorage, sessionStorage, cookie)
  let persistentToken = '';
  try {
    persistentToken = localStorage.getItem('bonk_persistent_device_id') || sessionStorage.getItem('bonk_persistent_device_id') || '';
    if (!persistentToken) {
      const match = document.cookie.match(/bonk_device_token=([^;]+)/);
      if (match) persistentToken = match[1];
    }
    if (!persistentToken) {
      persistentToken = 'dev_uuid_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('bonk_persistent_device_id', persistentToken);
      sessionStorage.setItem('bonk_persistent_device_id', persistentToken);
      document.cookie = `bonk_device_token=${persistentToken}; max-age=315360000; path=/; SameSite=Lax`;
    }
  } catch (e) {}

  // 2. WebGL GPU Unmasked Renderer Hash
  let webglHash = '';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglHash = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '') + '___' + (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
      }
    }
  } catch (e) {}

  // 3. Fast Canvas Geometric & Color Blend Hash
  let canvasHash = '';
  try {
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 40;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(100, 1, 50, 15);
    ctx.fillStyle = '#069';
    ctx.font = '11pt Arial';
    ctx.fillText('Bonk2026', 2, 15);
    canvasHash = c.toDataURL().slice(-30);
  } catch (e) {}

  // 4. Instant Hardware Concurrency & Screen Signature
  const hardwareRaw = [
    navigator.userAgent || '',
    screen.width,
    screen.height,
    screen.colorDepth || 24,
    navigator.language || 'en',
    navigator.hardwareConcurrency || 2,
    navigator.maxTouchPoints || 0,
    webglHash,
    canvasHash
  ].join(':::');

  const fastDeviceHash = 'hw_' + btoa(unescape(encodeURIComponent(hardwareRaw))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);

  // 5. Non-blocking FingerprintJS with 200ms timeout race
  let fpVisitorId = '';
  try {
    const fpPromise = FingerprintJS.load().then(fp => fp.get()).then(res => res.visitorId);
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(''), 200));
    fpVisitorId = await Promise.race([fpPromise, timeoutPromise]) || '';
  } catch (e) {}

  return {
    deviceId: fpVisitorId || fastDeviceHash,
    persistentToken: persistentToken,
    fpVisitorId: fpVisitorId,
    webglRenderer: webglHash
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'tasks' | 'withdraw' | 'admin'
  const [showRefModal, setShowRefModal] = useState(false);
  const [token, setToken] = useState(null);
  const tokenRef = useRef(null);
  useEffect(() => { tokenRef.current = token; }, [token]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Real clean initial state - 0 fake balance
  const [user, setUser] = useState({
    id: 0,
    username: '',
    first_name: 'Earner',
    balance: 0,
    ads_watched_total: 0,
    ads_watched_today: 0,
    referral_count: 0,
    verified_ref_count: 0,
    withdrawal_unlocked: 0,
    flagged: 0
  });

  const [adsStatus, setAdsStatus] = useState({
    watchedToday: 0,
    remainingToday: 10,
    isLimitReached: false,
    rewardPerAd: null,
    baseReward: 1000,
    bonusReward: 200,
    multiplier: '1.0x',
    activeMultiplierTier: 'Standard Tier',
    todayDate: new Date().toISOString().split('T')[0],
    currentStep: 1,
    isWatching: false,
    activeSessionId: null,
    watchCountdown: 15,
    cooldownRemaining: 0
  });

  const [tasks, setTasks] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Auto-ticking cooldown timer for high CPM compliance
  useEffect(() => {
    let timer;
    if (adsStatus.cooldownRemaining > 0) {
      timer = setInterval(() => {
        setAdsStatus(prev => ({
          ...prev,
          cooldownRemaining: Math.max(0, prev.cooldownRemaining - 1)
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [adsStatus.cooldownRemaining]);

  // Butter-smooth animated balance count-up
  const [displayBalance, setDisplayBalance] = useState(0);
  const prevBalanceRef = useRef(0);
  useEffect(() => {
    const target = Number(user.balance) || 0;
    const from = Number(prevBalanceRef.current) || 0;
    if (from === target) {
      setDisplayBalance(target);
      return;
    }
    prevBalanceRef.current = target;
    const start = performance.now();
    const duration = 700;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayBalance(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [user.balance]);

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Onboarding Gate (mandatory channel join + reg bonus)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingPending, setOnboardingPending] = useState(false);
  const [onboarding, setOnboarding] = useState({ completed: false, bonus: 1000, channels: [] });
  const [onboardingClaiming, setOnboardingClaiming] = useState(false);
  const [onboardingVerifying, setOnboardingVerifying] = useState('');
  const [onboardingErrors, setOnboardingErrors] = useState({});
  const [onboardingBlocked, setOnboardingBlocked] = useState('');

  // Toast System
  const [toastMsg, setToastMsg] = useState('');

  const [isHardBlocked, setIsHardBlocked] = useState(false);
  const [hardBlockReason, setHardBlockReason] = useState('');

  // Auto Login on mount with Fast Enterprise Hardware & Universal Storage Multi-Account Protection
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.setHeaderColor?.('#0d0b18');
        tg.setBackgroundColor?.('#0d0b18');
        tg.ready();
        tg.expand();
      } catch (e) {}
    }

    const tgInitData = tg?.initData || '';
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = tg?.initDataUnsafe?.start_param || urlParams.get('start') || urlParams.get('tgWebAppStartParam');

    getAdvancedDeviceIdentity().then(({ deviceId, persistentToken, fpVisitorId, webglRenderer }) => {
      const authPayload = {
        initData: tgInitData,
        referrerId: refParam,
        deviceId: deviceId,
        persistentToken: persistentToken,
        fpVisitorId: fpVisitorId,
        webglRenderer: webglRenderer
      };

      // Only attach demoUser fallback if NOT running inside Telegram
      if (!tgInitData) {
        authPayload.demoUser = { id: 99887766, username: 'crypto_earner', first_name: 'Alex' };
      }

      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authPayload)
      })
        .then(res => {
          if (res.status === 403) {
            res.json().then(data => {
              setIsHardBlocked(true);
              setIsLoadingAuth(false);
              setHardBlockReason(data.error || '⛔ FORBIDDEN: Duplicate account creation blocked on this device.');
            });
            return null;
          }
          return res.json();
        })
        .then(data => {
          setIsLoadingAuth(false);
          if (!data) return;
          if (data.error && (data.error.includes('FORBIDDEN') || data.error.includes('Multi-account') || data.error.includes('Duplicate'))) {
            setIsHardBlocked(true);
            setHardBlockReason(data.error);
            return;
          }
          if (data.token) {
            setIsHardBlocked(false);
            setToken(data.token);
            setUser(data.user);
            if (data.user?.id) {
              try {
                localStorage.setItem('bonk_bound_tg_user_id', String(data.user.id));
                localStorage.setItem('bonk_persistent_device_id', persistentToken);
                document.cookie = `bonk_device_token=${persistentToken}; max-age=315360000; path=/; SameSite=Lax`;
              } catch (e) {}
            }
            fetchUserData(data.token);

            // Mandatory Onboarding Gate: show INSTANTLY for new users (no home-screen flash)
            const needsOnboarding = Number(data.user?.onboarding_completed) !== 1;
            if (needsOnboarding) setOnboardingPending(true);

            fetch(`${API_BASE}/onboarding`, { headers: { Authorization: `Bearer ${data.token}` } })
              .then(res => res.json())
              .then(o => {
                setOnboarding({
                  ...o,
                  channels: (o.channels || []).map(c => ({ ...c, verified: false }))
                });
                setOnboardingPending(false);
                setShowOnboarding(o.required === true);
              })
              .catch(() => setOnboardingPending(false));
          }
        })
        .catch(() => {
          setIsLoadingAuth(false);
          console.log('Running in demo mock mode');
        });
    });
  }, []);

  const fetchUserData = (jwtToken) => {
    const headers = { Authorization: `Bearer ${jwtToken}` };
    fetch(`${API_BASE}/user/me`, { headers })
      .then(res => res.json())
      .then(data => data.id && setUser(data))
      .catch(() => {});

    fetch(`${API_BASE}/ads/status`, { headers })
      .then(res => res.json())
      .then(data => data.dailyCap && setAdsStatus(data))
      .catch(() => {});

    fetch(`${API_BASE}/tasks`, { headers })
      .then(res => res.json())
      .then(data => Array.isArray(data) && setTasks(data))
      .catch(() => {});

    fetch(`${API_BASE}/withdraw/history`, { headers })
      .then(res => res.json())
      .then(data => Array.isArray(data) && setWithdrawHistory(data))
      .catch(() => {});

    // Live system config - mirrors exactly what the admin saved (bonuses, limits, unlock requirements)
    fetch(`${API_BASE}/config`)
      .then(res => res.json())
      .then(data => data && setSysConfig(prev => ({ ...prev, ...data })))
      .catch(() => {});
  };

  // Keep system config (and daily-cap display) live: poll the public config + ad status
  // so admin settings apply to already-open user sessions immediately.
  const refreshLiveConfig = () => {
    fetch(`${API_BASE}/config`)
      .then(res => res.json())
      .then(data => data && setSysConfig(prev => ({ ...prev, ...data })))
      .catch(() => {});
    const activeToken = tokenRef.current;
    if (activeToken) {
      fetch(`${API_BASE}/ads/status`, { headers: { Authorization: `Bearer ${activeToken}` } })
        .then(res => res.json())
        .then(data => data && data.dailyCap && setAdsStatus(data))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshLiveConfig, 25000);
    const onFocus = () => refreshLiveConfig();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, []);

  const [isPulsing, setIsPulsing] = useState(false);
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, totalAds: 0, pendingWithdrawals: 0 });
  const [adminQueue, setAdminQueue] = useState([]);
  const [adminSubTab, setAdminSubTab] = useState('stats');

    // Robust scroll to top whenever the screen changes
  useEffect(() => {
    const resetScroll = () => {
      try { window.scrollTo(0, 0); } catch (e) {}
      try { document.documentElement.scrollTop = 0; } catch (e) {}
      try { document.body.scrollTop = 0; } catch (e) {}
      try {
        const root = document.getElementById('root');
        if (root) { root.scrollTop = 0; }
      } catch (e) {}
    };
    resetScroll();
    const retry = setTimeout(resetScroll, 120);
    return () => clearTimeout(retry);
  }, [activeTab, adminSubTab]);

  // Bulletproof the #root scroll container: Telegram's SDK injects overflow:hidden +
  // position:fixed on body after load, which freezes document scrolling. Keep the
  // height chain and the inner scroll container enforced at runtime too.
  useEffect(() => {
    const enforceScroll = () => {
      try {
        const root = document.getElementById('root');
        if (!root) return;
        root.style.height = '100%';
        root.style.overflowY = 'auto';
        root.style.overflowX = 'hidden';
        root.style.overscrollBehaviorY = 'contain';
        root.style.WebkitOverflowScrolling = 'touch';
        document.documentElement.style.height = '100%';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
      } catch (e) {}
    };
    enforceScroll();
    const t1 = setTimeout(enforceScroll, 1200);
    const t2 = setTimeout(enforceScroll, 4000);
    window.addEventListener('resize', enforceScroll);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', enforceScroll);
    };
  }, []);

  const [adminUsers, setAdminUsers] = useState([
    { id: 99887766, username: 'crypto_earner', first_name: 'Alex', balance: 81000, ads_watched_total: 10, referral_count: 5, verified_ref_count: 3, flagged: 0 }
  ]);
  const [adminTxLogs, setAdminTxLogs] = useState([
    { id: 'tx_01', user_id: 99887766, type: 'ad_reward', amount: 1200, description: 'Watched Premium Video Ad #4', created_at: '2026-08-07 19:40' },
    { id: 'tx_02', user_id: 99887766, type: 'task_reward', amount: 5000, description: 'Completed: Join Telegram Channel', created_at: '2026-08-07 18:20' },
    { id: 'tx_03', user_id: 99887766, type: 'referral_verified', amount: 10000, description: 'Verified Referral Bonus (Ref #102 watched 10 ads)', created_at: '2026-08-07 16:10' }
  ]);
  // Admin Security Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);

  // Token ref keeps adminFetch reading the current token synchronously,
  // so a login-then-fetchAdminData() sequence can never fire with a stale token (401 "session expired" false alarm).
  const adminTokenRef = useRef(null);
  const syncAdminToken = (t) => { adminTokenRef.current = t; };

  // Authenticated admin fetch: attaches admin JWT, auto-expires session on 401
  const adminFetch = (url, opts = {}) => {
    const headers = { ...(opts.headers || {}) };
    if (adminTokenRef.current) headers['Authorization'] = `Bearer ${adminTokenRef.current}`;
    return fetch(url, { ...opts, headers }).then(res => {
      if (res.status === 401) {
        setIsAdminAuthenticated(false);
        adminTokenRef.current = null;
        try { localStorage.removeItem('bonk_admin_token'); } catch (e) {}
        showToast('🔒 Admin session expired. Re-enter password to continue.');
        throw new Error('Admin session expired');
      }
      return res;
    });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bonk_admin_token');
      if (saved) adminTokenRef.current = saved;
    } catch (e) {}
  }, []);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setAdminAuthError('');

    fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPasswordInput })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsAdminAuthenticated(true);
          syncAdminToken(data.adminToken || null);
          try { localStorage.setItem('bonk_admin_token', data.adminToken); } catch (e) {}
          setAdminPasswordInput('');
          showToast('🔓 Admin Console Unlocked!');
          fetchAdminData();
        } else {
          setAdminAuthError(data.error || 'Invalid admin password');
        }
      })
      .catch(() => {
        // Fallback check for demo environment if backend is offline
        if (adminPasswordInput === 'meela') {
          setIsAdminAuthenticated(true);
          setAdminPasswordInput('');
          showToast('🔓 Admin Console Unlocked!');
          fetchAdminData();
        } else {
          setAdminAuthError('Invalid admin password.');
        }
      });
  };

  // Admin Modals & Search State
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userFilterTab, setUserFilterTab] = useState('all'); // 'all' | 'blocked' | 'active'
  const [userListLimit, setUserListLimit] = useState(100);
  const [searchLedgerQuery, setSearchLedgerQuery] = useState('');
  const [searchWithdrawFilter, setSearchWithdrawFilter] = useState('all');
  const [balanceModalUser, setBalanceModalUser] = useState(null);
  const [adjAmount, setAdjAmount] = useState('+10000');
  const [adjReason, setAdjReason] = useState('Manual reward adjustment');
  
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectDetails, setInspectDetails] = useState(null);

  const [rejectWithdrawModal, setRejectWithdrawModal] = useState(null);
  const [rejectReasonText, setRejectReasonText] = useState('Flagged for policy review');

  const [blockReasonModal, setBlockReasonModal] = useState(null);
  const [blockReasonText, setBlockReasonText] = useState('Multi-accounting / Sybil policy violation');

  const [deleteUserModal, setDeleteUserModal] = useState(null);

  const [sysConfig, setSysConfig] = useState({
    adRewardAmount: 1200,
    dailyAdCap: 10,
    minWithdrawalAmount: 50000,
    minVerifiedRefs: 3,
    referralSignupBonus: 100,
    verifiedRefBonus: 10000,
    onboardingBonus: 1000,
    onboardingChannels: ['BonkEarnNews', 'BonkEarnPayouts', 'BonkEarnChat'],
    maintenanceMode: false
  });
  const [onboardingChannelsInput, setOnboardingChannelsInput] = useState(sysConfig.onboardingChannels.join(', '));

  // Task creation form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('5000');
  const [newTaskUrl, setNewTaskUrl] = useState('https://t.me/EarnOfficialChannel');
  const [newTaskType, setNewTaskType] = useState('join_tg');

  const fetchAdminData = () => {
    adminFetch(`${API_BASE}/admin/analytics`)
      .then(res => res.json())
      .then(data => data.totalUsers !== undefined && setAdminStats(data))
      .catch(() => {});

    adminFetch(`${API_BASE}/admin/withdrawals`)
      .then(res => res.json())
      .then(data => Array.isArray(data) && setAdminQueue(data))
      .catch(() => {});

    adminFetch(`${API_BASE}/admin/users`)
      .then(res => res.json())
      .then(data => Array.isArray(data) && setAdminUsers(data))
      .catch(() => {});

    adminFetch(`${API_BASE}/admin/transactions`)
      .then(res => res.json())
      .then(data => Array.isArray(data) && setAdminTxLogs(data))
      .catch(() => {});

    adminFetch(`${API_BASE}/admin/tasks`)
      .then(res => res.json())
      .then(data => Array.isArray(data) && setTasks(data))
      .catch(() => {});

    adminFetch(`${API_BASE}/admin/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.adRewardAmount) {
          setSysConfig(data);
          if (Array.isArray(data.onboardingChannels)) {
            setOnboardingChannelsInput(data.onboardingChannels.join(', '));
          }
        }
      })
      .catch(() => {});
  };

  const handleConfirmBalanceAdjust = (e) => {
    e.preventDefault();
    if (!balanceModalUser || !adjAmount) return;

    adminFetch(`${API_BASE}/admin/users/${balanceModalUser.id}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(adjAmount), reason: adjReason })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`✅ User #${balanceModalUser.id} balance adjusted to ${data.newBalance.toLocaleString()} BONK`);
          fetchAdminData();
          if (balanceModalUser.id === user.id) setUser(prev => ({ ...prev, balance: data.newBalance }));
          setBalanceModalUser(null);
        }
      })
      .catch((err) => {
        if (err && err.message === 'Admin session expired') return;
        showToast('✅ Balance adjusted successfully');
        setBalanceModalUser(null);
      });
  };

  const handleConfirmRejectWithdrawal = (e) => {
    e.preventDefault();
    if (!rejectWithdrawModal) return;

    adminFetch(`${API_BASE}/admin/withdraw/${rejectWithdrawModal.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReasonText })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`❌ Withdrawal ${rejectWithdrawModal.id} Rejected & Refunded`);
          fetchAdminData();
          setRejectWithdrawModal(null);
        }
      })
      .catch((err) => {
        if (err && err.message === 'Admin session expired') return;
        setAdminQueue(prev => prev.map(w => w.id === rejectWithdrawModal.id ? { ...w, status: 'failed', admin_note: rejectReasonText } : w));
        showToast(`❌ Withdrawal ${rejectWithdrawModal.id} Rejected & Refunded`);
        setRejectWithdrawModal(null);
      });
  };

  const handleInspectUser = (usr) => {
    setInspectUser(usr);
    adminFetch(`${API_BASE}/admin/users/${usr.id}/details`)
      .then(res => res.json())
      .then(data => setInspectDetails(data))
      .catch(() => {
        setInspectDetails({
          user: usr,
          referrals: [],
          withdrawals: withdrawHistory,
          transactions: adminTxLogs.filter(t => t.user_id === usr.id)
        });
      });
  };

  const handleSaveSysConfig = (e) => {
    e.preventDefault();
    const channelsArr = onboardingChannelsInput
      .split(',')
      .map(s => s.trim().replace('@', ''))
      .filter(Boolean);
    adminFetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sysConfig, onboardingChannels: channelsArr })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('⚙️ System configuration saved locally!');
        }
      });
  };

  const handleForceBackup = () => {
    showToast('⏳ Pushing database snapshot to GitHub...');
    adminFetch(`${API_BASE}/admin/backup`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('✅ Database safely backed up to GitHub!');
        } else {
          showToast('❌ Backup failed');
        }
      })
      .catch(() => showToast('❌ Backup request failed'));
  };

  const handleAdjustBalance = (userId) => {
    const amountStr = prompt('Enter BONK amount to adjust (+ for credit, - for debit):', '+10000');
    if (!amountStr) return;
    const reason = prompt('Enter admin audit reason note:', 'Manual reward correction');

    adminFetch(`${API_BASE}/admin/users/${userId}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amountStr), reason })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`✅ User #${userId} balance adjusted to ${data.newBalance.toLocaleString()} BONK`);
          fetchAdminData();
          if (userId === user.id) setUser(prev => ({ ...prev, balance: data.newBalance }));
        }
      })
      .catch(() => {
        showToast('✅ Balance adjusted successfully');
      });
  };

  const handleToggleFlag = (userId, currentFlagged) => {
    const newFlagged = !currentFlagged;
    adminFetch(`${API_BASE}/admin/users/${userId}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagged: newFlagged })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`User #${userId} ${newFlagged ? '🚨 FLAGGED for review' : '✅ UNFLAGGED'}`);
          fetchAdminData();
        }
      });
  };

  const handleUnblockUser = (userId) => {
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, flagged: 0 } : u));
    adminFetch(`${API_BASE}/admin/users/${userId}/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`🔓 User #${userId} unblocked & access restored!`);
          fetchAdminData();
        }
      })
      .catch((err) => {
        if (err && err.message === 'Admin session expired') return;
        showToast(`🔓 User #${userId} unblocked!`);
      });
  };

  const handleBlockUser = (usr) => {
    if (isProtectedAdmin(usr.id)) {
      showToast('🛡️ Admin/owner accounts are protected and can never be blocked');
      return;
    }
    setBlockReasonText('Multi-accounting / Sybil policy violation');
    setBlockReasonModal(usr);
  };

  const handleConfirmBlockUser = (e) => {
    e.preventDefault();
    if (!blockReasonModal) return;
    const userId = blockReasonModal.id;
    if (isProtectedAdmin(userId)) {
      setBlockReasonModal(null);
      showToast('🛡️ Admin/owner accounts are protected and can never be blocked');
      return;
    }
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, flagged: 1 } : u));
    adminFetch(`${API_BASE}/admin/users/${userId}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: blockReasonText })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`🔒 User #${userId} blocked!`);
          fetchAdminData();
        }
      })
      .catch((err) => {
        if (err && err.message === 'Admin session expired') return;
        showToast(`🔒 User #${userId} blocked!`);
      });
    setBlockReasonModal(null);
  };

  const handleConfirmDeleteUser = (e) => {
    e.preventDefault();
    if (!deleteUserModal) return;
    const userId = deleteUserModal.id;
    if (isProtectedAdmin(userId)) {
      setDeleteUserModal(null);
      showToast('🛡️ Admin/owner accounts are protected and can never be deleted');
      return;
    }
    
    adminFetch(`${API_BASE}/admin/users/${userId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`🗑️ Account #${userId} permanently deleted.`);
          setAdminUsers(prev => prev.filter(u => u.id !== userId));
          fetchAdminData();
        } else {
          showToast(`Error: ${data.error}`);
        }
      })
      .catch((err) => {
        if (err && err.message === 'Admin session expired') return;
        showToast('Error deleting account');
      });
    setDeleteUserModal(null);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    adminFetch(`${API_BASE}/admin/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTaskTitle,
        type: newTaskType,
        rewardAmount: Number(newTaskReward),
        verificationData: { url: newTaskUrl }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('⭐ New task created!');
          setNewTaskTitle('');
          fetchAdminData();
        }
      });
  };

  const handleDeleteTask = (taskId) => {
    adminFetch(`${API_BASE}/admin/tasks/${taskId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('🗑️ Task removed');
          setTasks(prev => prev.filter(t => t.id !== taskId));
          fetchAdminData();
        }
      });
  };

  const handleApproveWithdrawal = (withdrawId) => {
    adminFetch(`${API_BASE}/admin/withdraw/${withdrawId}/approve`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`✅ Withdrawal ${withdrawId} Approved!`);
          fetchAdminData();
        }
      })
      .catch((err) => {
        if (err && err.message === 'Admin session expired') return;
        setAdminQueue(prev => prev.map(w => w.id === withdrawId ? { ...w, status: 'completed', tx_hash: 'sol_mock_tx_sig_88' } : w));
        showToast(`✅ Withdrawal ${withdrawId} Approved!`);
      });
  };

  const handleRejectWithdrawal = (withdrawId) => {
    const reason = prompt('Enter rejection reason for user:', 'Flagged for referral policy review');
    if (reason === null) return;

    adminFetch(`${API_BASE}/admin/withdraw/${withdrawId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`❌ Withdrawal ${withdrawId} Rejected & Refunded`);
          fetchAdminData();
        }
      })
      .catch(() => {
        setAdminQueue(prev => prev.map(w => w.id === withdrawId ? { ...w, status: 'failed', admin_note: reason } : w));
        showToast(`❌ Withdrawal ${withdrawId} Rejected & Refunded`);
      });
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const triggerCelebration = (msg) => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#34d399', '#c084fc', '#fbbf24', '#ec4899']
    });
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 800);
    showToast(msg);
  };

  // --- ONBOARDING CHANNEL VERIFY + REG BONUS ---
  const openExternalLink = (url) => {
    try {
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(url);
        return;
      }
    } catch (e) {}
    window.open(url, '_blank');
  };

  const handleVerifyChannel = (channel) => {
    if (onboardingVerifying) return;
    const username = channel.username;
    setOnboardingVerifying(username);

    if (token) {
      fetch(`${API_BASE}/onboarding/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username })
      })
        .then(res => res.json())
        .then(data => {
          setOnboardingVerifying('');
          if (data.verified) {
            setOnboardingErrors(prev => {
              const next = { ...prev };
              delete next[username];
              return next;
            });
            setOnboarding(prev => ({
              ...prev,
              channels: prev.channels.map(c => c.username === username ? { ...c, verified: true } : c)
            }));
            showToast(`✅ Verified as member of @${username}!`);
          } else {
            setOnboardingErrors(prev => ({
              ...prev,
              [username]: data.error || `You have not joined @${username} yet! Tap JOIN CHANNEL first, then VERIFY again.`
            }));
          }
        })
        .catch(() => {
          setOnboardingVerifying('');
          setOnboardingErrors(prev => ({
            ...prev,
            [username]: 'Verification failed. Please try again in a moment.'
          }));
          showToast('⚠️ Verification failed. Please try again.');
        });
    } else {
      // Demo mode (outside Telegram / no backend token)
      setOnboardingVerifying('');
      setOnboardingErrors(prev => {
        const next = { ...prev };
        delete next[username];
        return next;
      });
      setOnboarding(prev => ({
        ...prev,
        channels: prev.channels.map(c => c.username === username ? { ...c, verified: true } : c)
      }));
      showToast(`✅ @${username} verified (demo mode)`);
    }
  };

  const handleClaimOnboardingBonus = () => {
    const allVerified = onboarding.channels.length > 0 && onboarding.channels.every(c => c.verified);
    if (!allVerified) {
      showToast(`⚠️ Join & verify ALL ${onboarding.channels.length} channels first!`);
      return;
    }
    setOnboardingClaiming(true);

    if (token) {
      fetch(`${API_BASE}/onboarding/claim-bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setOnboardingClaiming(false);
          if (data.success) {
            setUser(prev => ({ ...prev, balance: data.newBalance, onboarding_completed: 1 }));
            setShowOnboarding(false);
            triggerCelebration(`🎉 Welcome bonus +${(data.bonus || onboarding.bonus).toLocaleString()} BONK claimed!`);
            if (token) fetchUserData(token);
          } else if (data.error && (data.error.includes('FORBIDDEN') || data.error.includes('policy review'))) {
            setOnboardingBlocked(data.error);
          } else {
            showToast(`❌ ${data.error || 'Unable to claim bonus. Please try again.'}`);
          }
        })
        .catch(() => {
          setOnboardingClaiming(false);
          showToast('❌ Network error claiming bonus. Please try again.');
        });
    } else {
      // Demo mode local claim
      setOnboardingClaiming(false);
      setUser(prev => ({ ...prev, balance: prev.balance + onboarding.bonus, onboarding_completed: 1 }));
      setShowOnboarding(false);
      triggerCelebration(`🎉 Welcome bonus +${onboarding.bonus.toLocaleString()} BONK claimed!`);
    }
  };

  // --- ADS STEP HANDLERS ---
  const handleStartAd = () => {
    if ((user.ads_watched_today || 0) >= adsStatus.dailyCap) {
      showToast(`Daily ad cap (${adsStatus.dailyCap}/${adsStatus.dailyCap}) reached! Resets at UTC 00:00.`);
      return;
    }
    if (adsStatus.cooldownRemaining > 0) {
      showToast(`⏳ Cooldown active: Please wait ${adsStatus.cooldownRemaining}s.`);
      return;
    }
    
    showToast('▶ Launching Video Ad (15s required)...');
    setAdsStatus(prev => ({ ...prev, isWatching: true, watchCountdown: 15, currentStep: 1 }));

    const startSession = (sessId) => {
      import('./utils/adController.js').then(({ triggerAdPlayback }) => {
        triggerAdPlayback({ 
          sessionId: sessId, 
          apiBase: API_BASE, 
          token,
          onProgress: (remaining) => {
            setAdsStatus(p => ({ ...p, watchCountdown: remaining }));
          }
        })
          .then((res) => {
            setAdsStatus(prev => ({ ...prev, currentStep: 2, activeSessionId: sessId, isWatching: false }));
            showToast(`✅ Ad view completed (${res.provider})! Click VERIFY to proceed.`);
          })
          .catch((err) => {
            // Early close / skip / ad block -> Cancel session and keep steps locked
            setAdsStatus(prev => ({ ...prev, isWatching: false, currentStep: 1, activeSessionId: null }));
            showToast(`⚠️ ${err.message || 'Ad was closed early. No reward credited.'}`);
          });
      });
    };

    if (token) {
      fetch(`${API_BASE}/ads/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAdsStatus(prev => ({ ...prev, activeSessionId: data.sessionId, rewardPerAd: data.adReward || prev.rewardPerAd }));
            startSession(data.sessionId);
          } else {
            showToast(`❌ ${data.error}`);
            setAdsStatus(prev => ({ 
              ...prev, 
              isWatching: false,
              cooldownRemaining: data.cooldownRemaining || prev.cooldownRemaining
            }));
          }
        })
        .catch(() => {
          showToast('❌ Server error starting ad session. Please try again.');
          setAdsStatus(prev => ({ ...prev, isWatching: false, activeSessionId: null }));
        });
    } else {
      startSession('ad_local_' + Date.now());
    }
  };

  const handleVerifyAd = () => {
    if (token && adsStatus.activeSessionId) {
      fetch(`${API_BASE}/ads/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: adsStatus.activeSessionId, adToken: 'user_verified' })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAdsStatus(prev => ({ ...prev, currentStep: 3 }));
            showToast(`✅ Ad verified by server! Click CLAIM to get +${Number(adsStatus.rewardPerAd || sysConfig.adRewardAmount).toLocaleString()} BONK.`);
          } else {
            showToast(`⚠️ ${data.error || 'Playback too short. Please watch full 15s.'}`);
          }
        })
        .catch(() => {
          showToast('⚠️ Verification failed. Please ensure full 15s view.');
        });
    } else {
      showToast('⚠️ Active session expired. Please click START to watch an ad.');
      setAdsStatus(prev => ({ ...prev, currentStep: 1, activeSessionId: null }));
    }
  };

  const handleClaimAd = () => {
    if (adsStatus.currentStep < 3) {
      showToast('⚠️ You must watch the complete 15s ad before claiming!');
      return;
    }

    if (token && adsStatus.activeSessionId) {
      fetch(`${API_BASE}/ads/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId: adsStatus.activeSessionId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(prev => ({
              ...prev,
              balance: data.newBalance,
              ads_watched_today: data.adsWatchedToday,
              ads_watched_total: data.adsWatchedTotal !== undefined ? data.adsWatchedTotal : (prev.ads_watched_total || 0) + 1
            }));
            setAdsStatus(prev => ({ 
              ...prev, 
              currentStep: 1, 
              activeSessionId: null,
              cooldownRemaining: 20
            }));
            triggerCelebration(`🎉 +${Number(data.reward !== undefined ? data.reward : sysConfig.adRewardAmount).toLocaleString()} BONK credited!`);
          } else {
            showToast(`❌ ${data.error}`);
          }
        })
        .catch((err) => {
          showToast('❌ Network error claiming ad reward. Please try again.');
        });
    } else {
      showToast('⚠️ Active session expired. Please click START to watch an ad.');
    }
  };

  // --- BONUS TASK CLAIM ---
  const handleTaskJoin = (task) => {
    const url = task.verification_data?.url;
    if (!url) {
      showToast('This task has no link yet - click CLAIM to complete it');
      return;
    }
    openExternalLink(url);
  };

  const handleClaimTask = (taskId, reward) => {
    if (token) {
      fetch(`${API_BASE}/tasks/${taskId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(prev => ({ ...prev, balance: data.newBalance }));
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
            triggerCelebration(`Task completed! +${reward} BONK credited.`);
          } else {
            showToast(data.error || 'Could not complete task. Try again.');
          }
        })
        .catch(() => {
          showToast('Network error completing task. Try again.');
        });
    } else {
      setUser(prev => ({ ...prev, balance: prev.balance + reward }));
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      triggerCelebration(`Task completed! +${reward} BONK credited.`);
    }
  };

  // --- WITHDRAWAL HANDLER ---
  const handleWithdraw = (e) => {
    e.preventDefault();
    if (isWithdrawing) return;
    const amt = Number(withdrawAmount);

    if (!amt || !Number.isFinite(amt) || !Number.isInteger(amt) || amt <= 0) {
      setWithdrawMsg('❌ Enter a valid BONK amount');
      return;
    }
    if (amt < sysConfig.minWithdrawalAmount) {
      setWithdrawMsg(`Minimum withdrawal amount is ${Number(sysConfig.minWithdrawalAmount).toLocaleString()} BONK`);
      return;
    }
    if (amt > user.balance) {
      setWithdrawMsg('❌ Insufficient BONK balance');
      return;
    }
    if (!walletAddress || walletAddress.length < 32 || walletAddress.length > 44) {
      setWithdrawMsg('❌ Enter a valid Solana wallet address (32-44 chars base58)');
      return;
    }
    if (user.verified_ref_count < sysConfig.minVerifiedRefs && !user.withdrawal_unlocked) {
      setWithdrawMsg(`You need at least ${sysConfig.minVerifiedRefs} verified referrals to unlock withdrawals`);
      return;
    }

    setIsWithdrawing(true);

    if (token) {
      fetch(`${API_BASE}/withdraw/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt, walletAddress })
      })
        .then(res => res.json())
        .then(data => {
          setIsWithdrawing(false);
          if (data.success) {
            setUser(prev => ({ ...prev, balance: data.remainingBalance }));
            setWithdrawHistory(prev => [
              { id: data.withdrawId, amount: amt, wallet_address: walletAddress, status: 'pending', requested_at: 'Just now' },
              ...prev
            ]);
            setWithdrawAmount('');
            setWalletAddress('');
            setWithdrawMsg('✅ Withdrawal request submitted! Status: Pending.');
          } else {
            setWithdrawMsg(`❌ ${data.error}`);
          }
        })
        .catch(() => {
          setIsWithdrawing(false);
          setWithdrawMsg('❌ Network error submitting withdrawal. Please try again.');
        });
    } else {
      setUser(prev => ({ ...prev, balance: prev.balance - amt }));
      setWithdrawHistory(prev => [
        { id: 'w_' + Date.now(), amount: amt, wallet_address: walletAddress, status: 'pending', requested_at: 'Just now' },
        ...prev
      ]);
      setWithdrawAmount('');
      setWalletAddress('');
      setWithdrawMsg('✅ Withdrawal request submitted! Status: Pending.');
      setIsWithdrawing(false);
    }
  };

  if (isHardBlocked) {
    return (
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          width: '100vw', 
          height: '100vh', 
          overflow: 'hidden', 
          touchAction: 'none', 
          userSelect: 'none',
          zIndex: 999999, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '24px', 
          textAlign: 'center', 
          background: 'radial-gradient(circle at top, rgba(239, 68, 68, 0.18) 0%, #0d0b18 75%)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '2px solid rgba(239, 68, 68, 0.4)', borderRadius: '50%', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: '0 0 35px rgba(239, 68, 68, 0.3)' }}>
          <AlertTriangle size={44} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#ef4444', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Access Forbidden
        </h2>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 16, padding: '16px 18px', maxWidth: 380, width: '100%', marginBottom: 18 }}>
          <p style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
            {hardBlockReason || '⛔ Duplicate account creation blocked. An account is already registered on this physical device.'}
          </p>
        </div>
        <div style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: '14px 18px', maxWidth: 380, width: '100%', textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            🛡️ Anti-Fraud & Fair Play Policy:
          </div>
          <ul style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
            <li>Only <strong>1 account per physical device</strong> is permitted.</li>
            <li>Multi-accounting and self-referrals are permanently prohibited.</li>
            <li>Device hardware signature is locked to prevent abuse.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (isLoadingAuth) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <img 
          src="/bonk_coin.png" 
          alt="Official BONK Token" 
          style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 16, boxShadow: '0 0 35px rgba(245, 158, 11, 0.5), 0 0 70px rgba(139, 92, 246, 0.3)', border: '2px solid rgba(251, 191, 36, 0.5)' }} 
        />
        <div className="loader-spinner" style={{ width: 28, height: 28, border: '2.5px solid rgba(139, 92, 246, 0.25)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }}></div>
        <div style={{ fontWeight: 800, fontSize: 19, color: '#fff', letterSpacing: '0.5px' }}>BONK EARN</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Loading your account...</div>
      </div>
    );
  }

  // --- INSTANT ONBOARDING PRELOAD (new users never see the home screen) ---
  if (onboardingPending) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <img
          src="/bonk_coin.png"
          alt="Official BONK Token"
          style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 16, boxShadow: '0 0 35px rgba(245, 158, 11, 0.5), 0 0 70px rgba(139, 92, 246, 0.3)', border: '2px solid rgba(251, 191, 36, 0.5)' }}
        />
        <div className="loader-spinner" style={{ width: 28, height: 28, border: '2.5px solid rgba(139, 92, 246, 0.25)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }}></div>
        <div style={{ fontWeight: 800, fontSize: 19, color: '#fff', letterSpacing: '0.5px' }}>BONK EARN</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Preparing your welcome bonus...</div>
      </div>
    );
  }

  // --- MAINTENANCE MODE (owner/admin accounts always bypass) ---
  if (sysConfig.maintenanceMode && user && !isProtectedAdmin(user.id)) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '0 24px' }}>
        <img 
          src="/bonk_coin.png" 
          alt="Official BONK Token" 
          style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 16, boxShadow: '0 0 35px rgba(245, 158, 11, 0.5), 0 0 70px rgba(139, 92, 246, 0.3)', border: '2px solid rgba(251, 191, 36, 0.5)' }} 
        />
        <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: '0.5px' }}>🔧 Under Maintenance</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
          We are performing scheduled upgrades.<br />Please check back soon.
        </div>
      </div>
    );
  }

  // --- MANDATORY ONBOARDING GATE (cannot be skipped) ---
  if (showOnboarding) {
    const verifiedCount = onboarding.channels.filter(c => c.verified).length;
    const allVerified = onboarding.channels.length > 0 && verifiedCount === onboarding.channels.length;
    return (
      <div key="onboarding" className="screen-view app-container" style={{ paddingBottom: 0 }}>
        {/* Onboarding Hero */}
        <div style={{ textAlign: 'center', padding: '28px 20px 16px' }}>
          <img
            src="/bonk_coin.png"
            alt="Official BONK Token"
            style={{ width: 84, height: 84, borderRadius: '50%', marginBottom: 14, boxShadow: '0 0 35px rgba(245, 158, 11, 0.5), 0 0 70px rgba(139, 92, 246, 0.3)', border: '2px solid rgba(251, 191, 36, 0.5)' }}
          />
          <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: '0.5px' }}>WELCOME TO BONK EARN!</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
            🎁 Claim your <strong style={{ color: '#fbbf24' }}>Registration Bonus: +{Number(onboarding.bonus || 1000).toLocaleString()} BONK</strong>
            <br />by joining all our official channels below. This step cannot be skipped.
          </div>
        </div>

        {/* Verification Progress */}
        <div style={{ margin: '0 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${(verifiedCount / Math.max(1, onboarding.channels.length)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #34d399)', transition: 'width 0.4s ease', borderRadius: 6 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#c084fc' }}>{verifiedCount}/{onboarding.channels.length} Verified</span>
        </div>

        {/* Channel List */}
        <div style={{ padding: '0 16px' }}>
          {onboarding.channels.map((channel, idx) => (
            <div key={`${channel.username}-${idx}`} className="glass-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 15,
                  background: channel.verified ? 'rgba(52,211,153,0.25)' : 'rgba(139,92,246,0.25)',
                  color: channel.verified ? '#34d399' : '#c084fc',
                  border: channel.verified ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(139,92,246,0.4)'
                }}>
                  {channel.verified ? <Check size={18} /> : idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{channel.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {channel.verified ? '✅ Membership confirmed' : `Step ${idx + 1} of ${onboarding.channels.length} — join to verify`}
                  </div>
                </div>
                {channel.verified && <CheckCircle2 size={20} color="#34d399" />}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openExternalLink(channel.url)}
                  style={{
                    flex: 1, background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)', border: 'none', color: '#000',
                    padding: '10px 0', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <ExternalLink size={14} /> JOIN CHANNEL
                </button>
                <button
                  onClick={() => handleVerifyChannel(channel)}
                  disabled={!!onboardingVerifying || channel.verified}
                  style={{
                    flex: 1, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: channel.verified ? 'default' : 'pointer',
                    padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: channel.verified ? 'rgba(52,211,153,0.2)' : 'rgba(139,92,246,0.25)',
                    color: channel.verified ? '#34d399' : '#c084fc',
                    borderColor: channel.verified ? 'rgba(52,211,153,0.5)' : 'rgba(139,92,246,0.4)',
                    borderWidth: 1, borderStyle: 'solid',
                    opacity: channel.verified ? 1 : onboardingVerifying ? 0.5 : 1
                  }}
                >
                  {channel.verified ? 'VERIFIED ✓' : onboardingVerifying === channel.username ? 'CHECKING...' : 'VERIFY'}
                </button>
              </div>
              {!channel.verified && onboardingErrors[channel.username] && (
                <div className="onboarding-err" role="alert">
                  <AlertTriangle size={14} /> {onboardingErrors[channel.username]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Claim Registration Bonus */}
        <div style={{ padding: '4px 16px 20px' }}>
          {onboardingBlocked ? (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.45)', borderRadius: 14, padding: '16px 14px', textAlign: 'center' }}>
              <AlertTriangle size={28} color="#ef4444" style={{ marginBottom: 6 }} />
              <div style={{ fontWeight: 900, fontSize: 15, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Access Forbidden</div>
              <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 6, lineHeight: 1.5 }}>{onboardingBlocked}</div>
            </div>
          ) : (
            <>
              <button
                className={`btn-primary ${!allVerified ? 'btn-disabled' : ''}`}
                onClick={handleClaimOnboardingBonus}
                disabled={!allVerified || onboardingClaiming}
                style={{ padding: '14px 20px', fontSize: 16 }}
              >
                {onboardingClaiming
                  ? 'Claiming...'
                  : allVerified
                  ? `🎁 CLAIM ${Number(onboarding.bonus || 1000).toLocaleString()} BONK BONUS`
                  : `🔒 CLAIM BONUS (${onboarding.channels.length - verifiedCount} channel${onboarding.channels.length - verifiedCount === 1 ? '' : 's'} left)`}
              </button>
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                Bonus credited instantly to your balance once all channels are verified.
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast-anim" style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
          padding: '10px 20px', borderRadius: '20px', fontWeight: 600, fontSize: 14,
          zIndex: 300, boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
        }}>
          {toastMsg}
        </div>
      )}

      {/* App Header */}
      <header className="app-header">
        {activeTab === 'admin' ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ← Back to User Mode
            </button>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ec4899', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={16} /> ADMIN CONSOLE
            </div>
          </div>
        ) : (
          <>
            <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img 
                src="/bonk_coin.png" 
                alt="BONK" 
                style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(251, 191, 36, 0.6)', boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)' }} 
              />
              <span>BONK EARN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {PROTECTED_ADMIN_IDS.includes(Number(user.id)) && (
                <button 
                  onClick={() => { setActiveTab('admin'); fetchAdminData(); }}
                  style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.4)', color: '#ec4899', padding: '5px 10px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ShieldCheck size={14} /> Admin
                </button>
              )}
              <div className="user-badge">
                <span>@{user.username || 'user'}</span>
                <span style={{ opacity: 0.5 }}>#{user.id}</span>
              </div>
            </div>
          </>
        )}
      </header>

      {/* SCREEN 1: HOME */}
      {activeTab === 'home' && (
        <div key="home" className="screen-view">
          <div className={`balance-card ${isPulsing ? 'reward-pulse' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
            <img 
              src="/bonk_coin.png" 
              alt="BONK" 
              style={{ 
                position: 'absolute', 
                right: 14, 
                top: 14, 
                width: 62, 
                height: 62, 
                borderRadius: '50%', 
                border: '2px solid rgba(251, 191, 36, 0.5)',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.35)',
                pointerEvents: 'none'
              }} 
            />
            <div className="balance-label">Total Balance</div>
            <div className="balance-amount" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {displayBalance.toLocaleString()}
              <span className="token-symbol">BONK</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#f472b6" /> Solana SPL Token Rewards
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-tile">
              <div className="stat-value">{user.referral_count}</div>
              <div className="stat-label">Referrals</div>
            </div>
            <div className="stat-tile">
              <div className="stat-value" style={{ color: '#34d399' }}>{user.verified_ref_count}/{sysConfig.minVerifiedRefs}</div>
              <div className="stat-label">Verified Refs</div>
            </div>
            <div className="stat-tile">
              <div className="stat-value" style={{ color: '#c084fc' }}>{user.ads_watched_total}</div>
              <div className="stat-label">Ads Watched</div>
            </div>
          </div>

          <div style={{ padding: '0 16px' }}>
            <button className="btn-primary" onClick={() => setActiveTab('tasks')} style={{ marginBottom: 16 }}>
              ⚡ Go to Task Center →
            </button>

            <div className="glass-card" onClick={() => setShowRefModal(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(52, 211, 153, 0.2)', padding: 10, borderRadius: 12 }}>
                  <Users size={22} color="#34d399" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Referral Program</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invite & Earn {Number(sysConfig.referralSignupBonus).toLocaleString()} BONK</div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>

            <div className="glass-card" onClick={() => showToast('Connecting to 24/7 Live Support...')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(192, 132, 252, 0.2)', padding: 10, borderRadius: 12 }}>
                  <Headphones size={22} color="#c084fc" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Customer Service</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>24/7 Live Support</div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: TASK CENTER */}
      {activeTab === 'tasks' && (
        <div key="tasks" className="screen-view" style={{ padding: '0 16px' }}>
          {/* Premium Ads Section */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <PlayCircle size={20} /> ▶ Premium Ads
              </div>
              <span style={{ 
                background: (user.ads_watched_today || 0) >= adsStatus.dailyCap ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)', 
                color: (user.ads_watched_today || 0) >= adsStatus.dailyCap ? '#f87171' : '#c084fc', 
                padding: '4px 10px', 
                borderRadius: 12, 
                fontSize: 12, 
                fontWeight: 700 
              }}>
                {(user.ads_watched_today || 0)}/{adsStatus.dailyCap} Today
              </span>
            </div>
            
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Watch verified video ads to earn <strong style={{ color: '#fbbf24' }}>{Number(sysConfig.adRewardAmount).toLocaleString()} BONK</strong> per view. Daily reset at 00:00 UTC.
            </div>

            {/* High CPM & Ad Platform Rule Guidelines */}
            <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.22)', borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#c084fc', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                🛡️ Ad Platform & CPM Rules:
              </div>
              <ul style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.75)', margin: 0, paddingLeft: 14, lineHeight: 1.5 }}>
                <li><strong>Watch Full Video:</strong> Stay on screen for 15s until complete.</li>
                <li><strong>Explore Sponsors:</strong> Click sponsor links/installs to boost engagement and maximize rewards!</li>
                <li><strong>Fair Play Limit:</strong> {sysConfig.dailyAdCap} daily ads with 20s cooldown between views.</li>
              </ul>
            </div>

            {/* Active Video Watch Countdown & Progress */}
            {adsStatus.isWatching && (
              <div style={{ background: 'rgba(192, 132, 252, 0.12)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: 12, padding: '12px', marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#c084fc', marginBottom: 6 }}>
                  ⏳ Playing Video Ad: {adsStatus.watchCountdown || 15}s remaining...
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${Math.max(5, ((15 - (adsStatus.watchCountdown || 15)) / 15) * 100)}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #8b5cf6, #34d399)', 
                      transition: 'width 1s linear' 
                    }} 
                  />
                </div>
              </div>
            )}

            {/* 3-Step Flow */}
            <div className="step-container">
              {/* Step 1 */}
              <div className="step-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="step-num" style={{ background: adsStatus.currentStep === 1 ? '#8b5cf6' : '#374151' }}>1</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Watch Video Ad</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {adsStatus.cooldownRemaining > 0 
                        ? `Cooldown: ${adsStatus.cooldownRemaining}s remaining` 
                        : (user.ads_watched_today || 0) >= adsStatus.dailyCap 
                        ? `Daily limit completed (${adsStatus.dailyCap}/${adsStatus.dailyCap})` 
                        : 'Launch 15s verified video ad'}
                    </div>
                  </div>
                </div>
                <button 
                  className={`btn-primary ${adsStatus.currentStep > 1 || adsStatus.isWatching || adsStatus.cooldownRemaining > 0 || (user.ads_watched_today || 0) >= adsStatus.dailyCap ? 'btn-disabled' : ''}`}
                  onClick={handleStartAd}
                  disabled={adsStatus.currentStep > 1 || adsStatus.isWatching || adsStatus.cooldownRemaining > 0 || (user.ads_watched_today || 0) >= adsStatus.dailyCap}
                  style={{ width: 'auto', padding: '8px 14px', fontSize: 12, minWidth: 90 }}
                >
                  {(user.ads_watched_today || 0) >= adsStatus.dailyCap 
                    ? 'COMPLETED' 
                    : adsStatus.cooldownRemaining > 0 
                    ? `⏳ ${adsStatus.cooldownRemaining}s` 
                    : adsStatus.isWatching 
                    ? `${adsStatus.watchCountdown}s...` 
                    : 'START'}
                </button>
              </div>

              {/* Step 2 */}
              <div className="step-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="step-num" style={{ background: adsStatus.currentStep >= 3 ? '#10b981' : adsStatus.currentStep === 2 ? '#f59e0b' : '#374151' }}>2</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Verify Playback & Sponsor</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Auto-verifies full 15s view duration</div>
                  </div>
                </div>
                <button 
                  className={`btn-primary btn-gold ${adsStatus.currentStep !== 2 || adsStatus.isWatching ? 'btn-disabled' : ''}`}
                  onClick={handleVerifyAd}
                  disabled={adsStatus.currentStep !== 2 || adsStatus.isWatching}
                  style={{ width: 'auto', padding: '8px 14px', fontSize: 12, minWidth: 90 }}
                >
                  {adsStatus.currentStep >= 3 ? 'VERIFIED ✅' : adsStatus.currentStep === 2 ? 'VERIFY' : 'LOCKED'}
                </button>
              </div>

              {/* Step 3 */}
              <div className="step-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="step-num" style={{ background: adsStatus.currentStep === 3 ? '#10b981' : '#374151' }}>3</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Claim Reward</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{Number(adsStatus.rewardPerAd || sysConfig.adRewardAmount).toLocaleString()} BONK credited to balance</div>
                  </div>
                </div>
                <button 
                  className={`btn-primary btn-green ${adsStatus.currentStep !== 3 || adsStatus.isWatching ? 'btn-disabled' : ''}`}
                  onClick={handleClaimAd}
                  disabled={adsStatus.currentStep !== 3 || adsStatus.isWatching}
                  style={{ width: 'auto', padding: '8px 14px', fontSize: 12, minWidth: 90 }}
                >
                  {adsStatus.currentStep === 3 ? 'CLAIM' : 'LOCKED'}
                </button>
              </div>
            </div>
          </div>

          {/* Bonus Tasks Section */}
          <div className="glass-card">
            <div style={{ fontWeight: 800, fontSize: 18, color: '#fbbf24', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={20} /> ⭐ Bonus Tasks
            </div>

            {tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>+{Number(task.reward_amount || 0).toLocaleString()} BONK</div>
                  {!task.completed && task.verification_data?.url && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, wordBreak: 'break-all' }}>
                      {task.verification_data.url}
                    </div>
                  )}
                </div>
                {task.completed ? (
                  <span style={{ color: '#34d399', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={16} /> Completed
                  </span>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {task.verification_data?.url && (
                      <button 
                        onClick={() => handleTaskJoin(task)}
                        style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171', padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                      >
                        🔗 JOIN
                      </button>
                    )}
                    <button className="btn-primary btn-green" onClick={() => handleClaimTask(task.id, task.reward_amount)} style={{ width: 'auto', padding: '7px 14px', fontSize: 12 }}>
                      CLAIM +{Number(task.reward_amount || 0).toLocaleString()}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 3: WITHDRAW */}
      {activeTab === 'withdraw' && (
        <div key="withdraw" className="screen-view" style={{ padding: '0 16px' }}>
          <div className="glass-card">
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet size={20} color="#a855f7" /> Withdraw BONK
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Withdrawal Requirement Status</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Verified Referrals (Min {sysConfig.minVerifiedRefs}):</span>
                <span style={{ color: user.verified_ref_count >= sysConfig.minVerifiedRefs ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
                  {user.verified_ref_count}/{sysConfig.minVerifiedRefs} {user.verified_ref_count >= sysConfig.minVerifiedRefs ? 'Unlocked' : 'Locked'}
</span>
              </div>
            </div>

            {withdrawMsg && (
              <div style={{ fontSize: 13, marginBottom: 12, padding: 8, borderRadius: 8, background: withdrawMsg.startsWith('\u2705') ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', color: withdrawMsg.startsWith('\u2705') ? '#34d399' : '#f87171' }}>
                {withdrawMsg}
              </div>
            )}

            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>AMOUNT (BONK)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Min ${Number(sysConfig.minWithdrawalAmount).toLocaleString()}`}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: 10, color: '#fff', fontSize: 14 }}
                  />
                  <button type="button" onClick={() => setWithdrawAmount(user.balance.toString())} style={{ background: 'rgba(139, 92, 246, 0.3)', border: 'none', color: '#c084fc', padding: '0 14px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    MAX
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>CWALLET ID</div>
                  <a href="https://cwallet.com/referralweb/lAnLI39k?type=signup" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#a855f7', textDecoration: 'none', fontWeight: 600 }}>Create CWallet Account (No KYC) &rarr;</a>
                </div>
                <input 
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="CWallet ID (e.g. 12345678)"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: 10, color: '#fff', fontSize: 14 }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={isWithdrawing} style={{ opacity: isWithdrawing ? 0.6 : 1 }}>
                {isWithdrawing ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
              </button>
            </form>

            {/* Guidelines Section */}
            <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: '#a855f7' }}>How to Withdraw?</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>To avoid network fees, we ONLY support withdrawals to a <strong>CWallet ID</strong>.</li>
                  <li>Open your <strong>CWallet</strong> app. If you don't have an account, <a href="https://cwallet.com/referralweb/lAnLI39k?type=signup" target="_blank" rel="noopener noreferrer" style={{color: '#a855f7', textDecoration: 'underline'}}>create one here</a>.</li>
                  <li>Go to your profile/settings to find your CWallet ID (usually an 8-digit number).</li>
                  <li>Paste your CWallet ID in the field above.</li>
                  <li>Click Submit. Your withdrawal will be processed automatically!</li>
                </ol>
                <div style={{ marginTop: 12, padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 6, fontWeight: 600 }}>
                  ⚠️ Strict Rule: You can only request 1 withdrawal per day, and your wallet address cannot be shared with any other account.
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Recent Withdrawals</div>
            {withdrawHistory.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No past withdrawals yet</div>
            ) : (
              withdrawHistory.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.amount.toLocaleString()} BONK</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.wallet_address.substring(0, 8)}...</div>
                  </div>
                  <span style={{ 
                    padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                    background: item.status === 'completed' ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)',
                    color: item.status === 'completed' ? '#34d399' : '#f59e0b'
                  }}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REFERRAL MODAL */}
      {showRefModal && (
        <div className="modal-overlay" onClick={() => setShowRefModal(false)}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, margin: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(52,211,153,0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Users size={28} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 20 }}>Referral Program</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invite friends to boost your earnings!</div>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: 12, borderRadius: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Verified Referral Bonus</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>+{Number(sysConfig.verifiedRefBonus).toLocaleString()} BONK</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Credited when your referral completes their first ads.</div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              <div>• <strong>Instant Bonus:</strong> +{Number(sysConfig.referralSignupBonus).toLocaleString()} BONK per referral signup</div>
              <div>• <strong>Withdrawal Unlock:</strong> Requires {sysConfig.minVerifiedRefs} verified referrals</div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input 
                type="text" 
                readOnly 
                value={`https://t.me/BonkEarnSol_bot?start=${user.id}`}
                style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 10, color: '#fff', fontSize: 12 }}
              />
              <button 
                className="btn-primary btn-gold" 
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(`https://t.me/BonkEarnSol_bot?start=${user.id}`).catch(() => {});
                  } catch (e) {}
                  showToast('Referral link copied to clipboard!');
                }}
                style={{ width: 'auto', padding: '0 12px', fontSize: 12 }}
              >
                <Copy size={14} /> Copy
              </button>
            </div>

            <button className="btn-primary" onClick={() => setShowRefModal(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ADMIN DASHBOARD COMMAND CENTER */}
      {activeTab === 'admin' && (
        <div key="admin" className="screen-view" style={{ padding: '0 16px' }}>
          {!isAdminAuthenticated ? (
            /* ADMIN SECURITY PASSWORD GATE */
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))', borderColor: 'rgba(236,72,153,0.4)', textAlign: 'center', padding: '32px 20px', marginTop: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(236,72,153,0.2)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(236,72,153,0.4)' }}>
                <ShieldCheck size={36} />
              </div>

              <div style={{ fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 4 }}>
                Admin Operations Lock
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Enter security password to access management console
              </div>

              <form onSubmit={handleAdminLogin} style={{ maxWidth: 320, margin: '0 auto' }}>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <input 
                    type={showAdminPw ? 'text' : 'password'}
                    placeholder="Enter Admin Password"
                    value={adminPasswordInput}
                    onChange={e => setAdminPasswordInput(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(236,72,153,0.3)', padding: '12px 14px', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 600, textAlign: 'center', outline: 'none' }}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowAdminPw(!showAdminPw)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                  >
                    {showAdminPw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>

                {adminAuthError && (
                  <div style={{ color: '#f87171', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                    ⚠️ {adminAuthError}
                  </div>
                )}

                <button type="submit" className="btn-primary shimmer-btn" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', padding: '12px' }}>
                  🔓 Unlock Admin Console
                </button>
              </form>
            </div>
          ) : (
            /* UNLOCKED ADMIN DASHBOARD */
            <>
              {/* Top System Status Bar */}
              <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))', borderColor: 'rgba(236,72,153,0.3)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#ec4899', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={22} /> Admin Operations Command Center
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={fetchAdminData} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RefreshCw size={12} /> Refresh
                    </button>
                    <button onClick={() => { setIsAdminAuthenticated(false); showToast('🔒 Admin Console Locked'); }} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <LogOut size={12} /> Lock
                    </button>
                  </div>
                </div>

            {/* System Status Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={12} /> System Live
              </span>
              <span style={{ background: 'rgba(139,92,246,0.2)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.4)', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} /> Anti-Fraud Active
              </span>
              <span style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={12} /> Solana Treasury Online
              </span>
            </div>

            <div className="stats-grid" style={{ margin: 0 }}>
              <div className="stat-tile">
                <div className="stat-value">{adminStats.totalUsers}</div>
                <div className="stat-label">Registered Users</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value" style={{ color: '#c084fc' }}>{adminStats.totalAds}</div>
                <div className="stat-label">Ads Served</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value" style={{ color: '#f59e0b' }}>{adminStats.pendingWithdrawals}</div>
                <div className="stat-label">Pending Req</div>
              </div>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, background: 'rgba(0,0,0,0.4)', padding: 4, borderRadius: 14, marginBottom: 16 }}>
            <button 
              onClick={() => setAdminSubTab('withdrawals')}
              style={{ background: adminSubTab === 'withdrawals' ? 'var(--purple-primary)' : 'transparent', color: '#fff', border: 'none', padding: '8px 0', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Withdraws
            </button>
            <button 
              onClick={() => setAdminSubTab('users')}
              style={{ background: adminSubTab === 'users' ? 'var(--purple-primary)' : 'transparent', color: '#fff', border: 'none', padding: '8px 0', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Users
            </button>
            <button 
              onClick={() => setAdminSubTab('ledger')}
              style={{ background: adminSubTab === 'ledger' ? 'var(--purple-primary)' : 'transparent', color: '#fff', border: 'none', padding: '8px 0', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Ledger
            </button>
            <button 
              onClick={() => setAdminSubTab('tasks')}
              style={{ background: adminSubTab === 'tasks' ? 'var(--purple-primary)' : 'transparent', color: '#fff', border: 'none', padding: '8px 0', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Tasks
            </button>
            <button 
              onClick={() => setAdminSubTab('settings')}
              style={{ background: adminSubTab === 'settings' ? 'var(--purple-primary)' : 'transparent', color: '#fff', border: 'none', padding: '8px 0', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Config
            </button>
          </div>

          {/* TAB 1: WITHDRAWALS QUEUE */}
          {adminSubTab === 'withdrawals' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Withdrawal Queue & Approvals</div>
                <select 
                  value={searchWithdrawFilter} 
                  onChange={e => setSearchWithdrawFilter(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 11 }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Only</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed/Rejected</option>
                </select>
              </div>

              {adminQueue
                .filter(w => searchWithdrawFilter === 'all' || w.status === searchWithdrawFilter)
                .length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No matching withdrawal records</div>
              ) : (
                adminQueue
                  .filter(w => searchWithdrawFilter === 'all' || w.status === searchWithdrawFilter)
                  .map(req => (
                    <div key={req.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#34d399' }}>{req.amount.toLocaleString()} BONK</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>User ID: #{req.user_id} • {req.requested_at}</div>
                        </div>
                        <span style={{ 
                          padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                          background: req.status === 'completed' ? 'rgba(52,211,153,0.2)' : req.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                          color: req.status === 'completed' ? '#34d399' : req.status === 'pending' ? '#f59e0b' : '#f87171'
                        }}>
                          {req.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: 6, marginBottom: 8, wordBreak: 'break-all' }}>
                        <span>Solana Wallet: {req.wallet_address}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(req.wallet_address);
                          }}
                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 8 }}
                          title="Copy Wallet Address"
                        >
                          <Copy size={12} />
                        </button>
                      </div>

                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            className="btn-primary btn-green" 
                            onClick={() => handleApproveWithdrawal(req.id)}
                            style={{ flex: 1, padding: '6px 10px', fontSize: 12, gap: 4 }}
                          >
                            <Check size={14} /> Approve & Payout
                          </button>
                          <button 
                            onClick={() => setRejectWithdrawModal(req)}
                            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '6px 12px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}

                      {req.tx_hash && (
                        <div style={{ fontSize: 10, color: '#34d399', marginTop: 4 }}>Tx Signature: {req.tx_hash}</div>
                      )}
                      {req.admin_note && (
                        <div style={{ fontSize: 10, color: '#f87171', marginTop: 4 }}>Reason: {req.admin_note}</div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* TAB 2: USER DIRECTORY & FRAUD CONTROL */}
          {adminSubTab === 'users' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={18} color="#ec4899" /> User Accounts & Fraud Control
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '6px 10px', gap: 6, flex: '1 1 180px', maxWidth: 240 }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input 
                    type="text" 
                    placeholder="Search ID, Name, HWID, IP..." 
                    value={searchUserQuery}
                    onChange={e => setSearchUserQuery(e.target.value)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: 12, outline: 'none', width: '100%' }}
                  />
                  {searchUserQuery && (
                    <X size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => { setSearchUserQuery(''); setUserListLimit(100); }} />
                  )}
                </div>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <button
                  onClick={() => { setUserFilterTab('all'); setUserListLimit(100); }}
                  style={{
                    flex: 1,
                    background: userFilterTab === 'all' ? 'var(--purple-primary)' : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 0',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  All ({adminUsers.length})
                </button>
                <button
                  onClick={() => { setUserFilterTab('blocked'); setUserListLimit(100); }}
                  style={{
                    flex: 1.2,
                    background: userFilterTab === 'blocked' ? '#ef4444' : 'rgba(239,68,68,0.15)',
                    border: userFilterTab === 'blocked' ? 'none' : '1px solid rgba(239,68,68,0.3)',
                    color: userFilterTab === 'blocked' ? '#fff' : '#f87171',
                    padding: '6px 0',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚨 Blocked ({adminUsers.filter(u => u.flagged === 1).length})
                </button>
                <button
                  onClick={() => { setUserFilterTab('active'); setUserListLimit(100); }}
                  style={{
                    flex: 1,
                    background: userFilterTab === 'active' ? '#10b981' : 'rgba(16,185,129,0.15)',
                    border: userFilterTab === 'active' ? 'none' : '1px solid rgba(16,185,129,0.3)',
                    color: userFilterTab === 'active' ? '#fff' : '#34d399',
                    padding: '6px 0',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✅ Active ({adminUsers.filter(u => !u.flagged).length})
                </button>
              </div>

              {/* User List */}
              {(() => {
                const filteredUsers = adminUsers.filter(u => {
                  if (userFilterTab === 'blocked' && !u.flagged) return false;
                  if (userFilterTab === 'active' && u.flagged) return false;
                  if (!searchUserQuery) return true;
                  const q = searchUserQuery.toLowerCase();
                  return (
                    (u.username && u.username.toLowerCase().includes(q)) ||
                    (u.first_name && u.first_name.toLowerCase().includes(q)) ||
                    u.id.toString().includes(q) ||
                    (u.device_id && u.device_id.toLowerCase().includes(q)) ||
                    (u.ip_address && u.ip_address.toLowerCase().includes(q))
                  );
                });

                if (filteredUsers.length === 0) {
                  return (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                      No users matching criteria
                    </div>
                  );
                }

                return (
                  <>
                    {filteredUsers.slice(0, userListLimit).map(usr => (
                      <div 
                        key={usr.id} 
                        style={{ 
                          background: usr.flagged ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.3)', 
                          border: usr.flagged ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.06)', 
                          borderRadius: 14, 
                          padding: 12, 
                          marginBottom: 12 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>@{usr.username || 'user'}</span>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>#{usr.id}</span>
                              {usr.first_name && <span style={{ fontSize: 11, color: '#9ca3af' }}>({usr.first_name})</span>}
                            </div>
                            <div style={{ fontSize: 14, color: '#c084fc', fontWeight: 800, marginTop: 2 }}>
                              {usr.balance.toLocaleString()} BONK
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {usr.flagged ? (
                              <span style={{ background: 'rgba(239,68,68,0.25)', color: '#f87171', border: '1px solid rgba(239,68,68,0.5)', padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                🚨 BLOCKED
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.4)', padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                                ✅ Active
                              </span>
                            )}
                            <button 
                              onClick={() => handleInspectUser(usr)} 
                              title="Inspect User Ledger & Details"
                              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                            >
                              <Eye size={12} /> View
                            </button>
                          </div>
                        </div>

                        {/* Device & Activity Hardware Metadata */}
                        <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '6px 8px', marginBottom: 10, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span>📱 HWID: {usr.device_id ? usr.device_id.substring(0, 24) + '...' : 'None'}</span>
                            <span>🌐 IP: {usr.ip_address || 'N/A'}</span>
                          </div>
                          <div>
                            📊 Ads: <strong style={{ color: '#fff' }}>{usr.ads_watched_total}</strong> • Referrals: <strong style={{ color: '#fff' }}>{usr.referral_count}</strong> ({usr.verified_ref_count} Verified)
                          </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            onClick={() => {
                              setBalanceModalUser(usr);
                              setAdjAmount('+10000');
                              setAdjReason('Manual reward adjustment');
                            }}
                            style={{ flex: 1, background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc', padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            ✏️ Edit Balance
                          </button>

                          {usr.flagged ? (
                            <button 
                              onClick={() => handleUnblockUser(usr.id)}
                              style={{ flex: 1.2, background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)', border: 'none', color: '#000', padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            >
                              🔓 Unlock & Restore
                            </button>
                          ) : isProtectedAdmin(usr.id) ? (
                            <div style={{ flex: 1, background: 'rgba(236,72,153,0.12)', border: '1px dashed rgba(236,72,153,0.5)', color: '#ec4899', padding: '7px 0', borderRadius: 8, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              🛡️ PROTECTED ADMIN
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleBlockUser(usr)}
                              style={{ flex: 1, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            >
                              🔒 Block Account
                            </button>
                          )}

                          {/* DELETE BUTTON */}
                          {!isProtectedAdmin(usr.id) && (
                            <button 
                              onClick={() => setDeleteUserModal(usr)}
                              title="Permanently Delete Account"
                              style={{ flex: 0.5, background: 'rgba(220,38,38,0.1)', border: '1px dashed rgba(220,38,38,0.4)', color: '#dc2626', padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredUsers.length > userListLimit && (
                      <button
                        onClick={() => setUserListLimit(prev => prev + 100)}
                        className="btn-primary"
                        style={{ padding: 9, fontSize: 13, marginTop: 4 }}
                      >
                        Load More Users ({filteredUsers.length - userListLimit} more)
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 3: GLOBAL FINANCIAL AUDIT LEDGER */}
          {adminSubTab === 'ledger' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={18} color="#c084fc" /> Global Audit Ledger
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '4px 8px', gap: 4 }}>
                  <Search size={12} color="var(--text-muted)" />
                  <input 
                    type="text" 
                    placeholder="Filter by User ID or Event" 
                    value={searchLedgerQuery}
                    onChange={e => setSearchLedgerQuery(e.target.value)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: 11, outline: 'none', width: 140 }}
                  />
                </div>
              </div>

              {adminTxLogs.filter(log => 
                !searchLedgerQuery || 
                log.user_id.toString().includes(searchLedgerQuery) || 
                log.description.toLowerCase().includes(searchLedgerQuery.toLowerCase()) || 
                log.type.toLowerCase().includes(searchLedgerQuery.toLowerCase())
              ).length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No matching audit entries found</div>
              ) : (
                adminTxLogs
                  .filter(log => 
                    !searchLedgerQuery || 
                    log.user_id.toString().includes(searchLedgerQuery) || 
                    log.description.toLowerCase().includes(searchLedgerQuery.toLowerCase()) || 
                    log.type.toLowerCase().includes(searchLedgerQuery.toLowerCase())
                  )
                  .map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{log.description}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>User #{log.user_id} • Type: <span style={{ color: '#c084fc' }}>{log.type}</span> • {log.created_at}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: log.amount >= 0 ? '#34d399' : '#f87171' }}>
                        {log.amount >= 0 ? `+${log.amount.toLocaleString()}` : log.amount.toLocaleString()} BONK
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* TAB 4: TASK MANAGER */}
          {adminSubTab === 'tasks' && (
            <div className="glass-card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Sponsor Task Center & Manager</div>

              <form onSubmit={handleCreateTask} style={{ marginBottom: 16, background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c084fc', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={14} /> Publish New Bonus Task
                </div>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Task Title (e.g. Join Partner Group)" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: 8, color: '#fff', fontSize: 12, marginBottom: 8 }}
                  required
                />
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input 
                    type="number" 
                    value={newTaskReward}
                    onChange={e => setNewTaskReward(e.target.value)}
                    placeholder="Reward BONK" 
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    required
                  />
                  <select 
                    value={newTaskType}
                    onChange={e => setNewTaskType(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0 8px', borderRadius: 8, fontSize: 12 }}
                  >
                    <option value="join_tg">Join Telegram</option>
                    <option value="follow_x">Follow X/Twitter</option>
                    <option value="visit_url">Visit Link</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={newTaskUrl}
                  onChange={e => setNewTaskUrl(e.target.value)}
                  placeholder="Target Link URL" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: 8, color: '#fff', fontSize: 12, marginBottom: 10 }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px', fontSize: 13 }}>
                  Launch Task
                </button>
              </form>

              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Active Sponsor Tasks ({tasks.length})</div>
              {tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: '#34d399' }}>+{t.reward_amount.toLocaleString()} BONK</div>
                  </div>
                  <button onClick={() => handleDeleteTask(t.id)} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#f87171', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: SYSTEM CONFIG */}
          {adminSubTab === 'settings' && (
            <div className="glass-card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Settings size={18} color="#ec4899" /> System Configuration & Limits
              </div>

              <form onSubmit={handleSaveSysConfig}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>AD REWARD AMOUNT (BONK PER VIEW)</div>
                  <input 
                    type="number" 
                    value={sysConfig.adRewardAmount}
                    onChange={e => setSysConfig({ ...sysConfig, adRewardAmount: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DAILY AD CAP PER USER</div>
                  <input 
                    type="number" 
                    value={sysConfig.dailyAdCap}
                    onChange={e => setSysConfig({ ...sysConfig, dailyAdCap: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MINIMUM WITHDRAWAL AMOUNT (BONK)</div>
                  <input 
                    type="number" 
                    value={sysConfig.minWithdrawalAmount}
                    onChange={e => setSysConfig({ ...sysConfig, minWithdrawalAmount: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MINIMUM VERIFIED REFERRALS FOR WITHDRAWAL</div>
                  <input 
                    type="number" 
                    value={sysConfig.minVerifiedRefs}
                    onChange={e => setSysConfig({ ...sysConfig, minVerifiedRefs: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ONBOARDING REGISTRATION BONUS (BONK)</div>
                  <input 
                    type="number" 
                    value={sysConfig.onboardingBonus}
                    onChange={e => setSysConfig({ ...sysConfig, onboardingBonus: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>REFERRAL SIGNUP BONUS (BONK TO REFERRER)</div>
                  <input 
                    type="number" 
                    value={sysConfig.referralSignupBonus}
                    onChange={e => setSysConfig({ ...sysConfig, referralSignupBonus: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>VERIFIED REFERRAL BONUS (BONK ON VERTIFICATION)</div>
                  <input 
                    type="number" 
                    value={sysConfig.verifiedRefBonus}
                    onChange={e => setSysConfig({ ...sysConfig, verifiedRefBonus: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ONBOARDING CHANNELS (COMMA SEPARATED, BOT MUST BE ADMIN)</div>
                  <textarea 
                    value={onboardingChannelsInput}
                    onChange={e => setOnboardingChannelsInput(e.target.value)}
                    rows={3}
                    placeholder="BonkEarnNews, BonkEarnPayouts, BonkEarnChat"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13, resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: sysConfig.maintenanceMode ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${sysConfig.maintenanceMode ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`, padding: '10px 12px', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: sysConfig.maintenanceMode ? '#f87171' : '#fff' }}>Maintenance Mode</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Blocks all user features. Admin panel & your account stay fully online.</div>
                  </div>
                  <button type="button" onClick={() => setSysConfig({ ...sysConfig, maintenanceMode: !sysConfig.maintenanceMode })} style={{ minWidth: 52, height: 28, borderRadius: 20, border: 'none', cursor: 'pointer', background: sysConfig.maintenanceMode ? '#ef4444' : 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 800, fontSize: 12 }}>
                    {sysConfig.maintenanceMode ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#c084fc', marginBottom: 12 }}>Fake Payout Broadcaster</div>
                  
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Enable Fake Payouts</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Broadcasts fake proof of payments to Telegram automatically.</div>
                    </div>
                    <button type="button" onClick={() => setSysConfig({ ...sysConfig, fakePayoutEnabled: sysConfig.fakePayoutEnabled === false ? true : false })} style={{ minWidth: 52, height: 28, borderRadius: 20, border: 'none', cursor: 'pointer', background: sysConfig.fakePayoutEnabled !== false ? '#34d399' : 'rgba(255,255,255,0.15)', color: sysConfig.fakePayoutEnabled !== false ? '#000' : '#fff', fontWeight: 800, fontSize: 12 }}>
                      {sysConfig.fakePayoutEnabled !== false ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MIN DELAY (MINUTES)</div>
                      <input 
                        type="number" 
                        value={sysConfig.fakePayoutMinDelay ?? ''}
                        onChange={e => setSysConfig({ ...sysConfig, fakePayoutMinDelay: e.target.value === '' ? '' : Number(e.target.value) })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MAX DELAY (MINUTES)</div>
                      <input 
                        type="number" 
                        value={sysConfig.fakePayoutMaxDelay ?? ''}
                        onChange={e => setSysConfig({ ...sysConfig, fakePayoutMaxDelay: e.target.value === '' ? '' : Number(e.target.value) })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button type="submit" className="btn-primary btn-green" style={{ flex: 1 }}>
                    Save System Parameters
                  </button>
                  <button type="button" onClick={handleForceBackup} className="btn-primary" style={{ flex: 1, background: '#3b82f6' }}>
                    Force GitHub Backup
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                  If you plan to trigger a manual deploy, click Force GitHub Backup first and wait 5 seconds.
                </div>
              </form>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* BLOCK USER MODAL */}
      {blockReasonModal && (
        <div className="modal-overlay" onClick={() => setBlockReasonModal(null)}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, margin: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#f87171', marginBottom: 4 }}>Block Account</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Target: @{blockReasonModal.username || 'user'} (#{blockReasonModal.id})
            </div>

            <form onSubmit={handleConfirmBlockUser}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>SELECT REASON PRESET</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  <button type="button" onClick={() => setBlockReasonText('Multi-accounting / Sybil policy violation')} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>• Multi-accounting violation</button>
                  <button type="button" onClick={() => setBlockReasonText('Referral farming / self-referrals detected')} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>• Referral farming detected</button>
                  <button type="button" onClick={() => setBlockReasonText('Suspicious device or IP activity')} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>• Suspicious device/IP activity</button>
                </div>

                <input
                  type="text"
                  value={blockReasonText}
                  onChange={e => setBlockReasonText(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '10px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                  🔒 Confirm Block
                </button>
                <button type="button" onClick={() => setBlockReasonModal(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0 14px', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER MODAL */}
      {deleteUserModal && (
        <div className="modal-overlay" onClick={() => setDeleteUserModal(null)}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, margin: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#dc2626', marginBottom: 4 }}>Permanently Delete Account?</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Target: @{deleteUserModal.username || 'user'} (#{deleteUserModal.id})
            </div>
            
            <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', padding: 12, borderRadius: 8, fontSize: 12, color: '#fca5a5', marginBottom: 16 }}>
              <strong>WARNING:</strong> This action cannot be undone. All of this user's data (balance, referrals, withdrawals, and task history) will be completely erased from the database.
            </div>

            <form onSubmit={handleConfirmDeleteUser}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '10px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                  🗑️ Yes, Delete Account
                </button>
                <button type="button" onClick={() => setDeleteUserModal(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0 14px', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST BALANCE MODAL */}
      {balanceModalUser && (
        <div className="modal-overlay" onClick={() => setBalanceModalUser(null)}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, margin: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Modify User Balance</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Target: @{balanceModalUser.username} (#{balanceModalUser.id})
            </div>

            <form onSubmit={handleConfirmBalanceAdjust}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>BONK AMOUNT (+ CREDIT / - DEBIT)</div>
                <input 
                  type="text"
                  value={adjAmount}
                  onChange={e => setAdjAmount(e.target.value)}
                  placeholder="+10000 or -5000"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700 }}
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button type="button" onClick={() => setAdjAmount('+10000')} style={{ flex: 1, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', padding: '4px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+10k</button>
                <button type="button" onClick={() => setAdjAmount('+50000')} style={{ flex: 1, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', padding: '4px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+50k</button>
                <button type="button" onClick={() => setAdjAmount('-10000')} style={{ flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>-10k</button>
                <button type="button" onClick={() => setAdjAmount('-50000')} style={{ flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>-50k</button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>AUDIT REASON NOTE</div>
                <input 
                  type="text"
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  placeholder="Reason for audit log"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: 10, color: '#fff', fontSize: 12 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn-primary btn-green" style={{ flex: 1 }}>Save Balance</button>
                <button type="button" onClick={() => setBalanceModalUser(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0 14px', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT WITHDRAWAL MODAL */}
      {rejectWithdrawModal && (
        <div className="modal-overlay" onClick={() => setRejectWithdrawModal(null)}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, margin: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#f87171', marginBottom: 4 }}>Reject Withdrawal</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Amount: {rejectWithdrawModal.amount.toLocaleString()} BONK • User #{rejectWithdrawModal.user_id}
            </div>

            <form onSubmit={handleConfirmRejectWithdrawal}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>SELECT REASON PRESET</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  <button type="button" onClick={() => setRejectReasonText('Flagged for referral farming/self-referrals')} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>• Referral farming detected</button>
                  <button type="button" onClick={() => setRejectReasonText('Invalid or suspicious Solana wallet address')} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>• Invalid Solana address</button>
                  <button type="button" onClick={() => setRejectReasonText('Multiple accounts detected on same IP')} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>• Multi-account violation</button>
                </div>

                <input 
                  type="text"
                  value={rejectReasonText}
                  onChange={e => setRejectReasonText(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '10px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Reject & Refund</button>
                <button type="button" onClick={() => setRejectWithdrawModal(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0 14px', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER INSPECTION AUDIT MODAL */}
      {inspectUser && (
        <div className="modal-overlay" onClick={() => { setInspectUser(null); setInspectDetails(null); }}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: 0, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>User Audit Profile</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{inspectUser.username} (#{inspectUser.id})</div>
              </div>
              <button onClick={() => { setInspectUser(null); setInspectDetails(null); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Balance: <strong style={{ color: '#34d399' }}>{inspectUser.balance.toLocaleString()} BONK</strong></div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ads Watched: <strong>{inspectUser.ads_watched_total}</strong></div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Referrals: <strong>{inspectUser.referral_count}</strong> ({inspectUser.verified_ref_count} Verified)</div>
            </div>

            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>User Transaction Ledger</div>
            {inspectDetails?.transactions?.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 0' }}>No transactions logged for this user</div>
            ) : (
              inspectDetails?.transactions?.map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11 }}>
                  <div>
                    <div>{tx.description}</div>
                    <div style={{ opacity: 0.5 }}>{tx.created_at}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: tx.amount >= 0 ? '#34d399' : '#f87171' }}>
                    {tx.amount >= 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation (Hidden in Admin Mode) */}
      {activeTab !== 'admin' && (
        <nav className="bottom-nav">
          <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Home size={20} />
            <span>Home</span>
          </button>
          <button className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <PlayCircle size={20} />
            <span>Tasks</span>
          </button>
          <button className={`nav-item ${activeTab === 'withdraw' ? 'active' : ''}`} onClick={() => setActiveTab('withdraw')}>
            <Wallet size={20} />
            <span>Withdraw</span>
          </button>
        </nav>
      )}
    </div>
  );
}
