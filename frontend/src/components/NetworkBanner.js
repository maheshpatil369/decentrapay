import React from "react";
import { useWeb3 } from "../context/Web3Context";
export default function NetworkBanner() {
  const { account, isCorrectNetwork } = useWeb3();
  if (!account || isCorrectNetwork) return null;
  return (
    <div style={{
      background: "#fef3c7", borderBottom: "1px solid #fcd34d",
      padding: "8px 24px", textAlign: "center",
      fontSize: 13, color: "#92400e", fontWeight: 500,
    }}>
      ⚠ Switch to Sepolia or local Hardhat network in your wallet
    </div>
  );
}
