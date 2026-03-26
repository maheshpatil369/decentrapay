const express = require("express");
const jwt     = require("jsonwebtoken");
const { ethers } = require("ethers");
const User    = require("../models/User");

const router = express.Router();

/**
 * Wallet-signature authentication flow:
 *  1. GET  /nonce/:address  → server returns a one-time nonce
 *  2. Client signs: ethers.signMessage(`Sign in to DecentraPay: ${nonce}`)
 *  3. POST /verify          → server recovers signer, issues JWT
 *
 * This flow works with MetaMask AND dummy wallets — both can sign a message.
 * No password is ever stored.
 */

// ── GET /api/auth/nonce/:address ──────────────────────────────────
router.get("/nonce/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Upsert user — create if first visit
    let user = await User.findOne({ walletAddress: address });
    if (!user) {
      user = await User.create({ walletAddress: address });
    }

    res.json({
      nonce:   user.nonce,
      message: `Sign in to DecentraPay: ${user.nonce}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/verify ─────────────────────────────────────────
router.post("/verify", async (req, res) => {
  try {
    const { address, signature } = req.body;

    if (!address || !signature) {
      return res.status(400).json({ error: "address and signature are required" });
    }

    const normalised = address.toLowerCase();
    const user = await User.findOne({ walletAddress: normalised });
    if (!user) return res.status(404).json({ error: "User not found — request nonce first" });

    // Recover signer from signature
    const message  = `Sign in to DecentraPay: ${user.nonce}`;
    const recovered = ethers.verifyMessage(message, signature).toLowerCase();

    if (recovered !== normalised) {
      return res.status(401).json({ error: "Signature verification failed" });
    }

    // Rotate nonce so same signature cannot be replayed
    await user.freshNonce();
    user.lastSeen = new Date();
    await user.save();

    // Issue JWT
    const token = jwt.sign(
      { walletAddress: normalised },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      token,
      user: { walletAddress: normalised, username: user.username },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────
const requireAuth = require("../middleware/auth");
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress }).select("-nonce");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
