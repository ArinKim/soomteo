import { AVATAR_COLORS } from "./constants";
import React from "react";
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { styles } from "./styles";

export default function FriendAddModal({
                                         visible,
                                         onClose,
                                         headerTitle = "친구 추가",

                                         newFriendName,
                                         setNewFriendName,

                                         newFriendGender,
                                         setNewFriendGender,
                                         genderOptions, // [{code, label}]

                                         newFriendType,
                                         setNewFriendType,
                                         typeOptions, // ["친구","부모님","자식","친척"]

                                         newFriendProfileImageUrl,
                                         setNewFriendProfileImageUrl,

                                         newFriendStatus,
                                         setNewFriendStatus,

                                         newFriendPrompt,
                                         setNewFriendPrompt,

                                         newFriendAvatarColor,
                                         setNewFriendAvatarColor,

                                         newFriendStartDate,
                                         setNewFriendStartDate,

                                         newFriendEndDate,
                                         setNewFriendEndDate,

                                         newFriendStartTime,
                                         setNewFriendStartTime,

                                         newFriendEndTime,
                                         setNewFriendEndTime,

                                         newFriendCount,
                                         setNewFriendCount,

                                         handleSaveFriend,
                                         editingFriendId,
                                         onDeleteFriend,
                                       }) {
  return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.managementHeader}>
            <Text style={styles.modalTitle}>{headerTitle}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* 이름 */}
            <Text style={{ fontWeight: "700", marginBottom: 10 }}>친구 이름</Text>
            <TextInput
                placeholder="친구 이름"
                value={newFriendName}
                onChangeText={setNewFriendName}
                style={styles.input}
            />

            {/* 성별 */}
            <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 8 }}>
              성별
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {genderOptions.map((g) => (
                  <TouchableOpacity
                      key={g.code}
                      style={[
                        styles.secondaryBtn,
                        newFriendGender === g.code && {
                          backgroundColor: "#0A84FF",
                        },
                      ]}
                      onPress={() => setNewFriendGender(g.code)}
                  >
                    <Text
                        style={[
                          styles.secondaryBtnText,
                          newFriendGender === g.code && { color: "white" },
                        ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
              ))}
            </View>

            {/* 타입 */}
            <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 8 }}>
              타입
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {typeOptions.map((t) => (
                  <TouchableOpacity
                      key={t}
                      style={[
                        styles.secondaryBtn,
                        newFriendType === t && { backgroundColor: "#0A84FF" },
                      ]}
                      onPress={() => setNewFriendType(t)}
                  >
                    <Text
                        style={[
                          styles.secondaryBtnText,
                          newFriendType === t && { color: "white" },
                        ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
              ))}
            </View>

            {/* 프로필 이미지 URL (선택) */}
            <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 8 }}>
              프로필 이미지 URL (선택)
            </Text>
            <TextInput
                placeholder="https://..."
                value={newFriendProfileImageUrl}
                onChangeText={setNewFriendProfileImageUrl}
                style={styles.input}
            />

            {/* 상태 메세지 */}
            <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 8 }}>
              상태 메세지
            </Text>
            <TextInput
                placeholder="상태 메세지"
                value={newFriendStatus}
                onChangeText={setNewFriendStatus}
                style={styles.input}
            />

            {/* 프롬프트 */}
            <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 8 }}>
              프롬프트 (이 친구가 어떤 톤/역할로 말할지)
            </Text>
            <TextInput
                placeholder={
                  "예) 25살 여자 또래 친구처럼 반말로 편하게 대화해줘."
                }
                value={newFriendPrompt}
                onChangeText={setNewFriendPrompt}
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                multiline
            />

            {/* 프로필 색상 */}
            <Text style={{ fontWeight: "700", marginBottom: 10, marginTop: 16 }}>
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

            {/* 안부 메세지 스케줄 */}
            <Text style={{ fontWeight: "700", marginTop: 20, marginBottom: 8 }}>
              안부 메세지 기간 설정
            </Text>
            <Text style={{ marginBottom: 4, fontSize: 12, color: "#666" }}>
              예: 2025-12-01 ~ 2025-12-13 동안 랜덤으로 안부 메세지를 보냅니다.
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, marginBottom: 4 }}>시작일</Text>
                <TextInput
                    placeholder="YYYY-MM-DD"
                    value={newFriendStartDate}
                    onChangeText={setNewFriendStartDate}
                    style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, marginBottom: 4 }}>종료일</Text>
                <TextInput
                    placeholder="YYYY-MM-DD"
                    value={newFriendEndDate}
                    onChangeText={setNewFriendEndDate}
                    style={styles.input}
                />
              </View>
            </View>

            <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 8 }}>
              하루 중 시간대
            </Text>
            <Text style={{ marginBottom: 4, fontSize: 12, color: "#666" }}>
              예: 07:00:00 ~ 21:00:00 사이에만 메세지를 보냅니다.
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, marginBottom: 4 }}>시작 시간</Text>
                <TextInput
                    placeholder="HH:MM:SS"
                    value={newFriendStartTime}
                    onChangeText={setNewFriendStartTime}
                    style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, marginBottom: 4 }}>종료 시간</Text>
                <TextInput
                    placeholder="HH:MM:SS"
                    value={newFriendEndTime}
                    onChangeText={setNewFriendEndTime}
                    style={styles.input}
                />
              </View>
            </View>

            <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 8 }}>
              총 안부 메세지 횟수
            </Text>
            <TextInput
                placeholder="예: 3"
                value={newFriendCount}
                onChangeText={setNewFriendCount}
                style={styles.input}
                keyboardType="numeric"
            />

            {/* 버튼 영역 */}
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
                      onPress={() => onDeleteFriend && onDeleteFriend(editingFriendId)}
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
