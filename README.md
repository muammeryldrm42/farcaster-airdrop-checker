# 🦅 Farcaster Airdrop Checker — Talons Protocol

Real-time Farcaster airdrop eligibility checker. Pulls live data from Neynar API, calculates a scoring model across 7 categories, and estimates your share of a potential $FAR airdrop.

## Features

- **Live Neynar API** — Real profile data, followers, power badge, verified wallets
- **Cast Analysis** — Fetches 25 recent casts for engagement & activity scoring
- **7-Category Scoring** (1000 pts max):
  - 🆔 FID Rarity (150) — Lower FID = higher score
  - 📅 Account Age (120) — Based on FID registration era
  - 🌐 Social Graph (200) — Followers & follow ratio
  - 💜 Engagement (180) — Avg reactions on recent casts
  - 📢 Cast Activity (150) — Posting frequency
  - ⚡ Power Badge (100) — Verified power user status
  - 🔗 Wallet & Verify (100) — Connected ETH/SOL wallets
- **Tier System** — 🐳 Whale / 🦅 Eagle / 🦊 Hawk / 🐦 Bird / 🥚 Egg
- **Airdrop Share Calculator** — Adjustable allocation % and total supply
- **Estimated Token Amount** — Shows your projected $FAR tokens

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Farcaster Airdrop Checker"
git remote add origin https://github.com/YOUR_USERNAME/farcaster-airdrop-checker.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Select the repo
3. Add Environment Variable:
   - **Key:** `NEYNAR_API_KEY`
   - **Value:** Your Neynar API key (get one free at [neynar.com](https://neynar.com))
4. Deploy!

### 3. Done

Your app will be live at `https://your-project.vercel.app`

## Local Development

```bash
npm install
echo "NEYNAR_API_KEY=your_key_here" > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS 3
- Neynar API v2
- Vercel-ready

## License

MIT — Built by [Talons Protocol](https://github.com/muammeryldrm42)
