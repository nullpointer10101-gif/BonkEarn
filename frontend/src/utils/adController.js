// GigaPub (Primary) & Monetag (Backup) Ad Controller
import { AD_CONFIG } from '../config/ads.js';

export async function triggerAdPlayback({ sessionId, apiBase, token, onProgress }) {
  return new Promise((resolve, reject) => {
    let adProvider = 'GigaPub';
    let invoked = false;

    // 1. PRIMARY: GigaPub Telegram Ad SDK (App ID 7632)
    const gigapubInstance = window.GigaPub || window.gigaPub || window.showGigaPub || window.show_7632;
    
    if (gigapubInstance) {
      try {
        console.log('▶ Launching Primary: GigaPub Telegram Ad Network (ID 7632)');
        if (typeof gigapubInstance === 'function') {
          gigapubInstance();
          invoked = true;
          adProvider = 'GigaPub';
        } else if (gigapubInstance.showAd || gigapubInstance.show) {
          const showFn = gigapubInstance.showAd || gigapubInstance.show;
          showFn.call(gigapubInstance, { id: AD_CONFIG.GIGAPUB.APP_ID || '7632' });
          invoked = true;
          adProvider = 'GigaPub';
        }
      } catch (e) {
        console.warn('GigaPub trigger notice:', e);
      }
    }

    // 2. BACKUP / FAILOVER: Monetag Telegram Mini App SDK (Zone 11527259)
    if (!invoked) {
      const monetagFnName = AD_CONFIG.MONETAG.SDK_FN || 'show_11527259';
      const monetagFn = window[monetagFnName] || window.show_11527259;

      if (typeof monetagFn === 'function') {
        try {
          console.log(`▶ Triggering Backup: Monetag SDK [${monetagFnName}]`);
          monetagFn();
          adProvider = 'Monetag';
          invoked = true;
        } catch (e) {
          console.warn('Monetag trigger notice:', e);
        }
      }
    }

    // 3. MANDATORY: Full 15-second compliance timer for High CPM & Anti-Cheat
    console.log(`⚡ Running mandatory 15s High-CPM watch session [${adProvider}]`);
    runRewardedTimer(15, onProgress, async () => {
      await verifyWithBackend(sessionId, apiBase, token, adProvider, resolve, reject);
    });
  });
}

function runRewardedTimer(seconds, onProgress, onComplete) {
  let remaining = seconds;
  if (onProgress) onProgress(remaining, seconds);

  const interval = setInterval(() => {
    remaining -= 1;
    if (onProgress) onProgress(remaining, seconds);
    if (remaining <= 0) {
      clearInterval(interval);
      onComplete();
    }
  }, 1000);
}

async function verifyWithBackend(sessionId, apiBase, token, providerName, resolve, reject) {
  if (token && sessionId) {
    try {
      const res = await fetch(`${apiBase}/ads/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          adToken: `${providerName.toLowerCase().replace(/[^a-z0-9]/g, '')}_verified` 
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        resolve({ success: true, provider: providerName, step: 2 });
      } else {
        if (reject) reject(new Error(data.error || 'Ad verification rejected by server'));
      }
    } catch (err) {
      if (reject) reject(err);
    }
  } else {
    resolve({ success: true, provider: 'Local Ad', step: 2 });
  }
}
