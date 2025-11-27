import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function Button({ children, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.btn, style]}>
      <Text style={styles.txt}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 12,
    backgroundColor: "#F2C94C",
    borderRadius: 8,
    alignItems: "center",
  },
  txt: { fontWeight: "600" },
});
