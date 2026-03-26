import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useWeb3 } from "../context/Web3Context";
import { useNavigate } from "react-router-dom";

export default function QRPage() {
  const { account } = useWeb3();
  const navigate    = useNavigate();
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);

  // Encode address + optional amount into a URI
  const uri = amount && parseFloat(amount) > 0
    ? `ethereum:${account}?value=${amount}`
    : account || "";

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScan = (e) => {
    const value = e.target.value.trim();
    // Parse scanned URI: "ethereum:0x...?value=0.01"
    const match = value.match(/ethereum:(0x[0-9a-fA-F]{40})(?:\?value=([0-9.]+))?/);
    if (match) {
      const [, addr, val] = match;
      navigate("/send", { state: { recipient: addr, amount: val || "" } });
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>QR Pay</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        Share your QR code to receive ETH, or scan one to send.
      </p>

      {/* Receive QR */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", marginBottom: 16, textAlign: "center" }}>
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>Your payment QR</h3>
        <QRCodeSVG value={uri || "0x0"} size={200} style={{ margin: "0 auto 16px", display: "block" }} />

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            placeholder="Optional amount (ETH)"
            type="number" step="0.0001" min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
          />
        </div>

        <div style={{ background: "#f3f4f6", borderRadius: 8, padding: "8px 12px", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", color: "#374151", marginBottom: 12 }}>
          {account}
        </div>
        <button onClick={copyAddress} style={{ padding: "8px 20px", background: copied ? "#d1fae5" : "#4f46e5", color: copied ? "#065f46" : "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          {copied ? "✅ Copied!" : "Copy address"}
        </button>
      </div>

      {/* Scan / paste URI */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
        <h3 style={{ marginBottom: 12, fontSize: 16 }}>Scan or paste payment URI</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          Paste an <code>ethereum:0x…</code> URI to pre-fill the send form.
        </p>
        <input
          placeholder="ethereum:0xRecipient?value=0.01"
          onChange={handleScan}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}
        />
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
          Recognised URIs will redirect you to the send form automatically.
        </p>
      </div>
    </div>
  );
}
