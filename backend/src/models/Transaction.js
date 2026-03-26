const mongoose = require("mongoose");

/**
 * Transaction model — mirrors on-chain PaymentSent events.
 * Used as a queryable cache so the frontend doesn't need to
 * scan blockchain logs on every page load.
 */
const TxSchema = new mongoose.Schema(
  {
    txHash:    { type: String, required: true, unique: true, lowercase: true },
    from:      { type: String, required: true, lowercase: true },
    to:        { type: String, required: true, lowercase: true },
    amount:    { type: String, required: true }, // stored as ether string, e.g. "0.05"
    amountWei: { type: String, required: true }, // raw wei as string (BigInt-safe)
    message:   { type: String, default: "" },
    network:   { type: String, default: "sepolia" },
    blockNumber: { type: Number },
    timestamp: { type: Date },
    status:    { type: String, enum: ["pending", "confirmed", "failed"], default: "confirmed" },
    // Fraud detection fields
    flagged:      { type: Boolean, default: false },
    flagReason:   { type: String,  default: "" },
  },
  { timestamps: true }
);

// Compound indexes for fast wallet-history queries
TxSchema.index({ from: 1,  createdAt: -1 });
TxSchema.index({ to:   1,  createdAt: -1 });
TxSchema.index({ txHash: 1 });

module.exports = mongoose.model("Transaction", TxSchema);
