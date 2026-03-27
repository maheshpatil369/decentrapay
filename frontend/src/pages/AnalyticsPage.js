import React, { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useWeb3 } from "../context/Web3Context";
import { useUser } from "../context/Usercontext";

export default function AnalyticsPage() {
  const { account, fetchHistory } = useWeb3();
  const { getUsername } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const username = getUsername(account);

useEffect(() => {
  if (!account) return;

  setLoading(true);

  fetchHistory(account)
    .then(chainTxs => {

      // 🔥 LOCAL STORAGE TX
      const local = JSON.parse(localStorage.getItem("txHistory")) || [];

      const localFormatted = local.map(tx => ({
        hash: tx.txHash,
        from: account,
        to: tx.recipient,
        amount: tx.amount,
        message: tx.message,
        timestamp: Math.floor(new Date(tx.time).getTime() / 1000),
        direction: "out"
      }));

      // 🔥 MERGE BOTH
      const allTxs = [...chainTxs, ...localFormatted];

      // 🔥 REMOVE DUPLICATES
      const unique = Object.values(
        allTxs.reduce((acc, tx) => {
          acc[tx.hash] = tx;
          return acc;
        }, {})
      );

      console.log("📊 FINAL TX FOR ANALYTICS:", unique); // DEBUG

      setHistory(unique);
      setLoading(false);

    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });

}, [account, fetchHistory]);

  if (loading) return (
    <div style={{ textAlign: "center", marginTop: 80, fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
      <p style={{ color: "#9ca3af" }}>Loading analytics…</p>
    </div>
  );

  const byDay = {};
  history.forEach(tx => {
    const day = tx.timestamp
      ? new Date(tx.timestamp * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "Unknown";
    if (!byDay[day]) byDay[day] = { date: day, sent: 0, received: 0, count: 0 };
    if (tx.direction === "out") byDay[day].sent     += parseFloat(tx.amount);
    else                        byDay[day].received += parseFloat(tx.amount);
    byDay[day].count += 1;
  });
  const chartData = Object.values(byDay).slice(-14);

  const totalSent     = history.filter(t => t.direction === "out").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalReceived = history.filter(t => t.direction === "in" ).reduce((s, t) => s + parseFloat(t.amount), 0);
  const netFlow       = totalReceived - totalSent;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.pageIcon}>📊</div>
        <div>
          <h1 style={S.title}>Analytics</h1>
          <p style={S.sub}>
            On-chain breakdown for{" "}
            <strong>{username ? `@${username}` : account?.slice(0, 10) + "…"}</strong>
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={S.statsGrid}>
        {[
          { label: "Total transactions", value: history.length,                   accent: "#6366f1", icon: "#" },
          { label: "Total sent",         value: `${totalSent.toFixed(4)} ETH`,     accent: "#ef4444", icon: "↑" },
          { label: "Total received",     value: `${totalReceived.toFixed(4)} ETH`, accent: "#10b981", icon: "↓" },
          { label: "Net flow",           value: `${netFlow >= 0 ? "+" : ""}${netFlow.toFixed(4)} ETH`, accent: netFlow >= 0 ? "#10b981" : "#ef4444", icon: "⇌" },
        ].map(({ label, value, accent, icon }) => (
          <div key={label} style={{ ...S.statCard, borderLeft: `4px solid ${accent}` }}>
            <div style={{ fontSize: 22, marginBottom: 8, color: accent }}>{icon}</div>
            <p style={S.statLabel}>{label}</p>
            <p style={{ ...S.statValue, color: accent }}>{value}</p>
          </div>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div style={S.emptyChart}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔭</div>
          <p style={{ fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>No transactions yet</p>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Send or receive ETH to start seeing analytics</p>
        </div>
      ) : (
        <>
          {/* Volume line chart */}
          <div style={S.chartCard}>
            <h3 style={S.chartTitle}>ETH Volume Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "'Space Grotesk', sans-serif" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "'Space Grotesk', sans-serif" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontFamily: "'Space Grotesk', sans-serif" }}
                />
                <Legend />
                <Line type="monotone" dataKey="sent"     stroke="#ef4444" strokeWidth={2.5} dot={false} name="Sent" />
                <Line type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2.5} dot={false} name="Received" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tx count bar chart */}
          <div style={S.chartCard}>
            <h3 style={S.chartTitle}>Daily Transaction Count</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "'Space Grotesk', sans-serif" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "'Space Grotesk', sans-serif" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontFamily: "'Space Grotesk', sans-serif" }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[5,5,0,0]} name="Txns" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

const S = {
  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },
  pageIcon: {
    width: 48, height: 48, borderRadius: 13,
    background: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22,
  },
  title: { fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 },
  sub:   { fontSize: 14, color: "#9ca3af", margin: "3px 0 0" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 },
  statCard: {
    background: "#fff", borderRadius: 14, padding: "18px 16px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
  },
  statLabel: { fontSize: 11, color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" },
  statValue: { fontSize: 18, fontWeight: 800, margin: 0, fontFamily: "'JetBrains Mono', sans-serif" },

  chartCard: {
    background: "#fff", borderRadius: 16, padding: 24,
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)", marginBottom: 16,
  },
  chartTitle: { fontSize: 15, fontWeight: 700, color: "#374151", margin: "0 0 20px" },

  emptyChart: {
    textAlign: "center", padding: 60,
    background: "#fafafa", borderRadius: 18,
    border: "1px solid #f0f0f0",
  },
};