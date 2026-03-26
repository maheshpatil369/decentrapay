const express    = require("express");
const { ethers } = require("ethers");
const Transaction = require("../models/Transaction");
const requireAuth = require("../middleware/auth");
const { analyseTransaction } = require("../services/fraudDetector");

const router = express.Router();

/**
 * POST /api/tx/log
 * Called by the frontend after a tx is confirmed on-chain.
 * Stores the event in MongoDB for fast querying & analytics.
 */
router.post("/log", requireAuth, async (req, res) => {
  try {
    const { txHash, from, to, amount, amountWei, message, blockNumber, timestamp, network } = req.body;

    // Idempotent — skip if already logged
    const existing = await Transaction.findOne({ txHash: txHash.toLowerCase() });
    if (existing) return res.json({ ok: true, tx: existing, duplicate: true });

    // Run fraud detection
    const { flagged, flagReason } = await analyseTransaction({
      from: from.toLowerCase(),
      to:   to.toLowerCase(),
      amountEth: amount,
    });

    const tx = await Transaction.create({
      txHash:      txHash.toLowerCase(),
      from:        from.toLowerCase(),
      to:          to.toLowerCase(),
      amount,
      amountWei,
      message:     message || "",
      network:     network || "sepolia",
      blockNumber,
      timestamp:   timestamp ? new Date(timestamp * 1000) : new Date(),
      status:      "confirmed",
      flagged,
      flagReason,
    });

    res.status(201).json({ ok: true, tx });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ ok: true, duplicate: true });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tx/history/:address
 * Returns paginated transaction history for a wallet address.
 */
router.get("/history/:address", requireAuth, async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const page    = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit   = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip    = (page - 1) * limit;

    const query = { $or: [{ from: address }, { to: address }] };
    const [txs, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);

    res.json({
      txs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tx/:hash
 * Returns a single transaction by hash.
 */
router.get("/:hash", async (req, res) => {
  try {
    const tx = await Transaction.findOne({ txHash: req.params.hash.toLowerCase() });
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
