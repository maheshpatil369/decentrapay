const express = require("express");
const router  = express.Router();
const Wallet  = require("../models/Wallet");
const { ethers } = require("ethers");

/**
 * POST /api/wallets/register
 * Register a wallet address in the backend DB
 */
router.post("/register", async (req, res) => {
  try {
    const { address, walletType = "dummy", label, publicKey } = req.body;
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { address: address.toLowerCase() },
      {
        address:    address.toLowerCase(),
        walletType,
        label:      label || "My Wallet",
        publicKey:  publicKey || null,
        $addToSet:  { networks: req.body.network || "localhost" },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, wallet });
  } catch (err) {
    console.error("register wallet error:", err);
    res.status(500).json({ error: "Failed to register wallet" });
  }
});

/**
 * GET /api/wallets/:address
 * Get wallet profile
 */
router.get("/:address", async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      address: req.params.address.toLowerCase(),
    });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

/**
 * PATCH /api/wallets/:address/label
 * Update wallet label
 */
router.patch("/:address/label", async (req, res) => {
  try {
    const { label } = req.body;
    if (!label || label.length > 50) {
      return res.status(400).json({ error: "Label must be 1-50 characters" });
    }
    const wallet = await Wallet.findOneAndUpdate(
      { address: req.params.address.toLowerCase() },
      { label },
      { new: true }
    );
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ error: "Failed to update label" });
  }
});

module.exports = router;
