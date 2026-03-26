# ⬡ DecentraPay — Decentralised Payment System

A hackathon-winning, production-ready decentralised payment app built on Ethereum (Sepolia testnet).
Supports direct payments, split payments, QR codes, transaction analytics, fraud detection, and a dummy wallet system — no MetaMask required for development.

---

## Tech stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Smart contract | Solidity 0.8.20, Hardhat                        |
| Web frontend   | React + Ethers.js v6 + Recharts + qrcode.react  |
| Mobile app     | React Native + Ethers.js + react-native-qrcode  |
| Backend API    | Node.js + Express + MongoDB + JWT               |
| Network        | Ethereum Sepolia testnet (or local Hardhat node)|

---

## Monorepo structure

```
decentrapay/
├── contracts/                  # Hardhat project
│   ├── contracts/
│   │   └── DecentraPay.sol     # Main payment contract
│   ├── scripts/deploy.js       # Deployment script
│   ├── test/DecentraPay.test.js
│   └── hardhat.config.js
│
├── backend/                    # Express API server
│   └── src/
│       ├── index.js            # Entry point
│       ├── models/             # Mongoose models (User, Transaction)
│       ├── routes/             # auth, wallet, transactions, analytics
│       ├── middleware/auth.js  # JWT middleware
│       └── services/
│           └── fraudDetector.js
│
├── frontend/                   # React web app
│   └── src/
│       ├── abi/                # Contract ABI + address
│       ├── context/Web3Context.js   # Wallet state (MetaMask + dummy)
│       ├── hooks/              # useSendPayment, useSplitPayment
│       ├── pages/              # Home, Dashboard, Send, Split, History, Analytics, QR
│       ├── components/         # Navbar, NetworkBanner, TxStatusBadge
│       └── utils/              # format.js, api.js
│
└── mobile/                     # React Native app
    ├── App.js
    └── src/
        ├── context/WalletContext.js
        ├── screens/            # Home, Dashboard, Send, History, QR
        └── utils/contract.js
```

---

## Quick start

### Step 1 — Clone and install

```bash
git clone <your-repo-url>
cd decentrapay
```

### Step 2 — Smart contract (local development)

```bash
cd contracts
npm install

# Terminal A — start local blockchain
npx hardhat node

# Terminal B — deploy to local node
npx hardhat run scripts/deploy.js --network localhost
# Note the deployed address printed in the output
```

### Step 3 — Configure frontend

```bash
cd ../frontend
cp .env.example .env
# Edit .env:
#   REACT_APP_CONTRACT_ADDRESS=<address from step 2>
#   REACT_APP_RPC_URL=http://127.0.0.1:8545
npm install
npm start
```

### Step 4 — Start backend (optional)

```bash
cd ../backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET
npm run dev
```

### Step 5 — Mobile app

```bash
cd ../mobile
npm install
npx react-native run-android   # or run-ios
```

---

## Deploying to Sepolia testnet

### 1. Get testnet ETH
- Alchemy Faucet: https://sepoliafaucet.com
- Infura Faucet:  https://www.infura.io/faucet/sepolia

### 2. Configure contracts .env

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_KEY
```

### 3. Deploy

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
# → prints contract address and Etherscan link
```

### 4. Verify on Etherscan (optional)

```bash
npx hardhat verify --network sepolia <DEPLOYED_ADDRESS>
```

### 5. Update frontend .env

```
REACT_APP_CONTRACT_ADDRESS=<DEPLOYED_ADDRESS>
REACT_APP_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
REACT_APP_NETWORK=sepolia
```

---

## Features

| Feature                   | Status | Location                  |
|---------------------------|--------|---------------------------|
| MetaMask wallet connect   | ✅     | Web frontend              |
| Dummy wallet (dev)        | ✅     | Web + Mobile              |
| Generate wallet           | ✅     | Home page + mobile        |
| Send ETH                  | ✅     | SendPage / SendScreen     |
| Split payments            | ✅     | SplitPage (web)           |
| Transaction history       | ✅     | HistoryPage / HistoryScreen |
| Analytics dashboard       | ✅     | AnalyticsPage (Recharts)  |
| QR code payments          | ✅     | QRPage / QRScreen         |
| Network detection         | ✅     | NetworkBanner             |
| Fraud detection           | ✅     | Backend service           |
| JWT session management    | ✅     | Backend + auth routes     |
| Transaction logging       | ✅     | MongoDB via backend       |
| Reentrancy protection     | ✅     | Solidity contract         |
| Custom error types        | ✅     | Solidity contract         |
| Gas optimisation          | ✅     | Solidity + Hardhat config |

---

## Wallet authentication flow

```
1. GET  /api/auth/nonce/:address   → server returns one-time nonce
2. Client signs message: "Sign in to DecentraPay: {nonce}"
   (works with MetaMask AND dummy wallet — both can sign)
3. POST /api/auth/verify { address, signature }
   → server recovers signer, verifies match, rotates nonce
   → returns JWT (7-day expiry)
4. JWT included in Authorization: Bearer <token> header for all API calls
```

---

## Security checklist

- ✅ No private keys ever stored on server
- ✅ Reentrancy guard on all state-mutating contract functions
- ✅ Checks-Effects-Interactions pattern throughout
- ✅ Custom Solidity errors (cheaper reverts, less info leakage)
- ✅ JWT nonce rotation (replay attack prevention)
- ✅ Rate limiting on all API endpoints (100 req / 15 min)
- ✅ Helmet.js HTTP security headers
- ✅ Input validation on all contract functions
- ✅ Message length capped at 256 bytes on-chain
- ✅ .env files excluded via .gitignore

---

## Future improvements

- [ ] ERC-20 token payments (USDC, DAI)
- [ ] Push notifications for incoming payments (FCM)
- [ ] Multi-sig wallet support
- [ ] AI-powered fraud detection (replace rule-based layer)
- [ ] Layer 2 deployment (Arbitrum / Base for cheaper gas)
- [ ] Recurring / scheduled payments
- [ ] ENS name resolution (send to "alice.eth")
- [ ] In-app fiat off-ramp (Stripe / MoonPay integration)
