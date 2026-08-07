// BonkEarn Ad Network Configuration
// Monetag Telegram Mini App SDK (Primary) & Backup Fallback

export const AD_CONFIG = {
  // Primary Ad Network: Monetag Telegram Mini App SDK
  MONETAG: {
    ENABLED: true,
    ZONE_ID: '11527259',
    SDK_FN: 'show_11527259',
    SCRIPT_URL: '//libtl.com/sdk.js'
  },

  // Secondary/Backup Ad Network: GigaPub
  GIGAPUB: {
    ENABLED: false,
    TOKEN: 'YOUR_GIGAPUB_TOKEN_HERE',
    SCRIPT_URL: 'https://gigapub.b-cdn.net/gigapub-sdk.js'
  }
};
