import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  userId: { type: String, unique: true },
  password: String,
  walletAddress: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);