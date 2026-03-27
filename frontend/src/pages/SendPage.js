import React, { useState } from "react";
import { ethers } from "ethers";
import { useLocation } from "react-router-dom";
import { useSendPayment } from "../hooks/useSendPayment";
import { useUser } from "../context/Usercontext";
import TxStatusBadge from "../components/TxStatusBadge";

const EXPLORER = process.env.REACT_APP_EXPLORER || "https://sepolia.etherscan.io";

export default function SendPage() {
  const location = useLocation();
  const prefill  = location.state || {};
  const { resolveAddress, getUsername, getAllUsers } = useUser();

  const { execute, status, txHash, error, reset } = useSendPayment();
  const [form, setForm] = useState({
    recipient: prefill.recipient || "",
    amount:    prefill.amount    || "",
    message:   "",
  });
  const [valErr,    setValErr]    = useState("");
  const [resolvedAddr, setResolvedAddr] = useState("");
  const [suggestions, setSuggestions]  = useState([]);

  const allUsers = getAllUsers();

  const handleRecipientChange = (val) => {
    setForm(f => ({ ...f, recipient: val }));
    setValErr("");

    // Username suggestions
    if (val.startsWith("@") || (!val.startsWith("0x") && val.length > 0)) {
      const query = val.startsWith("@") ? val.slice(1) : val;
      const hits = allUsers.filter(u =>
        u.username.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4);
      setSuggestions(hits);
    } else {
      setSuggestions([]);
    }

    // Live-resolve
    const addr = resolveAddress(val.startsWith("@") ? val.slice(1) : val);
    setResolvedAddr(addr && !val.startsWith("0x") ? addr : "");
  };

  const pickSuggestion = (u) => {
    setForm(f => ({ ...f, recipient: `@${u.username}` }));
    setResolvedAddr(u.address);
    setSuggestions([]);
  };

  const validate = () => {
    const raw = form.recipient.trim();
    const target = raw.startsWith("@")
      ? resolveAddress(raw.slice(1))
      : resolveAddress(raw);

    if (!target || !ethers.isAddress(target)) {
      setValErr("Invalid address or unknown username"); return false;
    }
    if (!(parseFloat(form.amount) > 0)) {
      setValErr("Amount must be > 0"); return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const raw = form.recipient.trim();
    const actualRecipient = raw.startsWith("@")
      ? resolveAddress(raw.slice(1))
      : resolveAddress(raw);

    await execute({ recipient: actualRecipient, amountEth: form.amount, message: form.message });
  };

  if (status === "confirmed") return (
    <div style={{ ...S.card, textAlign: "center", maxWidth: 480, margin: "40px auto" }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
      <h2 style={{ color: "#065f46", margin: "0 0 8px" }}>Payment sent!</h2>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        {form.amount} ETH sent successfully
      </p>
      <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={S.linkBtn}>
        View on Etherscan ↗
      </a>
      <button onClick={reset} style={S.ghostBtn}>Send another</button>
    </div>
  );

  const isBusy = ["signing","pending"].includes(status);

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={S.pageHeader}>
        <div style={S.pageIcon}>↑</div>
        <div>
          <h1 style={S.pageTitle}>Send ETH</h1>
          <p style={S.pageSub}>Transfer ETH via smart contract</p>
        </div>
      </div>

      <div style={S.card}>
        <form onSubmit={submit}>

          {/* Recipient */}
          <div style={S.fieldGroup}>
            <label style={S.label}>Recipient</label>
            <div style={{ position: "relative" }}>
              <input
                value={form.recipient}
                onChange={e => handleRecipientChange(e.target.value)}
                placeholder="0x… address or @username"
                style={{ ...S.input, paddingRight: resolvedAddr ? 120 : 12 }}
                disabled={isBusy}
              />
              {resolvedAddr && (
                <span style={S.resolvedChip}>
                  ✓ {resolvedAddr.slice(0, 8)}…
                </span>
              )}
              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div style={S.dropdown}>
                  {suggestions.map(u => (
                    <button
                      key={u.address}
                      type="button"
                      style={S.suggestion}
                      onClick={() => pickSuggestion(u)}
                    >
                      <span style={S.suggAvatar}>{u.username[0].toUpperCase()}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>@{u.username}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace" }}>
                          {u.address.slice(0, 14)}…
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p style={S.fieldHint}>
              Enter an address or <strong>@username</strong> registered on this device
            </p>
          </div>

          {/* Amount */}
          <div style={S.fieldGroup}>
            <label style={S.label}>Amount (ETH)</label>
            <div style={S.amountWrap}>
              <input
                type="number"
                value={form.amount}
                onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setValErr(""); }}
                placeholder="0.001"
                step="0.0001"
                style={{ ...S.input, paddingRight: 56 }}
                disabled={isBusy}
              />
              <span style={S.ethUnit}>ETH</span>
            </div>
            {/* Quick amounts */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {["0.001","0.01","0.1","0.5"].map(v => (
                <button
                  key={v} type="button"
                  style={S.quickBtn}
                  onClick={() => setForm(f => ({ ...f, amount: v }))}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div style={S.fieldGroup}>
            <label style={S.label}>Message <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
            <input
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="e.g. Rent, Lunch, Thanks 🙏"
              maxLength={256}
              style={S.input}
              disabled={isBusy}
            />
          </div>

          {(valErr || error) && (
            <div style={S.errorBox}>⚠ {valErr || error}</div>
          )}

          <TxStatusBadge status={status} txHash={txHash} />

          {/* Summary row */}
          {form.amount && parseFloat(form.amount) > 0 && (
            <div style={S.summary}>
              <span style={{ color: "#6b7280" }}>You're sending</span>
              <span style={{ fontWeight: 700, color: "#6366f1", fontFamily: "'JetBrains Mono', monospace" }}>
                {parseFloat(form.amount).toFixed(6)} ETH
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isBusy}
            style={{ ...S.primaryBtn, opacity: isBusy ? 0.6 : 1 }}
          >
            {status === "signing" ? "⏳ Awaiting signature…"
             : status === "pending"  ? "🔄 Confirming…"
             : "Send Payment ↗"}
          </button>
        </form>
      </div>
    </div>
  );
}

const S = {
  pageHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 },
  pageIcon: {
    width: 44, height: 44, borderRadius: 12,
    background: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
    color: "#5b21b6", fontSize: 22, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  pageTitle: { fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 },
  pageSub: { fontSize: 14, color: "#9ca3af", margin: "2px 0 0" },

  card: { background: "#fff", borderRadius: 18, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  fieldGroup: { marginBottom: 20 },
  label: { display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 },
  fieldHint: { fontSize: 11, color: "#9ca3af", margin: "5px 0 0" },

  input: {
    width: "100%", boxSizing: "border-box",
    padding: "11px 13px", border: "1.5px solid #e5e7eb", borderRadius: 10,
    fontSize: 14, outline: "none", transition: "border-color 0.15s",
    fontFamily: "'Space Grotesk', sans-serif",
    color: "#111827",
  },
  resolvedChip: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    fontSize: 11, color: "#065f46", background: "#d1fae5",
    borderRadius: 999, padding: "2px 8px", fontWeight: 600,
    pointerEvents: "none",
  },

  dropdown: {
    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
    background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    border: "1px solid #e5e7eb", zIndex: 50, overflow: "hidden",
  },
  suggestion: {
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", border: "none", background: "#fff",
    cursor: "pointer", textAlign: "left", transition: "background 0.1s",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  suggAvatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff", fontSize: 13, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  amountWrap: { position: "relative" },
  ethUnit: {
    position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
    fontSize: 13, fontWeight: 700, color: "#6366f1", pointerEvents: "none",
  },
  quickBtn: {
    padding: "5px 12px", background: "#f3f4f6", border: "none",
    borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#374151",
    cursor: "pointer", transition: "background 0.1s",
  },

  summary: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "#fafafa", borderRadius: 10, padding: "10px 14px",
    marginBottom: 14, fontSize: 14,
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
    borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 12,
  },
  primaryBtn: {
    width: "100%", padding: "14px 0", background: "linear-gradient(135deg,#6366f1,#7c3aed)",
    color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15,
    cursor: "pointer", marginTop: 4, fontFamily: "'Space Grotesk', sans-serif",
    boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
    transition: "opacity 0.15s",
  },
  ghostBtn: {
    width: "100%", padding: "12px 0", background: "#f3f4f6", color: "#374151",
    border: "none", borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer",
    marginTop: 8, fontFamily: "'Space Grotesk', sans-serif",
  },
  linkBtn: {
    display: "inline-block", padding: "11px 28px",
    background: "linear-gradient(135deg,#6366f1,#7c3aed)",
    color: "#fff", borderRadius: 999, textDecoration: "none",
    fontWeight: 700, fontSize: 14, marginBottom: 10,
  },
};