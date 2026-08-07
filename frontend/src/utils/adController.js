// GigaPub (Primary) & Monetag (Backup) Ad Controller with Strict Anti-Cheat & High-CPM Compliance
import { AD_CONFIG } from '../config/ads.js';

export async function triggerAdPlayback({ sessionId, apiBase, token, onProgress }) {
  return new Promise((resolve, reject) => {
    let watchStartTime = Date.now();
    let isFinished = false;
    let visibilityWatchSeconds = 0;

    // Track active visibility & progress
    const visibilityTimer = setInterval(() => {
      visibilityWatchSeconds += 1;
      if (onProgress) {
        const remaining = Math.max(0, 15 - visibilityWatchSeconds);
        onProgress(remaining, 15);
      }
    }, 1000);

    const cleanup = () => {
      clearInterval(visibilityTimer);
    };

    const handleAdSuccess = async (providerName) => {
      if (isFinished) return;
      isFinished = true;
      cleanup();

      const totalElapsed = (Date.now() - watchStartTime) / 1000;
      console.log(`[AdController] Ad finished on ${providerName}. Total elapsed: ${totalElapsed.toFixed(1)}s`);

      // High-CPM Anti-Cheat: Reject if closed in under 12 seconds
      if (totalElapsed < 12) {
        return reject(new Error(`⚠️ Ad closed too quickly (${Math.floor(totalElapsed)}s). You must watch the complete 15s video ad to earn rewards!`));
      }

      resolve({
        success: true,
        provider: providerName,
        elapsedSeconds: Math.floor(totalElapsed)
      });
    };

    const handleAdFailure = (providerName, error) => {
      if (isFinished) return;
      isFinished = true;
      cleanup();
      console.warn(`[AdController] Ad dismiss/error on ${providerName}:`, error);
      reject(new Error(`⚠️ Ad playback was closed or skipped early. Please watch the full 15s ad without closing!`));
    };

    // 1. PRIMARY: GigaPub Telegram Ad SDK (App ID 7632)
    const gigapubInstance = window.GigaPub || window.gigaPub || window.showGigaPub || window.show_7632;
    
    if (gigapubInstance) {
      try {
        console.log('▶ Launching Primary: GigaPub Telegram Ad Network (ID 7632)');
        if (typeof gigapubInstance === 'function') {
          const res = gigapubInstance();
          if (res && typeof res.then === 'function') {
            res
              .then(() => handleAdSuccess('GigaPub'))
              .catch((err) => {
                console.warn('GigaPub dismissed or failed, trying Monetag:', err);
                tryMonetagBackup(handleAdSuccess, handleAdFailure);
              });
            return;
          }
        } else if (gigapubInstance.showAd || gigapubInstance.show) {
          const showFn = gigapubInstance.showAd || gigapubInstance.show;
          showFn.call(gigapubInstance, {
            id: AD_CONFIG.GIGAPUB.APP_ID || '7632',
            onSuccess: () => handleAdSuccess('GigaPub'),
            onError: (err) => {
              console.warn('GigaPub error, trying Monetag:', err);
              tryMonetagBackup(handleAdSuccess, handleAdFailure);
            }
          });
          return;
        }
      } catch (e) {
        console.warn('GigaPub trigger exception:', e);
      }
    }

    // 2. BACKUP: Monetag SDK
    tryMonetagBackup(handleAdSuccess, handleAdFailure);
  });
}

function tryMonetagBackup(onSuccess, onFailure) {
  const monetagFnName = AD_CONFIG.MONETAG.SDK_FN || 'show_11527259';
  const monetagFn = window[monetagFnName] || window.show_11527259;

  if (typeof monetagFn === 'function') {
    try {
      console.log(`▶ Triggering Backup: Monetag SDK [${monetagFnName}]`);
      const adPromise = monetagFn();
      if (adPromise && typeof adPromise.then === 'function') {
        adPromise
          .then(() => onSuccess('Monetag'))
          .catch((err) => onFailure('Monetag', err));
        return;
      } else {
        onSuccess('Monetag');
        return;
      }
    } catch (e) {
      onFailure('Monetag', e);
      return;
    }
  }

  onFailure('AdNetwork', new Error('Ad SDK not loaded or ad-blocker detected'));
}

