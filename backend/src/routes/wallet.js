import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get wallet by username
router.get("/:userId", async (req, res) => {
  const user = await User.findOne({ userId: req.params.userId });
  if (!user) return res.status(404).json({ msg: "User not found" });

  res.json({ walletAddress: user.walletAddress });
});

export default router;