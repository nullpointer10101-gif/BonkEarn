# 🐕 BonkEarn - Telegram Mini App

> Earn BONK by Watching Ads & Completing Tasks  
> **Version:** 1.0 | **Platform:** Telegram Mini App (Solana SPL - BONK)

---

## 📌 Project Overview
**BonkEarn** is a high-retention Telegram Mini App that rewards users with **BONK tokens** for watching advertisements, completing social tasks, and inviting friends via a 2-tier referral system.

### Key Highlights
- **Telegram WebApp Integration:** User authentication via Telegram `initData` HMAC-SHA256 verification.
- **Premium Ads (Adsgram / Monetag):** Up to 10 ads/day earning 1,200 BONK per ad (with server-side view verification callback).
- **Bonus Social Tasks:** Earn BONK rewards by joining TG channels, following X accounts, visiting URLs, or completing custom sponsor tasks.
- **Viral 2-Tier Referral System:** 
  - +100 BONK instant sign-up bonus.
  - +10,000 BONK verified bonus (when ref watches 10 ads).
  - Minimum 3 verified referrals required to unlock withdrawals.
- **Solana Withdrawal Pipeline:** Automated batching/queueing of BONK SPL token transfers to base58 Solana wallet addresses.
- **Anti-Fraud & Security:** New TG account filters (<7 days), IP/device heuristics, request rate-limiting, and server-side HMAC validation.
- **Admin Operations Panel:** Operational dashboard for task management, user review, withdrawal batch approvals, and analytics.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Telegram Bot** | Node.js + Telegraf / Grammy | Handles `/start`, deep-linking, inline commands, and notification pushes |
| **Mini App Frontend** | React + Vite + Telegram WebApp SDK | Mobile-first dark theme UI |
| **Backend API** | Node.js + Express | REST API, JWT auth, input validation, HMAC callback handling |
| **Database** | Pure JS JSON Engine / SQLite | `users`, `ad_sessions`, `tasks`, `task_completions`, `withdrawals` |
| **Blockchain** | Solana Web3.js / SPL Token | BONK SPL token transfer processing |
| **Ad Network** | Adsgram SDK | Ad serving & server-to-server callback verification |

---

## 📁 Repository Structure
```
BonkEarn/
├── backend/                  # Node.js Express REST API & Database
│   ├── src/
│   │   ├── db.js             # Pure JS JSON database engine
│   │   └── server.js         # REST API endpoints
│   └── package.json
├── bot/                      # Telegram Bot integration
│   ├── src/
│   │   └── index.js          # Telegraf bot
│   └── package.json
├── frontend/                 # React + Vite Telegram Mini App
│   ├── src/
│   │   ├── App.jsx           # Home View, 3-Step Premium Ads Task Center, Referrals & Withdrawals
│   │   ├── index.css         # Dark glassmorphic design system
│   │   └── main.jsx
│   └── index.html
├── PRD_extracted.txt         # Raw PRD document specifications
├── README.md                 # Project documentation
└── package.json              # Monorepo root package
```

---

## 🚀 Quick Start Guide

```bash
# 1. Start Backend API (Port 4000)
cd D:\antigravity\BonkEarn\backend
npm start

# 2. Start Frontend UI (Port 5173)
cd D:\antigravity\BonkEarn\frontend
npm run dev

# 3. Start Telegram Bot
cd D:\antigravity\BonkEarn\bot
npm start
```
