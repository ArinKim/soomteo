import React from "react";
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { styles } from "./styles";

export default function ProfileModalView({
  visible,
  selectedFriend,
  closeProfile,
  handleCall,
  handleStartChat,
}) {
  if (!selectedFriend) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={closeProfile}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>프로필</Text>
          <TouchableOpacity onPress={closeProfile} style={styles.closeBtn}>
            <Text style={{ fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={[
                styles.avatarLarge,
                { backgroundColor: selectedFriend.avatarColor || "#ddd" },
              ]}
            >
              <Text style={{ fontSize: 28, fontWeight: "700" }}>
                {selectedFriend.name.charAt(0)}
              </Text>
            </View>
          </View>
          <Text style={{ fontWeight: "700" }}>이름</Text>
          <Text style={{ marginBottom: 12 }}>{selectedFriend.name}</Text>
          <Text style={{ fontWeight: "700" }}>상태 메세지</Text>
          <Text style={{ marginBottom: 12 }}>{selectedFriend.status}</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => handleCall(selectedFriend)}
              style={[styles.callBtn, { flex: 1, marginRight: 8 }]}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>
                전화하기
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStartChat(selectedFriend)}
              style={[styles.chatBtn, { flex: 1, marginLeft: 8 }]}
            >
              <Text style={{ textAlign: "center" }}>채팅 시작</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
