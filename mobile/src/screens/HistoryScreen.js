// HistoryScreen.js
// NOTE: Save this file as src/screens/HistoryScreen.js
// On-chain event history for the connected wallet.

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/contract";

const EXPLORER = "https://sepolia.etherscan.io/tx/";
const shortenAddr = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "";
const fmtDate = (ts) => ts ? new Date(ts * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export default function HistoryScreen() {
  const { account, sendPayment } = useWallet(); // signer comes from context
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!account) return;
      try {
        const prov     = new ethers.JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL || "https://rpc.sepolia.org");
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);
        const [sent, received] = await Promise.all([
          contract.queryFilter(contract.filters.PaymentSent(account, null), -10000),
          contract.queryFilter(contract.filters.PaymentSent(null, account), -10000),
        ]);
        const all = [...sent, ...received]
          .sort((a, b) => b.blockNumber - a.blockNumber)
          .map(e => ({
            hash:      e.transactionHash,
            from:      e.args.from,
            to:        e.args.to,
            amount:    ethers.formatEther(e.args.amount),
            message:   e.args.message,
            timestamp: Number(e.args.timestamp),
            direction: e.args.from.toLowerCase() === account.toLowerCase() ? "out" : "in",
          }));
        setTxs(all);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [account]);

  if (loading) return (
    <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
      <ActivityIndicator color="#4f46e5" size="large" />
      <Text style={{ color: "#9ca3af", marginTop: 12 }}>Scanning blockchain events…</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <Text style={s.count}>{txs.length} transactions</Text>
      {txs.length === 0
        ? <Text style={s.empty}>No transactions found yet.</Text>
        : <FlatList
            data={txs}
            keyExtractor={item => item.hash}
            renderItem={({ item }) => (
              <View style={s.row}>
                <View style={[s.dot, { backgroundColor: item.direction === "out" ? "#fee2e2" : "#d1fae5" }]}>
                  <Text style={{ fontSize: 16 }}>{item.direction === "out" ? "↑" : "↓"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.amount, { color: item.direction === "out" ? "#b91c1c" : "#065f46" }]}>
                    {item.direction === "out" ? "-" : "+"}{parseFloat(item.amount).toFixed(6)} ETH
                  </Text>
                  <Text style={s.meta}>
                    {item.direction === "out" ? `To: ${shortenAddr(item.to)}` : `From: ${shortenAddr(item.from)}`}
                    {item.message ? `  "${item.message}"` : ""}
                  </Text>
                </View>
                <View>
                  <Text style={s.date}>{fmtDate(item.timestamp)}</Text>
                  <Text style={s.link} onPress={() => Linking.openURL(EXPLORER + item.hash)}>View ↗</Text>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
      }
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  count:     { fontSize: 13, color: "#9ca3af", marginBottom: 12 },
  empty:     { textAlign: "center", color: "#9ca3af", marginTop: 60 },
  row:       { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  dot:       { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  amount:    { fontWeight: "700", fontSize: 15 },
  meta:      { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  date:      { fontSize: 11, color: "#9ca3af", textAlign: "right" },
  link:      { fontSize: 11, color: "#4f46e5", textAlign: "right" },
});
