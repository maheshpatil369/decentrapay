import { useState, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";

export function useSendPayment() {
  const { sendPayment, refreshBalance } = useWeb3();
  const [status,  setStatus]  = useState("idle");
  const [txHash,  setTxHash]  = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error,   setError]   = useState(null);

  const reset = () => {
    setStatus("idle");
    setTxHash(null);
    setReceipt(null);
    setError(null);
  };

  const execute = useCallback(async ({ recipient, amountEth, message }) => {
    setError(null);
    setStatus("signing");

    try {
      const tx = await sendPayment({ recipient, amountEth, message });

      setTxHash(tx.hash);
      setStatus("pending");

const rcpt = await tx.wait(1);

setReceipt(rcpt);
setStatus("confirmed");

// 🔥 SAVE TO LOCAL HISTORY
const prev = JSON.parse(localStorage.getItem("txHistory")) || [];

prev.unshift({
  txHash: tx.hash,
  recipient,
  amount: amountEth,
  message,
  time: new Date().toISOString()
});

localStorage.setItem("txHistory", JSON.stringify(prev));

// Refresh balance
await refreshBalance();

    } catch (err) {
      setError(err?.reason || err?.message || "Transaction failed");
      setStatus("failed");
    }
  }, [sendPayment, refreshBalance]);

  return { execute, status, txHash, receipt, error, reset };
}