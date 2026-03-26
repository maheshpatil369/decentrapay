import { useState, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";

export function useSplitPayment() {
  const { splitPayment, refreshBalance } = useWeb3();
  const [status,  setStatus]  = useState("idle");
  const [txHash,  setTxHash]  = useState(null);
  const [error,   setError]   = useState(null);

  const reset = () => { setStatus("idle"); setTxHash(null); setError(null); };

  const execute = useCallback(async ({ recipients, amounts, groupNote }) => {
    setError(null); setStatus("signing");
    try {
      const tx = await splitPayment({ recipients, amounts, groupNote });
      setTxHash(tx.hash); setStatus("pending");
      await tx.wait(1); setStatus("confirmed");
      await refreshBalance();
    } catch (err) {
      setError(err?.reason || err?.message || "Split payment failed");
      setStatus("failed");
    }
  }, [splitPayment, refreshBalance]);

  return { execute, status, txHash, error, reset };
}
