import React, { useState } from "react";
import { ethers } from "ethers";
import { useSplitPayment } from "../hooks/useSplitPayment";
import TxStatusBadge from "../components/TxStatusBadge";

const EXPLORER = process.env.REACT_APP_EXPLORER || "https://sepolia.etherscan.io";

export default function SplitPage() {
  const { execute, status, txHash, error, reset } = useSplitPayment();
  const [groupNote, setGroupNote] = useState("");
  const [rows, setRows] = useState([{ address: "", amount: "" }, { address: "", amount: "" }]);
  const [validErr, setValidErr] = useState("");

  const updateRow = (i, field, val) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const addRow    = () => setRows(r => [...r, { address: "", amount: "" }]);
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));

  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const validate = () => {
    for (const r of rows) {
      if (!ethers.isAddress(r.address)) { setValidErr("Invalid address: " + r.address); return false; }
      if (!(parseFloat(r.amount) > 0))  { setValidErr("Each amount must be > 0"); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidErr("");
    if (!validate()) return;
    await execute({
      recipients: rows.map(r => r.address),
      amounts:    rows.map(r => r.amount),
      groupNote,
    });
  };

  if (status === "confirmed") return (
    <div style={{ ...card, textAlign: "center", maxWidth: 480, margin: "40px auto" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
      <h2 style={{ color: "#065f46" }}>Split payment sent!</h2>
      <p style={{ color: "#6b7280", fontSize: 14 }}>Total: {total.toFixed(6)} ETH to {rows.length} recipients</p>
      <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={linkBtn}>View on Etherscan ↗</a>
      <button onClick={reset} style={ghostBtn}>New split</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Split Payment</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        Divide ETH across multiple wallets in a single on-chain transaction.
      </p>
      <div style={card}>
        <form onSubmit={handleSubmit}>
          <label style={label}>Group note (optional)</label>
          <input value={groupNote} onChange={e => setGroupNote(e.target.value)}
            placeholder="e.g. Team lunch" style={input} maxLength={256} />

          <label style={label}>Recipients</label>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input placeholder="0x… address" value={row.address}
                onChange={e => updateRow(i, "address", e.target.value)}
                style={{ ...input, flex: 2, marginBottom: 0 }} />
              <input placeholder="ETH" type="number" step="0.0001" min="0" value={row.amount}
                onChange={e => updateRow(i, "amount", e.target.value)}
                style={{ ...input, flex: 1, marginBottom: 0 }} />
              {rows.length > 2 && (
                <button type="button" onClick={() => removeRow(i)}
                  style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#b91c1c", fontWeight: 700 }}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addRow}
            style={{ fontSize: 13, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 16 }}>
            + Add recipient
          </button>

          <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#374151" }}>
            Total: <strong>{total.toFixed(6)} ETH</strong> · {rows.length} recipients
          </div>

          {(validErr || error) && (
            <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>⚠ {validErr || error}</p>
          )}
          <TxStatusBadge status={status} txHash={txHash} />

          <button type="submit" disabled={["signing","pending"].includes(status)} style={{ ...primaryBtn, opacity: ["signing","pending"].includes(status) ? 0.6 : 1 }}>
            {status === "signing" ? "Awaiting signature…" : status === "pending" ? "Confirming…" : `Split ${total.toFixed(4)} ETH`}
          </button>
        </form>
      </div>
    </div>
  );
}

const card       = { background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" };
const label      = { display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 4 };
const input      = { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 14 };
const primaryBtn = { width: "100%", padding: "13px 0", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" };
const ghostBtn   = { display: "block", width: "100%", marginTop: 8, padding: "11px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" };
const linkBtn    = { display: "inline-block", padding: "10px 24px", background: "#4f46e5", color: "#fff", borderRadius: 999, textDecoration: "none", fontWeight: 600, fontSize: 14, marginBottom: 8 };
