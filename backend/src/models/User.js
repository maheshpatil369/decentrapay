const mongoose = require("mongoose");

/**
 * User model — wallet address is the primary identity.
 * NEVER store private keys here. Ever.
 */
const UserSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String, required: true, unique: true,
      lowercase: true, match: /^0x[0-9a-f]{40}$/i,
    },
    username:  { type: String, trim: true, maxlength: 50 },
    // Rotating nonce for signature-based login (prevents replay attacks)
    nonce:     { type: String, default: () => Math.floor(Math.random() * 1e9).toString() },
    lastSeen:  { type: Date,   default: Date.now },
  },
  { timestamps: true }
);

UserSchema.methods.freshNonce = function () {
  this.nonce = Math.floor(Math.random() * 1e9).toString();
  return this.save();
};

module.exports = mongoose.model("User", UserSchema);
