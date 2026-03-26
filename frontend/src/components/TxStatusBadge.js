import React from "react";
const EXPLORER = process.env.REACT_APP_EXPLORER || "https://sepolia.etherscan.io";
export default function TxStatusBadge({ status, txHash }) {
  const cfg = {
    signing:   { bg: "#fef3c7", color: "#92400e", msg: "⏳ Waiting for signature…"  },
    pending:   { bg: "#dbeafe", color: "#1e40af", msg: "🔄 Transaction submitted…"  },
    confirmed: { bg: "#d1fae5", color: "#065f46", msg: "✅ Confirmed on-chain!"      },
    failed:    { bg: "#fee2e2", color: "#b91c1c", msg: "❌ Transaction failed"       },
  };
  if (!cfg[status] || status === "idle") return null;
  const { bg, color, msg } = cfg[status];
  return (
    <div style={{ background: bg, color, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>
      {msg}
      {txHash && (
        <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
          style={{ marginLeft: 8, color, fontWeight: 600 }}>View ↗</a>
      )}
    </div>
  );
}
