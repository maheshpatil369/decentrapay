import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from "react-native";
import { useWallet } from "../context/WalletContext";

export default function HomeScreen({ navigation }) {
  const { account, connectDummy, generateWallet, loading, error, clearError } = useWallet();
  const [privateKey, setPrivateKey] = useState("");
  const [generated,  setGenerated]  = useState(null);

  useEffect(() => {
    if (account) navigation.replace("Dashboard");
  }, [account, navigation]);

  useEffect(() => {
    if (error) { Alert.alert("Error", error, [{ text: "OK", onPress: clearError }]); }
  }, [error, clearError]);

  const handleGenerate = () => {
    const w = generateWallet();
    setGenerated(w);
    setPrivateKey(w.privateKey);
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.logo}>⬡</Text>
      <Text style={s.title}>DecentraPay</Text>
      <Text style={s.subtitle}>Decentralised payments on Ethereum</Text>

      <View style={s.card}>
        <Text style={s.cardTitle}>Connect a wallet</Text>

        <TouchableOpacity style={s.genBtn} onPress={handleGenerate}>
          <Text style={s.genBtnText}>✨ Generate new wallet</Text>
        </TouchableOpacity>

        {generated && (
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>ADDRESS</Text>
            <Text style={s.infoMono}>{generated.address}</Text>
            <Text style={[s.infoLabel, { color: "#b91c1c", marginTop: 8 }]}>
              ⚠ PRIVATE KEY — save this now!
            </Text>
            <Text style={s.infoMono}>{generated.privateKey}</Text>
          </View>
        )}

        <Text style={s.inputLabel}>Private key (0x…)</Text>
        <TextInput
          style={s.input}
          value={privateKey}
          onChangeText={setPrivateKey}
          placeholder="0x..."
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          secureTextEntry
        />

        <TouchableOpacity
          style={[s.primaryBtn, (!privateKey || loading) && s.disabled]}
          onPress={() => connectDummy(privateKey)}
          disabled={!privateKey || loading}
        >
          <Text style={s.primaryBtnText}>
            {loading ? "Connecting…" : "🔑 Connect Dummy Wallet"}
          </Text>
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <TouchableOpacity style={s.wcBtn} onPress={() => Alert.alert("WalletConnect", "Integrate @walletconnect/modal-react-native in production.")}>
          <Text style={s.wcBtnText}>🔗 WalletConnect (production)</Text>
        </TouchableOpacity>
      </View>

      <View style={s.features}>
        {[["🔐","Non-custodial"],["⚡","Instant on-chain"],["📊","Analytics"]].map(([icon, label]) => (
          <View key={label} style={s.feature}>
            <Text style={s.featureIcon}>{icon}</Text>
            <Text style={s.featureLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flexGrow: 1, alignItems: "center", padding: 24, backgroundColor: "#f9fafb" },
  logo:         { fontSize: 56, marginTop: 40, marginBottom: 8 },
  title:        { fontSize: 32, fontWeight: "800", color: "#111827", marginBottom: 6 },
  subtitle:     { fontSize: 15, color: "#6b7280", marginBottom: 32 },
  card:         { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 24, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, marginBottom: 28 },
  cardTitle:    { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 16 },
  genBtn:       { backgroundColor: "#ede9fe", borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 14 },
  genBtnText:   { color: "#5b21b6", fontWeight: "600", fontSize: 14 },
  infoBox:      { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 10, padding: 12, marginBottom: 14 },
  infoLabel:    { fontSize: 10, fontWeight: "700", color: "#065f46", letterSpacing: 1 },
  infoMono:     { fontSize: 11, fontFamily: "monospace", color: "#374151", marginTop: 4, flexWrap: "wrap" },
  inputLabel:   { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input:        { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, fontSize: 14, color: "#111827", marginBottom: 14 },
  primaryBtn:   { backgroundColor: "#4f46e5", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 12 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  disabled:     { opacity: 0.5 },
  divider:      { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText:  { marginHorizontal: 10, color: "#9ca3af", fontSize: 12 },
  wcBtn:        { borderWidth: 1.5, borderColor: "#4f46e5", borderRadius: 10, padding: 13, alignItems: "center" },
  wcBtnText:    { color: "#4f46e5", fontWeight: "600", fontSize: 14 },
  features:     { flexDirection: "row", gap: 12 },
  feature:      { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, alignItems: "center" },
  featureIcon:  { fontSize: 22, marginBottom: 6 },
  featureLabel: { fontSize: 11, color: "#6b7280", textAlign: "center", fontWeight: "500" },
});
