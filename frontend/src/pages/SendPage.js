import React, { useState } from "react";
import { ethers } from "ethers";
import { useLocation } from "react-router-dom";
import { useSendPayment } from "../hooks/useSendPayment";
import TxStatusBadge from "../components/TxStatusBadge";

const EXPLORER = process.env.REACT_APP_EXPLORER || "https://sepolia.etherscan.io";

export default function SendPage() {
  const location = useLocation();
  const prefill  = location.state || {};

  const { execute, status, txHash, error, reset } = useSendPayment();
  const [form, setForm] = useState({ recipient: prefill.recipient || "", amount: prefill.amount || "", message: "" });
  const [valErr, setValErr] = useState("");

  const change = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setValErr(""); };

  const validate = () => {
    if (!ethers.isAddress(form.recipient)) { setValErr("Invalid Ethereum address"); return false; }
    if (!(parseFloat(form.amount) > 0))    { setValErr("Amount must be > 0"); return false; }
    return true;
  };

const submit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  await execute({
    recipient: form.recipient,
    amountEth: form.amount,
    message: form.message
  });
};
  if (status === "confirmed") return (
    <div style={{ ...card, textAlign: "center", maxWidth: 480, margin: "40px auto" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
      <h2 style={{ color: "#065f46" }}>Payment sent!</h2>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>{form.amount} ETH to {form.recipient.slice(0,10)}…</p>
      <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
        style={{ display: "inline-block", padding: "10px 24px", background: "#4f46e5", color: "#fff", borderRadius: 999, textDecoration: "none", fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        View on Etherscan ↗
      </a>
      <button onClick={reset} style={{ display: "block", width: "100%", padding: "11px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
        Send another
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Send ETH</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Transfer ETH via smart contract on Localhost.</p>
      <div style={card}>
        <form onSubmit={submit}>
          {[
            { name: "recipient", label: "Recipient address", placeholder: "0x…",         type: "text"   },
            { name: "amount",    label: "Amount (ETH)",      placeholder: "0.001",        type: "number" },
            { name: "message",   label: "Message (optional)",placeholder: "e.g. Rent",   type: "text"   },
          ].map(({ name, label, placeholder, type }) => (
            <React.Fragment key={name}>
              <label style={lbl}>{label}</label>
              <input name={name} type={type} value={form[name]} onChange={change}
                placeholder={placeholder} step={name === "amount" ? "0.0001" : undefined}
                maxLength={name === "message" ? 256 : undefined}
                style={inp} disabled={["signing","pending"].includes(status)} />
            </React.Fragment>
          ))}

          {(valErr || error) && (
            <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>⚠ {valErr || error}</p>
          )}
          <TxStatusBadge status={status} txHash={txHash} />

          <button type="submit" disabled={["signing","pending"].includes(status)}
            style={{ width: "100%", padding: "13px 0", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: ["signing","pending"].includes(status) ? 0.6 : 1 }}>
            {status === "signing" ? "Awaiting signature…" : status === "pending" ? "Confirming…" : "Send Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}

const card = { background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" };
const lbl  = { display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 4 };
const inp  = { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 14 };
