// GigaPub (Primary) & Monetag (Backup) Ad Network Controller
import { AD_CONFIG } from '../config/ads.js';

export async function triggerAdPlayback({ sessionId, apiBase, token, gigaPubToken = AD_CONFIG.GIGAPUB.TOKEN, monetagLink = AD_CONFIG.MONETAG.DIRECT_LINK }) {
  return new Promise((resolve, reject) => {
    // 1. PRIMARY PROVIDER: GigaPub SDK
    if (window.GigaPub || window.gigaPub) {
      const gigapubInstance = window.GigaPub || window.gigaPub;
      try {
        console.log('▶ Launching GigaPub Ad Network session');
        
        gigapubInstance.showAd({
          token: gigaPubToken,
          onSuccess: async () => {
            await verifyWithBackend(sessionId, apiBase, token, 'GigaPub', resolve, reject);
          },
          onError: (err) => {
            console.warn('GigaPub playback fallback to Monetag:', err);
            triggerMonetagBackup(sessionId, apiBase, token, monetagLink, resolve, reject);
          }
        });
        return;
      } catch (e) {
        console.warn('GigaPub invocation error, using backup:', e);
      }
    }

    // 2. BACKUP PROVIDER: Monetag Direct / Smartlink or Simulation
    triggerMonetagBackup(sessionId, apiBase, token, monetagLink, resolve, reject);
  });
}

function triggerMonetagBackup(sessionId, apiBase, token, monetagLink, resolve, reject) {
  console.log('⚡ Triggering Monetag backup provider');
  
  if (monetagLink && monetagLink !== 'YOUR_MONETAG_DIRECT_LINK_HERE') {
    // Open Monetag direct link in new tab / web app window
    try {
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(monetagLink);
      } else {
        window.open(monetagLink, '_blank');
      }
    } catch (e) {
      console.warn('Monetag link error:', e);
    }
  }

  // Verification timer
  setTimeout(async () => {
    await verifyWithBackend(sessionId, apiBase, token, 'Monetag Backup', resolve, reject);
  }, 3000);
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
