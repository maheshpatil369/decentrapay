import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useWallet } from "../context/WalletContext";

const shortenAddress = (addr) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

export default function DashboardScreen({ navigation }) {
  const { account, balance, disconnect, refreshBalance, walletType } = useWallet();

  const actions = [
    { icon: "↑",  label: "Send",    screen: "Send"    },
    { icon: "📋", label: "History", screen: "History" },
    { icon: "⬛", label: "QR Pay",  screen: "QR"      },
  ];

  return (
    <ScrollView style={{ backgroundColor: "#f9fafb" }}>
      <View style={s.container}>
        {/* Balance card */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Sepolia ETH balance</Text>
          <Text style={s.balanceValue}>{parseFloat(balance).toFixed(4)}</Text>
          <Text style={s.balanceUnit}>ETH</Text>
          <Text style={s.addressText}>{shortenAddress(account)}</Text>
          <View style={s.walletBadge}>
            <Text style={s.walletBadgeText}>
              {walletType === "metamask" ? "🦊 MetaMask" : "🔑 Dummy wallet"}
            </Text>
          </View>
          <TouchableOpacity style={s.refreshBtn} onPress={refreshBalance}>
            <Text style={s.refreshBtnText}>↻ Refresh balance</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <Text style={s.sectionTitle}>Quick actions</Text>
        <View style={s.actionsGrid}>
          {actions.map(({ icon, label, screen }) => (
            <TouchableOpacity
              key={screen}
              style={s.actionCard}
              onPress={() => navigation.navigate(screen)}
            >
              <Text style={s.actionIcon}>{icon}</Text>
              <Text style={s.actionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Disconnect */}
        <TouchableOpacity style={s.disconnectBtn} onPress={disconnect}>
          <Text style={s.disconnectText}>Disconnect wallet</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { padding: 20 },
  balanceCard:     { backgroundColor: "#4f46e5", borderRadius: 20, padding: 24, marginBottom: 24, alignItems: "center" },
  balanceLabel:    { color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 4 },
  balanceValue:    { color: "#fff", fontSize: 52, fontWeight: "800" },
  balanceUnit:     { color: "rgba(255,255,255,0.7)", fontSize: 20, marginTop: -4 },
  addressText:     { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 12, fontFamily: "monospace" },
  walletBadge:     { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  walletBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  refreshBtn:      { marginTop: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", borderRadius: 99, paddingHorizontal: 16, paddingVertical: 6 },
  refreshBtnText:  { color: "#fff", fontSize: 12, fontWeight: "600" },
  sectionTitle:    { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  actionsGrid:     { flexDirection: "row", gap: 12, marginBottom: 24 },
  actionCard:      { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionIcon:      { fontSize: 28, marginBottom: 8 },
  actionLabel:     { fontSize: 13, fontWeight: "600", color: "#374151" },
  disconnectBtn:   { backgroundColor: "#fee2e2", borderRadius: 12, padding: 14, alignItems: "center" },
  disconnectText:  { color: "#b91c1c", fontWeight: "700", fontSize: 15 },
});
