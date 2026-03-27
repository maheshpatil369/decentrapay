import express from "express";
import Transaction from "../models/Transaction.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Save transaction
router.post("/", auth, async (req, res) => {
  const tx = await Transaction.create(req.body);
  res.json(tx);
});

// Get history
router.get("/:userId", async (req, res) => {
  const txs = await Transaction.find({
    $or: [
      { fromUser: req.params.userId },
      { toUser: req.params.userId }
    ]
  }).sort({ createdAt: -1 });

  res.json(txs);
});

export default router;