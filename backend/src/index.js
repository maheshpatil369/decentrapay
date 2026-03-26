require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const mongoose   = require("mongoose");
const rateLimit  = require("express-rate-limit");

const authRoutes    = require("./routes/auth");
const walletRoutes  = require("./routes/wallet");
const txRoutes      = require("./routes/transactions");
const analyticsRoutes = require("./routes/analytics");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));

// Global rate limiter (100 req / 15 min per IP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
}));

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/wallet",     walletRoutes);
app.use("/api/tx",         txRoutes);
app.use("/api/analytics",  analyticsRoutes);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok", ts: Date.now() }));

// 404 handler
app.use((_, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use((err, req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ── DB connect + server start ─────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/decentrapay")
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 API server running on port ${PORT}`));
  })
  .catch(err => { console.error("MongoDB error:", err); process.exit(1); });
