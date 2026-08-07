// BonkEarn Ad Network Configuration
// Primary: GigaPub | Backup: Monetag

export const AD_CONFIG = {
  // Primary Ad Network: GigaPub
  GIGAPUB: {
    ENABLED: true,
    TOKEN: process.env.VITE_GIGAPUB_TOKEN || 'YOUR_GIGAPUB_TOKEN_HERE',
    SCRIPT_URL: 'https://gigapub.b-cdn.net/gigapub-sdk.js'
  },

  // Backup Ad Network: Monetag
  MONETAG: {
    ENABLED: true,
    DIRECT_LINK: process.env.VITE_MONETAG_DIRECT_LINK || 'YOUR_MONETAG_DIRECT_LINK_HERE',
    ZONE_ID: process.env.VITE_MONETAG_ZONE_ID || 'YOUR_MONETAG_ZONE_ID'
  }
};
