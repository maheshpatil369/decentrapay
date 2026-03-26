import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Linking,
} from "react-native";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/contract";

const EXPLORER = "https://sepolia.etherscan.io/tx/";

export default function SendScreen({ navigation }) {
  const { sendPayment, refreshBalance } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount,    setAmount]    = useState("");
  const [message,   setMessage]   = useState("");
  const [status,    setStatus]    = useState("idle"); // idle | signing | pending | confirmed | failed
  const [txHash,    setTxHash]    = useState(null);
  const [error,     setError]     = useState(null);

  const validate = () => {
    if (!ethers.isAddress(recipient)) { Alert.alert("Invalid address"); return false; }
    if (!(parseFloat(amount) > 0))    { Alert.alert("Amount must be > 0"); return false; }
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setError(null);
    setStatus("signing");
    try {
      const tx = await sendPayment({
        contractAddress: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        recipient,
        amountEth: amount,
        message,
      });
      setTxHash(tx.hash);
      setStatus("pending");
      await tx.wait(1);
      setStatus("confirmed");
      await refreshBalance();
    } catch (e) {
      setError(e?.reason || e?.message || "Transaction failed");
      setStatus("failed");
    }
  };

  const reset = () => {
    setStatus("idle"); setTxHash(null);
    setError(null); setRecipient(""); setAmount(""); setMessage("");
  };

  if (status === "confirmed") {
    return (
      <View style={[s.container, s.center]}>
        <Text style={{ fontSize: 56, marginBottom: 12 }}>✅</Text>
        <Text style={s.successTitle}>Payment sent!</Text>
        <Text style={s.successSub}>{amount} ETH to {recipient.slice(0, 10)}…</Text>
        {txHash && (
          <TouchableOpacity
            style={s.explorerBtn}
            onPress={() => Linking.openURL(EXPLORER + txHash)}
          >
            <Text style={s.explorerBtnText}>View on Etherscan ↗</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.ghostBtn} onPress={reset}>
          <Text style={s.ghostBtnText}>Send another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.ghostBtn, { marginTop: 8 }]} onPress={() => navigation.goBack()}>
          <Text style={s.ghostBtnText}>← Back to dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const busy = ["signing", "pending"].includes(status);

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.card}>
        {[
          { label: "Recipient address", value: recipient, setter: setRecipient, placeholder: "0x…",        multiline: false, secure: false },
          { label: "Amount (ETH)",      value: amount,    setter: setAmount,    placeholder: "0.001",       multiline: false, secure: false, keyboardType: "decimal-pad" },
          { label: "Message (optional)",value: message,   setter: setMessage,   placeholder: "e.g. Rent",  multiline: true,  secure: false },
        ].map(({ label, value, setter, placeholder, multiline, keyboardType }) => (
          <View key={label} style={{ marginBottom: 14 }}>
            <Text style={s.label}>{label}</Text>
            <TextInput
              style={[s.input, multiline && { height: 72, textAlignVertical: "top" }]}
              value={value}
              onChangeText={setter}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              multiline={multiline}
              keyboardType={keyboardType}
              editable={!busy}
            />
          </View>
        ))}

        {/* Status banner */}
        {status === "signing" && <StatusBanner color="#92400e" bg="#fef3c7" text="⏳ Waiting for signature…" />}
        {status === "pending" && <StatusBanner color="#1e40af" bg="#dbeafe" text="🔄 Transaction submitted, waiting for confirmation…" />}
        {(error || status === "failed") && (
          <StatusBanner color="#b91c1c" bg="#fee2e2" text={`❌ ${error || "Transaction failed"}`} />
        )}

        <TouchableOpacity
          style={[s.primaryBtn, busy && s.disabled]}
          onPress={handleSend}
          disabled={busy}
        >
          <Text style={s.primaryBtnText}>
            {status === "signing" ? "Awaiting signature…"
              : status === "pending"  ? "Confirming…"
              : "Send Payment"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const StatusBanner = ({ color, bg, text }) => (
  <View style={{ backgroundColor: bg, borderRadius: 8, padding: 10, marginBottom: 12 }}>
    <Text style={{ color, fontSize: 13 }}>{text}</Text>
  </View>
);

const s = StyleSheet.create({
  container:      { flexGrow: 1, padding: 20, backgroundColor: "#f9fafb" },
  center:         { justifyContent: "center", alignItems: "center" },
  card:           { backgroundColor: "#fff", borderRadius: 16, padding: 24, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  label:          { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input:          { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, fontSize: 14, color: "#111827", backgroundColor: "#fff" },
  primaryBtn:     { backgroundColor: "#4f46e5", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 4 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled:       { opacity: 0.55 },
  ghostBtn:       { backgroundColor: "#f3f4f6", borderRadius: 10, padding: 13, alignItems: "center", marginTop: 10, width: "80%" },
  ghostBtnText:   { color: "#374151", fontWeight: "600", fontSize: 14 },
  successTitle:   { fontSize: 24, fontWeight: "800", color: "#065f46", marginBottom: 6 },
  successSub:     { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  explorerBtn:    { backgroundColor: "#4f46e5", borderRadius: 99, paddingHorizontal: 24, paddingVertical: 12, marginBottom: 8 },
  explorerBtnText:{ color: "#fff", fontWeight: "700", fontSize: 14 },
});
