# DPS Backend — Setup Guide

## Requirements
- Node.js >= 18
- MongoDB (local or Atlas)

## Steps

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
The `.env` file is already included with localhost defaults.
Edit if needed:
- `MONGODB_URI` → your MongoDB connection string
- `PORT` → default is 5000

### 3. Start MongoDB
```bash
# Option A: Local MongoDB
mongod

# Option B: Docker
docker run -d -p 27017:27017 --name mongo mongo:7

# Option C: Use MongoDB Atlas (cloud)
# → Update MONGODB_URI in .env with your Atlas connection string
```

### 4. Start the server
```bash
# Development (auto-restart on file change)
npm run dev

# Production
npm start
```

Server runs at: http://localhost:5000

### 5. Test health endpoint
```
GET http://localhost:5000/api/health
```
Should return:
```json
{ "status": "ok", "db": "connected" }
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/auth/nonce/:address | Get login nonce |
| POST | /api/auth/verify | Verify wallet signature |
| POST | /api/transactions | Log a transaction |
| GET | /api/transactions/:address | Get transaction history |
| GET | /api/transactions/hash/:hash | Get single transaction |
| PATCH | /api/transactions/:hash/status | Update status |
| GET | /api/transactions/analytics/:address | Analytics data |
| POST | /api/wallets/register | Register wallet |
| GET | /api/wallets/:address | Get wallet |
| GET | /api/analytics/overview | Platform overview |
| GET | /api/fraud/stats | Fraud statistics |

## Notes
- The backend does NOT need the blockchain running to work
- Transactions are logged here AFTER being sent on-chain from the frontend
- WebSocket server runs on the same port (Socket.IO)
