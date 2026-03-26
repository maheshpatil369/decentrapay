import React, { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useWeb3 } from "../context/Web3Context";

export default function AnalyticsPage() {
  const { account, fetchHistory } = useWeb3();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    fetchHistory(account)
      .then(h => { setHistory(h); setLoading(false); })
      .catch(() => setLoading(false));
  }, [account, fetchHistory]);

  if (loading) return <p style={{ textAlign: "center", marginTop: 60, color: "#9ca3af" }}>Loading analytics…</p>;

  // ── Compute daily volumes ─────────────────────────────────────
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
  const chartData = Object.values(byDay).slice(-14); // last 14 days

  const totalSent     = history.filter(t => t.direction === "out").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalReceived = history.filter(t => t.direction === "in" ).reduce((s, t) => s + parseFloat(t.amount), 0);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Analytics</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>On-chain transaction breakdown</p>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 32 }}>
        {[
          ["Total txs",      history.length,            "#6366f1"],
          ["Total sent",     `${totalSent.toFixed(4)} ETH`,      "#ef4444"],
          ["Total received", `${totalReceived.toFixed(4)} ETH`, "#10b981"],
        ].map(([label, val, accent]) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderLeft: `4px solid ${accent}` }}>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "6px 0 0" }}>{val}</p>
          </div>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "#f9fafb", borderRadius: 16, color: "#9ca3af" }}>
          No on-chain transactions found for this wallet yet.
        </div>
      ) : (
        <>
          {/* Volume line chart */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>ETH volume over time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent"     stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tx count bar chart */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Daily transaction count</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
