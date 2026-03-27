const mongoose = require("mongoose");
const crypto   = require("crypto");

/**
 * Wallet Model
 *
 * SECURITY NOTE:
 * Private keys are NEVER stored in plaintext.
 * For dummy wallets (dev/demo): the private key is AES-256-GCM encrypted
 * with a user-supplied password before storage.
 * In production: use HSM or KMS — never store private keys in DB.
 *
 * For MetaMask wallets: only the public address is stored (no key needed).
 */
const walletSchema = new mongoose.Schema(
  {
    address: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      index:     true,
    },

    // Display name for multi-wallet UI
    label: {
      type:    String,
      default: "My Wallet",
      trim:    true,
      maxlength: 50,
    },

    walletType: {
      type:    String,
      enum:    ["dummy", "metamask", "walletconnect"],
      default: "dummy",
    },

    // Encrypted private key (only for dummy wallets)
    // Format: "iv:authTag:encryptedData" (all hex)
    encryptedPrivateKey: {
      type:    String,
      default: null,
      select:  false, // Never returned in queries by default
    },

    // Public key (safe to store/show)
    publicKey: {
      type:    String,
      default: null,
    },

    // Mnemonic (encrypted, only for dummy wallets, optional)
    encryptedMnemonic: {
      type:    String,
      default: null,
      select:  false,
    },

    // Session token (wallet-signed message used as auth)
    sessionToken: {
      type:    String,
      default: null,
      select:  false,
    },
    sessionExpiry: {
      type:    Date,
      default: null,
    },

    // Stats (cached, updated periodically)
    stats: {
      totalSent:     { type: Number, default: 0 },
      totalReceived: { type: Number, default: 0 },
      txCount:       { type: Number, default: 0 },
      lastActivity:  { type: Date, default: null },
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    // Networks this wallet has been used on
    networks: {
      type:    [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ── Encryption helpers ────────────────────────────────────────────
const ALGORITHM = "aes-256-gcm";

/**
 * Encrypt a private key with a password
 * @param {string} plaintext - The private key to encrypt
 * @param {string} password  - User password or app secret
 * @returns {string}         - "iv:authTag:encrypted" hex string
 */
walletSchema.statics.encryptKey = function (plaintext, password) {
  const key = crypto.scryptSync(password, "dps-salt-v1", 32);
  const iv  = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

/**
 * Decrypt a private key with a password
 * @param {string} encrypted - "iv:authTag:encrypted" hex string
 * @param {string} password  - User password or app secret
 * @returns {string}         - Decrypted private key
 */
walletSchema.statics.decryptKey = function (encrypted, password) {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(":");
  const key     = crypto.scryptSync(password, "dps-salt-v1", 32);
  const iv      = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// Update session
walletSchema.methods.createSession = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.sessionToken  = crypto.createHash("sha256").update(token).digest("hex");
  this.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return token; // Return unhashed token to client
};

walletSchema.methods.isSessionValid = function (token) {
  if (!this.sessionToken || !this.sessionExpiry) return false;
  if (new Date() > this.sessionExpiry) return false;
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  return hashed === this.sessionToken;
};

module.exports = mongoose.model("Wallet", walletSchema);
