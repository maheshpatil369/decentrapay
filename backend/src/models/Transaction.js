import mongoose from "mongoose";

const txSchema = new mongoose.Schema({
  fromUser: String,
  toUser: String,
  amount: Number,
  txHash: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", txSchema);