// BonkEarn Ad Network Configuration
// Primary: GigaPub (App ID 7632) | Backup: Monetag (Zone 11527259)

export const AD_CONFIG = {
  // Primary Ad Network: GigaPub Telegram Ad SDK
  GIGAPUB: {
    ENABLED: true,
    APP_ID: '7632',
    SCRIPT_URL: 'https://ad.gigapub.tech/script?id=7632'
  },

  // Backup / Failover Ad Network: Monetag Telegram Mini App SDK
  MONETAG: {
    ENABLED: true,
    ZONE_ID: '11527259',
    SDK_FN: 'show_11527259',
    SCRIPT_URL: '//libtl.com/sdk.js'
  }
};
