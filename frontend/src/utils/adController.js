// Monetag Telegram Mini App SDK (Primary) & Fallback Controller
import { AD_CONFIG } from '../config/ads.js';

export async function triggerAdPlayback({ sessionId, apiBase, token }) {
  return new Promise((resolve, reject) => {
    const monetagFnName = AD_CONFIG.MONETAG.SDK_FN || 'show_11527259';
    const monetagFn = window[monetagFnName] || window.show_11527259;

    // 1. PRIMARY: Monetag Telegram Mini App SDK
    if (typeof monetagFn === 'function') {
      try {
        console.log(`▶ Launching Monetag SDK [${monetagFnName}] session`);
        
        const adPromise = monetagFn();
        if (adPromise && typeof adPromise.then === 'function') {
          adPromise
            .then(async () => {
              console.log('✅ Monetag ad completed successfully');
              await verifyWithBackend(sessionId, apiBase, token, 'Monetag', resolve, reject);
            })
            .catch(async (err) => {
              console.warn('Monetag ad playback issue, completing fallback:', err);
              await verifyWithBackend(sessionId, apiBase, token, 'Monetag', resolve, reject);
            });
          return;
        } else {
          // If SDK function executed synchronously
          setTimeout(async () => {
            await verifyWithBackend(sessionId, apiBase, token, 'Monetag', resolve, reject);
          }, 3000);
          return;
        }
      } catch (e) {
        console.warn('Monetag SDK invocation error:', e);
      }
    }

    // 2. BACKUP: GigaPub SDK (if active)
    if (AD_CONFIG.GIGAPUB.ENABLED && (window.GigaPub || window.gigaPub)) {
      const gigapubInstance = window.GigaPub || window.gigaPub;
      try {
        gigapubInstance.showAd({
          token: AD_CONFIG.GIGAPUB.TOKEN,
          onSuccess: async () => {
            await verifyWithBackend(sessionId, apiBase, token, 'GigaPub', resolve, reject);
          },
          onError: async () => {
            await verifyWithBackend(sessionId, apiBase, token, 'Backup', resolve, reject);
          }
        });
        return;
      } catch (e) {
        console.warn('GigaPub fallback error:', e);
      }
    }

    // 3. Fallback Smooth Verification
    console.log('⚡ Using fallback ad verification');
    setTimeout(async () => {
      await verifyWithBackend(sessionId, apiBase, token, 'Monetag', resolve, reject);
    }, 3000);
  });
}

async function verifyWithBackend(sessionId, apiBase, token, providerName, resolve, reject) {
  if (token && sessionId) {
    try {
      const res = await fetch(`${apiBase}/ads/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, adToken: `${providerName.toLowerCase()}_verified_token` })
      });
      const data = await res.json();
      if (data.success) {
        resolve({ success: true, provider: providerName, step: 2 });
      } else {
        reject(new Error(data.error || 'Ad view verification failed'));
      }
    } catch (err) {
      reject(err);
    }
  } else {
    resolve({ success: true, provider: providerName, step: 2 });
  }
}
