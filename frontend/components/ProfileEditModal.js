import React from "react";
import { Modal, SafeAreaView, View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { styles } from "./styles";
import { AVATAR_COLORS } from "./constants";

export default function ProfileEditModal({
  visible,
  onClose,
  name,
  status,
  avatarColor,
  setName,
  setStatus,
  setAvatarColor,
  onSave,
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>내 프로필 수정</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontWeight: "700", marginBottom: 10 }}>이름</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
          <Text style={{ fontWeight: "700", marginBottom: 10 }}>상태 메세지</Text>
          <TextInput value={status} onChangeText={setStatus} style={styles.input} />
          <Text style={{ fontWeight: "700", marginBottom: 10 }}>프로필 색상</Text>
          <View style={styles.colorPickerRow}>
            {AVATAR_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  avatarColor === color && styles.colorSwatchSelected,
                  { backgroundColor: color },
                ]}
                onPress={() => setAvatarColor(color)}
              >
                {avatarColor === color && <Text style={styles.colorSwatchText}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.primaryBtn, styles.primaryBtnFull]} onPress={onSave}>
            <Text style={styles.primaryBtnText}>저장</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
