import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'tasks' | 'withdraw' | 'admin'
  const [showRefModal, setShowRefModal] = useState(false);
  const [token, setToken] = useState(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const [user, setUser] = useState({
    id: 99887766,
    username: 'crypto_earner',
    first_name: 'Alex',
    balance: 81000,
    ads_watched_total: 10,
    ads_watched_today: 4,
    referral_count: 5,
    verified_ref_count: 3,
    withdrawal_unlocked: 1
  });

  const [adsStatus, setAdsStatus] = useState({
    adsWatchedToday: 4,
    dailyCap: 10,
    currentStep: 1,
    activeSessionId: null
  });

  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Join Official Telegram Channel', reward_amount: 5000, completed: false, url: 'https://t.me/EarnOfficialChannel' },
    { id: 't2', title: 'Follow Official X (Twitter)', reward_amount: 5000, completed: false, url: 'https://x.com/EarnAppOfficial' },
    { id: 't3', title: 'Visit Sponsor Website', reward_amount: 2500, completed: true, url: 'https://earn.app/sponsor' }
  ]);

  const [withdrawHistory, setWithdrawHistory] = useState([
    { id: 'w_101', amount: 50000, wallet_address: '7xKXtg2CW87d9C72...89aX', status: 'completed', requested_at: '2026-08-06 14:30' }
  ]);

  const [adminQueue, setAdminQueue] = useState([
    { id: 'w_201', user_id: 99887766, amount: 50000, wallet_address: '9zKYtg2CW87d9C72...12bZ', status: 'pending', requested_at: '2026-08-07 20:15' }
  ]);
  const [adminStats, setAdminStats] = useState({ totalUsers: 1, totalAds: 8, pendingWithdrawals: 1 });

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [isHardBlocked, setIsHardBlocked] = useState(false);
  const [hardBlockReason, setHardBlockReason] = useState('');

  // Auto Login on mount with Hardware & Canvas Anti-Bypass Device Fingerprint
  useEffect(() => {
    let canvasHash = '';
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('BonkEarnAntiBypass2026', 2, 2);
      canvasHash = canvas.toDataURL().slice(-30);
    } catch (e) {}

    const rawFp = (navigator.userAgent || '') + screen.width + 'x' + screen.height + (screen.colorDepth || 24) + (navigator.language || 'en') + (navigator.hardwareConcurrency || 2) + canvasHash;
    const deviceFingerprint = 'dev_' + btoa(rawFp).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const tgInitData = tg?.initData || '';
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = tg?.initDataUnsafe?.start_param || urlParams.get('start') || urlParams.get('tgWebAppStartParam');

    const authPayload = {
      initData: tgInitData,
      referrerId: refParam,
      deviceId: deviceFingerprint
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
            setHardBlockReason(data.error || '⛔ FORBIDDEN: Duplicate account creation blocked on this device.');
          });
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.error && (data.error.includes('FORBIDDEN') || data.error.includes('Multi-account'))) {
          setIsHardBlocked(true);
          setHardBlockReason(data.error);
          return;
        }
        if (data && data.token) {
          setToken(data.token);
          setUser(data.user);
          fetchUserData(data.token);
        }
      })
      .catch(() => console.log('Running in demo mock mode'));
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

    fetchAdminData();
  };

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
  const [searchLedgerQuery, setSearchLedgerQuery] = useState('');
  const [searchWithdrawFilter, setSearchWithdrawFilter] = useState('all');
  const [balanceModalUser, setBalanceModalUser] = useState(null);
  const [adjAmount, setAdjAmount] = useState('+10000');
  const [adjReason, setAdjReason] = useState('Manual reward adjustment');
  
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectDetails, setInspectDetails] = useState(null);

  const [rejectWithdrawModal, setRejectWithdrawModal] = useState(null);
  const [rejectReasonText, setRejectReasonText] = useState('Flagged for policy review');

  const [sysConfig, setSysConfig] = useState({
    adRewardAmount: 1200,
    dailyAdCap: 10,
    minWithdrawalAmount: 50000,
    minVerifiedRefs: 3,
    referralSignupBonus: 100,
    verifiedRefBonus: 10000
  });

  // Task creation form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('5000');
  const [newTaskUrl, setNewTaskUrl] = useState('https://t.me/EarnOfficialChannel');
  const [newTaskType, setNewTaskType] = useState('join_tg');

  const fetchAdminData = () => {
    fetch(`${API_BASE}/admin/analytics`)
      .then(res => res.json())
      .then(data => data.totalUsers !== undefined && setAdminStats(data))
      .catch(() => {});

    fetch(`${API_BASE}/admin/withdrawals`)
      .then(res => res.json())
      .then(data => Array.isArray(data) && setAdminQueue(data))
      .catch(() => {});

    fetch(`${API_BASE}/admin/users`)
      .then(res => res.json())
      .then(data => Array.isArray(data) && setAdminUsers(data))
      .catch(() => {});

    fetch(`${API_BASE}/admin/transactions`)
      .then(res => res.json())
      .then(data => Array.isArray(data) && setAdminTxLogs(data))
      .catch(() => {});

    fetch(`${API_BASE}/admin/settings`)
      .then(res => res.json())
      .then(data => data.adRewardAmount && setSysConfig(data))
      .catch(() => {});
  };

  const handleConfirmBalanceAdjust = (e) => {
    e.preventDefault();
    if (!balanceModalUser || !adjAmount) return;

    fetch(`${API_BASE}/admin/users/${balanceModalUser.id}/balance`, {
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
      .catch(() => {
        showToast('✅ Balance adjusted successfully');
        setBalanceModalUser(null);
      });
  };

  const handleConfirmRejectWithdrawal = (e) => {
    e.preventDefault();
    if (!rejectWithdrawModal) return;

    fetch(`${API_BASE}/admin/withdraw/${rejectWithdrawModal.id}/reject`, {
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
      .catch(() => {
        setAdminQueue(prev => prev.map(w => w.id === rejectWithdrawModal.id ? { ...w, status: 'failed', admin_note: rejectReasonText } : w));
        showToast(`❌ Withdrawal ${rejectWithdrawModal.id} Rejected & Refunded`);
        setRejectWithdrawModal(null);
      });
  };

  const handleInspectUser = (usr) => {
    setInspectUser(usr);
    fetch(`${API_BASE}/admin/users/${usr.id}/details`)
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
    fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sysConfig)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('⚙️ System configuration saved!');
        }
      });
  };

  const handleAdjustBalance = (userId) => {
    const amountStr = prompt('Enter BONK amount to adjust (+ for credit, - for debit):', '+10000');
    if (!amountStr) return;
    const reason = prompt('Enter admin audit reason note:', 'Manual reward correction');

    fetch(`${API_BASE}/admin/users/${userId}/balance`, {
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
    fetch(`${API_BASE}/admin/users/${userId}/flag`, {
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

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    fetch(`${API_BASE}/admin/tasks`, {
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
          // Refresh tasks
          if (token) fetchUserData(token);
        }
      });
  };

  const handleDeleteTask = (taskId) => {
    fetch(`${API_BASE}/admin/tasks/${taskId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('🗑️ Task removed');
          setTasks(prev => prev.filter(t => t.id !== taskId));
        }
      });
  };

  const handleApproveWithdrawal = (withdrawId) => {
    fetch(`${API_BASE}/admin/withdraw/${withdrawId}/approve`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`✅ Withdrawal ${withdrawId} Approved!`);
          fetchAdminData();
        }
      })
      .catch(() => {
        setAdminQueue(prev => prev.map(w => w.id === withdrawId ? { ...w, status: 'completed', tx_hash: 'sol_mock_tx_sig_88' } : w));
        showToast(`✅ Withdrawal ${withdrawId} Approved!`);
      });
  };

  const handleRejectWithdrawal = (withdrawId) => {
    const reason = prompt('Enter rejection reason for user:', 'Flagged for referral policy review');
    if (reason === null) return;

    fetch(`${API_BASE}/admin/withdraw/${withdrawId}/reject`, {
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

  // --- ADS STEP HANDLERS ---
  const handleStartAd = () => {
    if (adsStatus.adsWatchedToday >= adsStatus.dailyCap) {
      showToast('Daily ad cap reached! Reset at UTC midnight.');
      return;
    }
    
    showToast('▶ Launching GigaPub Ad Network...');
    setAdsStatus(prev => ({ ...prev, isWatching: true }));

    const startSession = (sessId) => {
      import('./utils/adController.js').then(({ triggerAdPlayback }) => {
        triggerAdPlayback({ sessionId: sessId, apiBase: API_BASE, token })
          .then((res) => {
            setAdsStatus(prev => ({ ...prev, currentStep: 2, activeSessionId: sessId, isWatching: false }));
            showToast(`✅ Ad view verified by ${res.provider}!`);
          })
          .catch((err) => {
            setAdsStatus(prev => ({ ...prev, isWatching: false }));
            showToast(`⚠️ Ad playback issue: ${err.message || 'Dismissed'}`);
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
            startSession(data.sessionId);
          } else {
            showToast(`❌ ${data.error}`);
            setAdsStatus(prev => ({ ...prev, isWatching: false }));
          }
        })
        .catch(() => startSession('demo_session_123'));
    } else {
      startSession('demo_session_123');
    }
  };

  const handleVerifyAd = () => {
    if (token && adsStatus.activeSessionId) {
      fetch(`${API_BASE}/ads/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: adsStatus.activeSessionId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAdsStatus(prev => ({ ...prev, currentStep: 3 }));
            showToast('Ad verified by server! Claim your reward.');
          }
        });
    } else {
      setAdsStatus(prev => ({ ...prev, currentStep: 3 }));
      showToast('Ad verified! Claim your reward.');
    }
  };

  const handleClaimAd = () => {
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
              ads_watched_total: prev.ads_watched_total + 1
            }));
            setAdsStatus(prev => ({ ...prev, currentStep: 1, activeSessionId: null }));
            triggerCelebration('🎉 +1,200 BONK credited!');
          }
        });
    } else {
      setUser(prev => ({
        ...prev,
        balance: prev.balance + 1200,
        ads_watched_today: prev.ads_watched_today + 1,
        ads_watched_total: prev.ads_watched_total + 1
      }));
      setAdsStatus(prev => ({ ...prev, currentStep: 1, activeSessionId: null }));
      triggerCelebration('🎉 +1,200 BONK credited!');
    }
  };

  // --- BONUS TASK CLAIM ---
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
            triggerCelebration(`⭐ Task completed! +${reward} BONK credited.`);
          }
        });
    } else {
      setUser(prev => ({ ...prev, balance: prev.balance + reward }));
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      triggerCelebration(`⭐ Task completed! +${reward} BONK credited.`);
    }
  };

  // --- WITHDRAWAL HANDLER ---
  const handleWithdraw = (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);

    if (!amt || amt < 50000) {
      setWithdrawMsg('❌ Minimum withdrawal amount is 50,000 BONK');
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
    if (user.verified_ref_count < 3 && !user.withdrawal_unlocked) {
      setWithdrawMsg('❌ You need at least 3 verified referrals to unlock withdrawals');
      return;
    }

    if (token) {
      fetch(`${API_BASE}/withdraw/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt, walletAddress })
      })
        .then(res => res.json())
        .then(data => {
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
    }
  };

  if (isHardBlocked) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(239, 68, 68, 0.15) 0%, #0d0f17 80%)' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '2px solid rgba(239, 68, 68, 0.4)', borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 0 35px rgba(239, 68, 68, 0.3)' }}>
          <AlertTriangle size={48} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#ef4444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Access Forbidden
        </h2>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 16, padding: '18px 20px', maxWidth: 420, marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: '#fca5a5', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
            {hardBlockReason || '⛔ Duplicate account creation blocked. An account is already registered on this device.'}
          </p>
        </div>
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: '14px 18px', maxWidth: 420, textAlign: 'left', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            🛡️ Anti-Fraud & Fair Play Policy:
          </div>
          <ul style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Only <strong>1 account per physical device</strong> is permitted.</li>
            <li>Multi-accounting, referral spoofing, and self-referrals are permanently blocked.</li>
            <li>If you believe this is an error, please reach out to official support.</li>
          </ul>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          🔄 Retry Connection
        </button>
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
            <div className="brand-title">🐕 BONK EARN</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {([6909180225, 99887766].includes(Number(user.id))) && (
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
        <div>
          <div className={`balance-card ${isPulsing ? 'reward-pulse' : ''}`}>
            <div className="balance-label">Total Balance</div>
            <div className="balance-amount">
              {user.balance.toLocaleString()}
              <span className="token-symbol">BONK</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#f472b6" /> Solana SPL Token Rewards
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-tile">
              <div className="stat-value">{user.referral_count}</div>
              <div className="stat-label">Referrals</div>
            </div>
            <div className="stat-tile">
              <div className="stat-value" style={{ color: '#34d399' }}>{user.verified_ref_count}/3</div>
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
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invite & Earn 10,000 BONK</div>
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
        <div style={{ padding: '0 16px' }}>
          {/* Premium Ads Section */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <PlayCircle size={20} /> ▶ Premium Ads
              </div>
              <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                {user.ads_watched_today}/{adsStatus.dailyCap} Today
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Watch advertisements securely to earn 1,200 BONK instantly per ad.
            </div>

            {/* 3-Step Flow */}
            <div className="step-container">
              {/* Step 1 */}
              <div className="step-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="step-num">1</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Watch Ad</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Start ad playback session</div>
                  </div>
                </div>
                <button 
                  className={`btn-primary ${adsStatus.currentStep > 1 || adsStatus.isWatching ? 'btn-disabled' : ''}`}
                  onClick={handleStartAd}
                  disabled={adsStatus.currentStep > 1 || adsStatus.isWatching}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
                >
                  {adsStatus.isWatching ? 'WATCHING...' : 'START'}
                </button>
              </div>

              {/* Step 2 */}
              <div className="step-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="step-num" style={{ background: adsStatus.currentStep >= 2 ? '#f59e0b' : '#374151' }}>2</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Verify Click</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Server confirms ad view completion</div>
                  </div>
                </div>
                <button 
                  className={`btn-primary btn-gold ${adsStatus.currentStep !== 2 ? 'btn-disabled' : ''}`}
                  onClick={handleVerifyAd}
                  disabled={adsStatus.currentStep !== 2}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
                >
                  {adsStatus.currentStep < 2 ? 'LOCKED' : 'VERIFY'}
                </button>
              </div>

              {/* Step 3 */}
              <div className="step-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="step-num" style={{ background: adsStatus.currentStep === 3 ? '#10b981' : '#374151' }}>3</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Claim Reward</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+1,200 BONK credited instantly</div>
                  </div>
                </div>
                <button 
                  className={`btn-primary btn-green ${adsStatus.currentStep !== 3 ? 'btn-disabled' : ''}`}
                  onClick={handleClaimAd}
                  disabled={adsStatus.currentStep !== 3}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
                >
                  CLAIM
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
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>+{task.reward_amount.toLocaleString()} BONK</div>
                </div>
                {task.completed ? (
                  <span style={{ color: '#34d399', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={16} /> Completed
                  </span>
                ) : (
                  <button className="btn-primary btn-green" onClick={() => handleClaimTask(task.id, task.reward_amount)} style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}>
                    Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 3: WITHDRAW */}
      {activeTab === 'withdraw' && (
        <div style={{ padding: '0 16px' }}>
          <div className="glass-card">
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet size={20} color="#a855f7" /> Withdraw BONK
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Withdrawal Requirement Status</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Verified Referrals (Min 3):</span>
                <span style={{ color: user.verified_ref_count >= 3 ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
                  {user.verified_ref_count}/3 {user.verified_ref_count >= 3 ? '✅ Unlocked' : '🔒 Locked'}
                </span>
              </div>
            </div>

            {withdrawMsg && (
              <div style={{ fontSize: 13, marginBottom: 12, padding: 8, borderRadius: 8, background: withdrawMsg.startsWith('✅') ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', color: withdrawMsg.startsWith('✅') ? '#34d399' : '#f87171' }}>
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
                    placeholder="Min 50,000"
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: 10, color: '#fff', fontSize: 14 }}
                  />
                  <button type="button" onClick={() => setWithdrawAmount(user.balance.toString())} style={{ background: 'rgba(139, 92, 246, 0.3)', border: 'none', color: '#c084fc', padding: '0 14px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    MAX
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>SOLANA WALLET ADDRESS</div>
                <input 
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Base58 Solana Address"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: 10, color: '#fff', fontSize: 14 }}
                />
              </div>

              <button type="submit" className="btn-primary">
                SUBMIT REQUEST
              </button>
            </form>
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
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>+10,000 BONK</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Credited when your referral watches 10 ads for the first time.</div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              <div>• <strong>Instant Bonus:</strong> +100 BONK per referral signup</div>
              <div>• <strong>Withdrawal Unlock:</strong> Requires 3 verified referrals</div>
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
                  navigator.clipboard.writeText(`https://t.me/BonkEarnSol_bot?start=${user.id}`);
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
        <div style={{ padding: '0 16px' }}>
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

                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: 6, marginBottom: 8, wordBreak: 'break-all' }}>
                        Solana Wallet: {req.wallet_address}
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

          {/* TAB 2: USER DIRECTORY & BALANCE CONTROL */}
          {adminSubTab === 'users' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>User Directory & Audit</div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '4px 8px', gap: 4 }}>
                  <Search size={12} color="var(--text-muted)" />
                  <input 
                    type="text" 
                    placeholder="Search User ID or Name" 
                    value={searchUserQuery}
                    onChange={e => setSearchUserQuery(e.target.value)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: 11, outline: 'none', width: 110 }}
                  />
                </div>
              </div>

              {adminUsers
                .filter(u => !searchUserQuery || (u.username && u.username.toLowerCase().includes(searchUserQuery.toLowerCase())) || u.id.toString().includes(searchUserQuery))
                .map(usr => (
                  <div key={usr.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>@{usr.username || 'user'} <span style={{ opacity: 0.5 }}>#{usr.id}</span></div>
                        <div style={{ fontSize: 13, color: '#c084fc', fontWeight: 800 }}>{usr.balance.toLocaleString()} BONK</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {usr.flagged ? (
                          <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>🚨 Flagged</span>
                        ) : (
                          <span style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>✅ Active</span>
                        )}
                        <button onClick={() => handleInspectUser(usr)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: 6, cursor: 'pointer' }}>
                          <Eye size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                      Ads Watched: {usr.ads_watched_total} • Referrals: {usr.referral_count} ({usr.verified_ref_count} Verified)
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        onClick={() => {
                          setBalanceModalUser(usr);
                          setAdjAmount('+10000');
                          setAdjReason('Manual reward adjustment');
                        }}
                        style={{ flex: 1, background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc', padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✏️ Modify Balance (+ / -)
                      </button>
                      <button 
                        onClick={() => handleToggleFlag(usr.id, usr.flagged)}
                        style={{ background: usr.flagged ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)', border: 'none', color: usr.flagged ? '#34d399' : '#f87171', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {usr.flagged ? 'Unflag' : 'Flag'}
                      </button>
                    </div>
                  </div>
                ))}
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
                    onChange={e => setSysConfig({ ...sysConfig, adRewardAmount: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DAILY AD CAP PER USER</div>
                  <input 
                    type="number" 
                    value={sysConfig.dailyAdCap}
                    onChange={e => setSysConfig({ ...sysConfig, dailyAdCap: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MINIMUM WITHDRAWAL AMOUNT (BONK)</div>
                  <input 
                    type="number" 
                    value={sysConfig.minWithdrawalAmount}
                    onChange={e => setSysConfig({ ...sysConfig, minWithdrawalAmount: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MINIMUM VERIFIED REFERRALS FOR WITHDRAWAL</div>
                  <input 
                    type="number" 
                    value={sysConfig.minVerifiedRefs}
                    onChange={e => setSysConfig({ ...sysConfig, minVerifiedRefs: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </div>

                <button type="submit" className="btn-primary btn-green">
                  Save System Parameters
                </button>
              </form>
            </div>
          )}
            </>
          )}
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
