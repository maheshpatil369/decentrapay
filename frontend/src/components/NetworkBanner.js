import React from "react";
import { useWeb3 } from "../context/Web3Context";

export default function NetworkBanner() {
  const { account, isCorrectNetwork } = useWeb3();
  if (!account || isCorrectNetwork) return null;
  return (
    <div style={{
      background: "linear-gradient(90deg,#fef3c7,#fef9c3)",
      borderBottom: "1px solid #fcd34d",
      padding: "9px 28px",
      textAlign: "center",
      fontSize: 13,
      color: "#92400e",
      fontWeight: 600,
      fontFamily: "'Space Grotesk', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    }}>
      <span>⚠</span>
      <span>Switch to <strong>Sepolia</strong> or local <strong>Hardhat</strong> network in your wallet to continue</span>
    </div>
  );
}