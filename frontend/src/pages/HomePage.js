import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useUser } from "../context/Usercontext";

/* ─── Google Fonts injected once ─────────────────────────────────────── */
const injectFonts = () => {
  if (document.getElementById("dp-fonts")) return;
  const l = document.createElement("link");
  l.id   = "dp-fonts";
  l.rel  = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap";
  document.head.appendChild(l);
};

export default function HomePage() {
  injectFonts();
  const {
    account, connectMetaMask, connectDummyWallet, generateWallet,
    isConnecting, error, clearError,
  } = useWeb3();
  const { setUsername, getUsername } = useUser();
  const navigate = useNavigate();

  const [mode,       setMode]      = useState(null);        // null | "metamask" | "dummy"
  const [step,       setStep]      = useState("wallet");    // "wallet" | "username"
  const [privateKey, setPrivKey]   = useState("");
  const [generated,  setGenerated] = useState(null);
  const [username,   setUname]     = useState("");
  const [unameErr,   setUnameErr]  = useState("");

  // After wallet connects → check if username already set
  useEffect(() => {
    if (!account) return;
    const existing = getUsername(account);
    if (existing) {
      navigate("/dashboard");
    } else {
      setStep("username");
    }
  }, [account]);

  const handleGenerate = () => {
    const w = generateWallet();
    setGenerated(w);
    setPrivKey(w.privateKey);
  };

  const HARDHAT_KEY  = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const HARDHAT_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const handleUsernameSubmit = () => {
    const trimmed = username.trim();
    if (!trimmed) { setUnameErr("Username is required"); return; }
    if (trimmed.length < 3) { setUnameErr("At least 3 characters"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setUnameErr("Letters, numbers, underscore only"); return; }
    setUsername(account, trimmed);
    navigate("/dashboard");
  };

  const handleSkip = () => {
    setUsername(account, `user_${account.slice(2, 8)}`);
    navigate("/dashboard");
  };

  /* ─── Username step ───────────────────────────────────────────────── */
  if (step === "username" && account) {
    return (
      <div style={styles.page}>
        <div style={styles.usernameCard}>
          <div style={styles.avatarRing}>
            <div style={styles.avatar}>
              {account.slice(2, 4).toUpperCase()}
            </div>
          </div>
          <h2 style={styles.cardTitle}>Set your username</h2>
          <p style={styles.cardSub}>
            This username lets others find and pay you without knowing your address.
            Stored locally on this device.
          </p>
          <div style={styles.addrChip}>
            <span style={styles.dot} />
            {account.slice(0, 10)}…{account.slice(-6)}
          </div>

          <div style={styles.inputWrap}>
            <span style={styles.atSign}>@</span>
            <input
              style={styles.usernameInput}
              placeholder="yourname"
              value={username}
              onChange={e => { setUname(e.target.value); setUnameErr(""); }}
              onKeyDown={e => e.key === "Enter" && handleUsernameSubmit()}
              autoFocus
              maxLength={32}
            />
          </div>
          {unameErr && <p style={styles.errMsg}>⚠ {unameErr}</p>}
          <p style={styles.hint}>Letters, numbers, underscores · 3–32 chars</p>

          <button style={styles.primaryBtn} onClick={handleUsernameSubmit}>
            Save username & Enter ↗
          </button>
          <button style={styles.ghostBtn} onClick={handleSkip}>
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  /* ─── Main landing ────────────────────────────────────────────────── */
  return (
    <div style={styles.page}>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.logoMark}>⬡</div>
        <h1 style={styles.heroTitle}>Decent<span style={styles.accent}>ra</span>Pay</h1>
        <p style={styles.heroSub}>
          Peer-to-peer ETH payments, split billing &amp; on-chain history.
          <br />No bank. No middleman. Just blockchain.
        </p>
        <div style={styles.badges}>
          {["Sepolia Testnet", "Smart Contract", "Split Pay", "QR Pay"].map(b => (
            <span key={b} style={styles.badge}>{b}</span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          ⚠&nbsp; {error}
        </div>
      )}

      {/* Wallet chooser */}
      {!mode && (
        <div style={styles.walletRow}>
          <WalletCard
            icon="🦊" title="MetaMask" sub="Browser extension wallet"
            accent="#f59e0b"
            onClick={() => { clearError(); setMode("metamask"); }}
          />
          <WalletCard
            icon="🔑" title="Dummy Wallet" sub="Local Hardhat development"
            accent="#6366f1"
            onClick={() => { clearError(); setMode("dummy"); }}
          />
        </div>
      )}

      {/* MetaMask panel */}
      {mode === "metamask" && (
        <div style={styles.panel}>
          <PanelHeader title="Connect MetaMask" onBack={() => setMode(null)} />
          <p style={styles.panelSub}>
            Make sure MetaMask is installed and set to <strong>Sepolia testnet</strong>.
          </p>
          <button
            onClick={connectMetaMask}
            disabled={isConnecting}
            style={{ ...styles.primaryBtn, marginTop: 8 }}
          >
            {isConnecting ? "Connecting…" : "🦊 Connect MetaMask"}
          </button>
        </div>
      )}

      {/* Dummy wallet panel */}
      {mode === "dummy" && (
        <div style={styles.panel}>
          <PanelHeader title="Dummy Wallet" onBack={() => setMode(null)} />
          <p style={styles.panelSub}>
            For local Hardhat testing. <strong>Never use real funds.</strong>
          </p>

          {/* Quick-fill Hardhat account */}
          <div style={styles.hintBox}>
            <div style={styles.hintTitle}>⚡ Hardhat account[0] — 10 000 ETH pre-funded</div>
            <div style={styles.mono}>{HARDHAT_ADDR}</div>
            <button
              style={styles.smallBtn}
              onClick={() => setPrivKey(HARDHAT_KEY)}
            >
              Use this account
            </button>
          </div>

          <button onClick={handleGenerate} style={styles.ghostBtn}>
            ✨ Generate New Wallet
          </button>

          {generated && (
            <div style={styles.generatedBox}>
              <Row label="ADDRESS"  value={generated.address}    mono warn={false} />
              <Row label="⚠ PRIVATE KEY — save now" value={generated.privateKey} mono warn />
              <div style={styles.fundHint}>
                New wallets have 0 ETH. Fund via:<br />
                <code style={styles.code}>
                  npx hardhat --network localhost transfer --to {generated.address} --amount 1
                </code>
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Private key</label>
            <input
              placeholder="Paste private key (0x…)"
              value={privateKey}
              onChange={e => { setPrivKey(e.target.value); clearError(); }}
              style={{ ...styles.textInput, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>

          <button
            onClick={() => connectDummyWallet(privateKey)}
            disabled={!privateKey || isConnecting}
            style={{ ...styles.primaryBtn, opacity: (!privateKey || isConnecting) ? 0.55 : 1 }}
          >
            {isConnecting ? "Connecting…" : "🔑 Use This Wallet"}
          </button>
        </div>
      )}

      {/* Features */}
      <div style={styles.features}>
        {[
          { icon: "🔐", title: "Non-custodial",   desc: "Your keys, your coins — always" },
          { icon: "⚡", title: "Instant finality", desc: "On-chain confirmation in seconds" },
          { icon: "👤", title: "Username pay",     desc: "Send by @username, not just address" },
          { icon: "📊", title: "Analytics",        desc: "Track volume, splits & history" },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={styles.featureCard}>
            <div style={styles.featureIcon}>{icon}</div>
            <div style={styles.featureTitle}>{title}</div>
            <div style={styles.featureDesc}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */
const WalletCard = ({ icon, title, sub, accent, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, padding: "28px 20px", border: `2px solid #e5e7eb`,
      borderRadius: 16, background: "#fff", cursor: "pointer",
      transition: "all 0.18s", fontFamily: "'Space Grotesk', sans-serif",
    }}
    onMouseOver={e => {
      e.currentTarget.style.borderColor = accent;
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = `0 8px 24px ${accent}22`;
    }}
    onMouseOut={e => {
      e.currentTarget.style.borderColor = "#e5e7eb";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
    <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{title}</div>
    <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>{sub}</div>
  </button>
);

const PanelHeader = ({ title, onBack }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
    <button onClick={onBack} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 600 }}>
      ← Back
    </button>
    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{title}</h3>
  </div>
);

const Row = ({ label, value, mono, warn }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: warn ? "#b91c1c" : "#6b7280", letterSpacing: "0.08em", marginBottom: 3 }}>
      {label}
    </div>
    <div style={{ fontSize: 12, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, wordBreak: "break-all", color: "#374151" }}>
      {value}
    </div>
  </div>
);

/* ─── Styles ─────────────────────────────────────────────────────────── */
const styles = {
  page: {
    maxWidth: 560, margin: "0 auto", padding: "0 4px",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  hero: { textAlign: "center", padding: "40px 0 32px" },
  logoMark: { fontSize: 52, marginBottom: 8, lineHeight: 1 },
  heroTitle: { fontSize: 42, fontWeight: 700, color: "#111827", margin: "0 0 12px", letterSpacing: "-0.03em" },
  accent: { color: "#6366f1" },
  heroSub: { fontSize: 16, color: "#6b7280", lineHeight: 1.6, margin: "0 0 20px" },
  badges: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" },
  badge: { fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#f3f4f6", color: "#374151", letterSpacing: "0.03em" },

  walletRow: { display: "flex", gap: 14, marginBottom: 32 },

  panel: {
    background: "#fff", borderRadius: 18, padding: 28,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 32,
  },
  panelSub: { fontSize: 14, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.5 },

  hintBox: {
    background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
    padding: 14, marginBottom: 14,
  },
  hintTitle: { fontSize: 12, fontWeight: 700, color: "#1e40af", marginBottom: 6 },
  mono: { fontSize: 11, fontFamily: "'JetBrains Mono', monospace", wordBreak: "break-all", color: "#374151", marginBottom: 8 },
  smallBtn: { fontSize: 12, padding: "5px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 },

  generatedBox: {
    background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
    padding: 14, marginBottom: 14,
  },
  fundHint: { fontSize: 11, color: "#92400e", background: "#fef3c7", borderRadius: 6, padding: "8px 10px", lineHeight: 1.5 },
  code: { fontSize: 10, fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: 4, wordBreak: "break-all" },

  inputGroup: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 },
  textInput: {
    width: "100%", boxSizing: "border-box", padding: "11px 13px",
    border: "1px solid #d1d5db", borderRadius: 9, fontSize: 14,
    outline: "none", transition: "border-color 0.15s",
    fontFamily: "'Space Grotesk', sans-serif",
  },

  primaryBtn: {
    width: "100%", padding: "13px 0", background: "#6366f1", color: "#fff",
    border: "none", borderRadius: 11, fontWeight: 700, fontSize: 15, cursor: "pointer",
    marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif",
    transition: "background 0.15s",
  },
  ghostBtn: {
    width: "100%", padding: "11px 0", background: "#f3f4f6", color: "#374151",
    border: "none", borderRadius: 11, fontWeight: 600, fontSize: 14, cursor: "pointer",
    marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif",
  },

  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
    borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 16,
    whiteSpace: "pre-wrap",
  },

  features: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, marginBottom: 40 },
  featureCard: { background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 14, padding: "20px 16px" },
  featureIcon: { fontSize: 24, marginBottom: 8 },
  featureTitle: { fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 4 },
  featureDesc: { fontSize: 12, color: "#9ca3af", lineHeight: 1.4 },

  /* Username step */
  usernameCard: {
    background: "#fff", borderRadius: 20, padding: "36px 32px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.1)", textAlign: "center",
    maxWidth: 420, margin: "60px auto",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  avatarRing: { width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" },
  avatar: { fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "'JetBrains Mono', monospace" },
  cardTitle: { fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" },
  cardSub: { fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 16px" },
  addrChip: { display: "inline-flex", alignItems: "center", gap: 6, background: "#f3f4f6", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#374151", marginBottom: 24 },
  dot: { width: 7, height: 7, borderRadius: "50%", background: "#10b981", flexShrink: 0 },
  inputWrap: { display: "flex", alignItems: "center", border: "2px solid #6366f1", borderRadius: 10, overflow: "hidden", marginBottom: 6 },
  atSign: { padding: "0 12px", fontSize: 18, fontWeight: 700, color: "#6366f1", background: "#eef2ff", alignSelf: "stretch", display: "flex", alignItems: "center" },
  usernameInput: { flex: 1, padding: "13px 12px", border: "none", outline: "none", fontSize: 16, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "#111827" },
  errMsg: { color: "#b91c1c", fontSize: 13, margin: "0 0 4px" },
  hint: { fontSize: 11, color: "#9ca3af", margin: "0 0 20px" },
};