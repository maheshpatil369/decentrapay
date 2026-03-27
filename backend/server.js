/**
 * DPS Backend Server
 * Node.js + Express + MongoDB
 *
 * Architecture:
 *  - RESTful API for transaction logging, analytics, fraud detection
 *  - JWT-less session management via wallet signature verification
 *  - Real-time events via WebSocket (ws)
 *  - MongoDB for persistent transaction logs
 */

require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const mongoose   = require("mongoose");
const http       = require("http");
const { Server } = require("socket.io");
const rateLimit  = require("express-rate-limit");

const transactionRoutes = require("./src/routes/transactions");
const walletRoutes      = require("./src/routes/wallets");
const analyticsRoutes   = require("./src/routes/analytics");
const authRoutes        = require("./src/routes/auth");
const fraudRoutes       = require("./src/routes/fraud");
const { errorHandler }  = require("./src/middleware/errorHandler");
const { setupSocketHandlers } = require("./src/services/socketService");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ─── Middleware ──────────────────────────────────────────────────
app.use(helmet());       // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Global rate limiter (100 req / 15 min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ─── Routes ─────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/wallets",      walletRoutes);
app.use("/api/analytics",    analyticsRoutes);
app.use("/api/fraud",        fraudRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version || "1.0.0",
    uptime:    process.uptime(),
    db:        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ─── WebSocket ───────────────────────────────────────────────────
setupSocketHandlers(io);

// Make io accessible in routes via req.io
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── Error Handler (must be last) ───────────────────────────────
app.use(errorHandler);

// ─── Database Connection ─────────────────────────────────────────
async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dps";
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${uri}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

// ─── Start ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🚀 DPS Backend running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`   API Base:    http://localhost:${PORT}/api`);
    console.log(`   WebSocket:   ws://localhost:${PORT}\n`);
  });
}

start();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = { app, server, io };
