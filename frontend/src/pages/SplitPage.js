import React, { useState } from "react";
import { ethers } from "ethers";
import { useSplitPayment } from "../hooks/useSplitPayment";
import { useUser } from "../context/Usercontext";
import TxStatusBadge from "../components/TxStatusBadge";

const EXPLORER = process.env.REACT_APP_EXPLORER || "https://sepolia.etherscan.io";

export default function SplitPage() {
  const { execute, status, txHash, error, reset } = useSplitPayment();
  const { resolveAddress, getAllUsers } = useUser();

  const [groupNote,  setGroupNote]  = useState("");
  const [rows,       setRows]       = useState([
    { address: "", amount: "", resolvedAddr: "" },
    { address: "", amount: "", resolvedAddr: "" },
  ]);
  const [validErr,   setValidErr]   = useState("");
  const [suggestions, setSugg]      = useState({ idx: -1, list: [] });

  const allUsers = getAllUsers();

  const updateRow = (i, field, val) => {
    setRows(r => {
      const next = r.map((row, idx) => {
        if (idx !== i) return row;
        const updated = { ...row, [field]: val };
        if (field === "address") {
          const query = val.startsWith("@") ? val.slice(1) : val;
          const resolved = resolveAddress(query);
          updated.resolvedAddr = resolved && !val.startsWith("0x") ? resolved : "";
          // Suggestions
          if (val.length > 0 && !val.startsWith("0x")) {
            const hits = allUsers.filter(u =>
              u.username.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 4);
            setSugg({ idx: i, list: hits });
          } else {
            setSugg({ idx: -1, list: [] });
          }
        }
        return updated;
      });
      return next;
    });
  };

  const pickSuggestion = (rowIdx, u) => {
    setRows(r => r.map((row, i) =>
      i === rowIdx
        ? { ...row, address: `@${u.username}`, resolvedAddr: u.address }
        : row
    ));
    setSugg({ idx: -1, list: [] });
  };

  const addRow    = () => setRows(r => [...r, { address: "", amount: "", resolvedAddr: "" }]);
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));

  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const validate = () => {
    for (const r of rows) {
      const raw   = r.address.trim();
      const query = raw.startsWith("@") ? raw.slice(1) : raw;
      const addr  = r.resolvedAddr || resolveAddress(query);
      if (!addr || !ethers.isAddress(addr)) {
        setValidErr(`Invalid address or unknown username: ${raw}`); return false;
      }
      if (!(parseFloat(r.amount) > 0)) {
        setValidErr("Each amount must be > 0"); return false;
      }
    }
    return true;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setValidErr("");
  if (!validate()) return;

  const recipients = rows.map(r => {
    const raw   = r.address.trim();
    const query = raw.startsWith("@") ? raw.slice(1) : raw;
    return r.resolvedAddr || resolveAddress(query);
  });

  const tx = await execute({
    recipients,
    amounts: rows.map(r => r.amount),
    groupNote
  });

  // 🔥 SAVE SPLIT TRANSACTION
  const existing = JSON.parse(localStorage.getItem("txHistory")) || [];

  const splitTxs = recipients.map((addr, i) => ({
    txHash: tx?.hash || Date.now() + "_" + i,
    recipient: addr,
    amount: rows[i].amount,
    message: groupNote || "Split Payment",
    time: new Date().toISOString(),
    type: "split"
  }));

  localStorage.setItem("txHistory", JSON.stringify([
    ...existing,
    ...splitTxs
  ]));

  console.log("✅ Split saved:", splitTxs);
};

  if (status === "confirmed") return (
    <div style={{ ...S.card, textAlign: "center", maxWidth: 480, margin: "40px auto" }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
      <h2 style={{ color: "#065f46", margin: "0 0 8px" }}>Split sent!</h2>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        {total.toFixed(6)} ETH split across {rows.length} recipients
      </p>
      <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={S.linkBtn}>
        View on Etherscan ↗
      </a>
      <button onClick={reset} style={S.ghostBtn}>New split</button>
    </div>
  );

  const isBusy = ["signing","pending"].includes(status);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={S.pageHeader}>
        <div style={S.pageIcon}>÷</div>
        <div>
          <h1 style={S.pageTitle}>Split Payment</h1>
          <p style={S.pageSub}>Divide ETH across multiple wallets in one transaction</p>
        </div>
      </div>

      <div style={S.card}>
        <form onSubmit={handleSubmit}>

          {/* Group note */}
          <div style={S.fieldGroup}>
            <label style={S.label}>Group note <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
            <input
              value={groupNote}
              onChange={e => setGroupNote(e.target.value)}
              placeholder="e.g. Team lunch, Rent, Trip expenses"
              style={S.input}
              maxLength={256}
              disabled={isBusy}
            />
          </div>

          {/* Recipients */}
          <div style={S.fieldGroup}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={S.label}>Recipients</label>
              <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 600 }}>
                {rows.length} people · {total.toFixed(4)} ETH total
              </span>
            </div>

            {rows.map((row, i) => (
              <div key={i} style={S.rowWrap}>
                <div style={S.rowNum}>{i + 1}</div>

                {/* Address/Username field */}
                <div style={{ flex: 2, position: "relative" }}>
                  <input
                    placeholder="0x… or @username"
                    value={row.address}
                    onChange={e => updateRow(i, "address", e.target.value)}
                    style={{
                      ...S.input,
                      paddingRight: row.resolvedAddr ? 110 : 12,
                      marginBottom: 0,
                    }}
                    disabled={isBusy}
                    onBlur={() => setTimeout(() => setSugg({ idx: -1, list: [] }), 150)}
                  />
                  {row.resolvedAddr && (
                    <span style={S.resolvedChip}>✓ resolved</span>
                  )}
                  {suggestions.idx === i && suggestions.list.length > 0 && (
                    <div style={S.dropdown}>
                      {suggestions.list.map(u => (
                        <button
                          key={u.address} type="button"
                          style={S.suggestion}
                          onMouseDown={() => pickSuggestion(i, u)}
                        >
                          <span style={S.suggAvatar}>{u.username[0].toUpperCase()}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>@{u.username}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace" }}>
                              {u.address.slice(0, 14)}…
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount field */}
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    placeholder="ETH"
                    type="number" step="0.0001" min="0"
                    value={row.amount}
                    onChange={e => updateRow(i, "amount", e.target.value)}
                    style={{ ...S.input, paddingRight: 40, marginBottom: 0 }}
                    disabled={isBusy}
                  />
                  <span style={S.ethUnit}>ETH</span>
                </div>

                {rows.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    style={S.removeBtn}
                    disabled={isBusy}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              style={S.addBtn}
              disabled={isBusy}
            >
              + Add recipient
            </button>
          </div>

          {/* Total summary */}
          <div style={S.summary}>
            <div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>Total to send</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1", fontFamily: "'JetBrains Mono', monospace" }}>
                {total.toFixed(6)} ETH
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>Recipients</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#374151" }}>{rows.length}</div>
            </div>
          </div>

          {(validErr || error) && (
            <div style={S.errorBox}>⚠ {validErr || error}</div>
          )}

          <TxStatusBadge status={status} txHash={txHash} />

          <button
            type="submit"
            disabled={isBusy}
            style={{ ...S.primaryBtn, opacity: isBusy ? 0.6 : 1 }}
          >
            {status === "signing" ? "⏳ Awaiting signature…"
             : status === "pending"  ? "🔄 Confirming…"
             : `Split ${total.toFixed(4)} ETH ↗`}
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
    background: "linear-gradient(135deg,#fef3c7,#fde68a)",
    color: "#92400e", fontSize: 22, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  pageTitle: { fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 },
  pageSub: { fontSize: 14, color: "#9ca3af", margin: "2px 0 0" },

  card: { background: "#fff", borderRadius: 18, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  fieldGroup: { marginBottom: 22 },
  label: { display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 0 },

  input: {
    width: "100%", boxSizing: "border-box",
    padding: "11px 13px", border: "1.5px solid #e5e7eb", borderRadius: 10,
    fontSize: 14, outline: "none", fontFamily: "'Space Grotesk', sans-serif",
    color: "#111827", marginBottom: 0,
  },

  rowWrap: {
    display: "flex", gap: 8, alignItems: "center",
    marginBottom: 10, position: "relative",
  },
  rowNum: {
    width: 28, height: 28, borderRadius: "50%",
    background: "#f3f4f6", color: "#6b7280",
    fontSize: 12, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  resolvedChip: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    fontSize: 10, color: "#065f46", background: "#d1fae5",
    borderRadius: 999, padding: "2px 8px", fontWeight: 600, pointerEvents: "none",
  },
  ethUnit: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    fontSize: 12, fontWeight: 700, color: "#6366f1", pointerEvents: "none",
  },
  removeBtn: {
    padding: "9px 11px", background: "#fef2f2", border: "none",
    borderRadius: 9, cursor: "pointer", color: "#b91c1c", fontWeight: 700, fontSize: 13,
    flexShrink: 0,
  },
  addBtn: {
    fontSize: 13, color: "#6366f1", background: "#eef2ff",
    border: "none", borderRadius: 8, cursor: "pointer",
    padding: "7px 14px", fontWeight: 600, marginTop: 4,
    fontFamily: "'Space Grotesk', sans-serif",
  },

  dropdown: {
    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
    background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    border: "1px solid #e5e7eb", zIndex: 50, overflow: "hidden",
  },
  suggestion: {
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", border: "none", background: "#fff",
    cursor: "pointer", textAlign: "left",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  suggAvatar: {
    width: 28, height: 28, borderRadius: "50%",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff", fontSize: 11, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  summary: {
    display: "flex", justifyContent: "space-between",
    background: "#fafafa", border: "1px solid #f0f0f0",
    borderRadius: 12, padding: "16px 20px",
    marginBottom: 16,
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
    borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 12,
  },
  primaryBtn: {
    width: "100%", padding: "14px 0",
    background: "linear-gradient(135deg,#6366f1,#7c3aed)",
    color: "#fff", border: "none", borderRadius: 12,
    fontWeight: 700, fontSize: 15, cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif",
    boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
  },
  ghostBtn: {
    display: "block", width: "100%", padding: "12px 0",
    background: "#f3f4f6", color: "#374151",
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