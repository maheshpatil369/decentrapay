import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Share,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useWallet } from "../context/WalletContext";
import { useNavigation } from "@react-navigation/native";

export default function QRScreen() {
  const { account } = useWallet();
  const navigation  = useNavigation();
  const [amount, setAmount] = useState("");

  const uri = amount && parseFloat(amount) > 0
    ? `ethereum:${account}?value=${amount}`
    : account || "";

  const handleShare = async () => {
    await Share.share({ message: uri, title: "My DecentraPay address" });
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      {/* QR code card */}
      <View style={s.card}>
        <Text style={s.title}>Your payment QR</Text>
        <View style={s.qrWrapper}>
          <QRCode value={uri || "0x0"} size={200} />
        </View>

        <View style={s.addrBox}>
          <Text style={s.addrText}>{account}</Text>
        </View>

        <Text style={s.label}>Amount to request (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="0.01"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
          <Text style={s.shareBtnText}>📤 Share address / QR</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={s.infoCard}>
        <Text style={s.infoTitle}>How to use</Text>
        <Text style={s.infoText}>
          • Show this QR code to receive ETH.{"\n"}
          • Optionally enter an amount to pre-fill the sender's form.{"\n"}
          • On the web app, go to QR Pay → paste or scan a URI to auto-fill the send form.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flexGrow: 1, padding: 20, backgroundColor: "#f9fafb" },
  card:         { backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 12, elevation: 3, marginBottom: 16 },
  title:        { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 20 },
  qrWrapper:    { padding: 12, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 20 },
  addrBox:      { backgroundColor: "#f3f4f6", borderRadius: 8, padding: 10, width: "100%", marginBottom: 16 },
  addrText:     { fontFamily: "monospace", fontSize: 11, color: "#374151", textAlign: "center", flexWrap: "wrap" },
  label:        { alignSelf: "flex-start", fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input:        { width: "100%", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, fontSize: 14, color: "#111827", marginBottom: 16 },
  shareBtn:     { backgroundColor: "#4f46e5", borderRadius: 10, paddingVertical: 13, paddingHorizontal: 32 },
  shareBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  infoCard:     { backgroundColor: "#fff", borderRadius: 14, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoTitle:    { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10 },
  infoText:     { fontSize: 13, color: "#6b7280", lineHeight: 20 },
});
