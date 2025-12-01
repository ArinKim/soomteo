import React from "react";
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { styles } from "./styles";
import { PERSONALITY_OPTIONS, AVATAR_COLORS } from "./constants";

export default function FriendAddModal({
  visible,
  onClose,
  newFriendName,
  setNewFriendName,
  newFriendStatus,
  setNewFriendStatus,
  newFriendAvatarColor,
  setNewFriendAvatarColor,
  newFriendPersonality,
  setNewFriendPersonality,
  personalityDropdownOpen,
  togglePersonalityDropdown,
  handleSaveFriend,
  setPersonalityDropdownOpen,
  editingFriendId,
  onDeleteFriend,
  headerTitle = "친구 추가",
  imageUri,
  onPickImage,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        onClose();
        setPersonalityDropdownOpen(false);
      }}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.managementHeader}>
          <Text style={styles.modalTitle}>{headerTitle}</Text>
          <TouchableOpacity
            onPress={() => {
              onClose();
              setPersonalityDropdownOpen(false);
            }}
            style={styles.closeBtn}
          >
            <Text style={{ fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontWeight: "700", marginBottom: 10 }}>친구 이름</Text>
          <TextInput
            placeholder="친구 이름"
            value={newFriendName}
            onChangeText={setNewFriendName}
            style={styles.input}
          />
          <Text style={{ fontWeight: "700", marginBottom: 10 }}>
            상태 메세지
          </Text>
          <TextInput
            placeholder="상태 메세지"
            value={newFriendStatus}
            onChangeText={setNewFriendStatus}
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.personalityButton}
            onPress={togglePersonalityDropdown}
          >
            <Text style={styles.personalityText}>
              AI 성격: {newFriendPersonality}
            </Text>
            <Text style={{ color: "#0A84FF" }}>클릭하여 선택</Text>
          </TouchableOpacity>
          {personalityDropdownOpen && (
            <View style={styles.dropdownList}>
              {PERSONALITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownItem,
                    option === newFriendPersonality &&
                      styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setNewFriendPersonality(option);
                    setPersonalityDropdownOpen(false);
                  }}
                >
                  <Text
                    style={
                      option === newFriendPersonality
                        ? styles.dropdownItemTextActive
                        : styles.dropdownItemText
                    }
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={{ fontWeight: "700", marginBottom: 10, marginTop: 12 }}>
            프로필 이미지
          </Text>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={onPickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View
                style={[
                  styles.profileImagePlaceholder,
                  { backgroundColor: newFriendAvatarColor },
                ]}
              >
                <Text style={styles.profileImagePlaceholderText}>
                  이미지 선택
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={{ fontWeight: "700", marginBottom: 10, marginTop: 12 }}>
            프로필 색상
          </Text>
          <View style={styles.colorPickerRow}>
            {AVATAR_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  newFriendAvatarColor === color && styles.colorSwatchSelected,
                  { backgroundColor: color },
                ]}
                onPress={() => setNewFriendAvatarColor(color)}
              >
                {newFriendAvatarColor === color && (
                  <Text style={styles.colorSwatchText}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formActionRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.actionBtn]}
              onPress={handleSaveFriend}
            >
              <Text style={styles.primaryBtnText}>저장</Text>
            </TouchableOpacity>

            {editingFriendId && (
              <TouchableOpacity
                style={[styles.deleteBtn, styles.actionBtn]}
                onPress={() => {
                  onDeleteFriend && onDeleteFriend(editingFriendId);
                  onClose();
                }}
              >
                <Text style={styles.deleteBtnText}>삭제</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
