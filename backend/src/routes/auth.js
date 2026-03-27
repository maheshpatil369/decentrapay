import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { name, userId, password, walletAddress } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    userId,
    password: hashed,
    walletAddress
  });

  res.json(user);
});

// LOGIN
router.post("/login", async (req, res) => {
  const { userId, password } = req.body;

  const user = await User.findOne({ userId });
  if (!user) return res.status(400).json({ msg: "User not found" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign({ userId }, process.env.JWT_SECRET);

  res.json({ token, user });
});

export default router;