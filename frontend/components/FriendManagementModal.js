import React from "react";
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { styles } from "./styles";

export default function FriendManagementModal({
  visible,
  friends,
  onClose,
  onEditFriend,
  deleteFriend,
  onAddFriend,
  setPersonalityDropdownOpen,
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.managementHeader}>
          <Text style={styles.modalTitle}>친구 관리</Text>
          <View style={styles.managementHeaderActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setPersonalityDropdownOpen(false);
                onAddFriend();
              }}
            >
              <Text style={styles.secondaryBtnText}>친구 추가</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.managementList}>
          {friends.map((friend) => (
            <View key={friend.id} style={styles.managementRow}>
              <View>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendSubtitle}>{friend.status}</Text>
              </View>
              <View style={styles.managementActionGroup}>
                <TouchableOpacity
                  style={[styles.managementActionBtn, styles.managementEditBtn]}
                  onPress={() => {
                    onClose();
                    onEditFriend(friend);
                  }}
                >
                  <Text style={styles.managementActionText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.managementActionBtn,
                    styles.managementDeleteBtn,
                  ]}
                  onPress={() => deleteFriend(friend.id)}
                >
                  <Text style={styles.managementActionText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
