import React from "react";
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { styles } from "./styles";

export default function ChatModalView({
  visible,
  activeChatFriend,
  chats,
  closeChatSession,
  chatInput,
  setChatInput,
  sendMessage,
}) {
  if (!activeChatFriend) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={closeChatSession}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {activeChatFriend ? `${activeChatFriend.name}` : "채팅"}
          </Text>
          <TouchableOpacity onPress={closeChatSession} style={styles.closeBtn}>
            <Text style={{ fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chatProfileHeader}>
          <View
            style={[
              styles.avatarLarge,
              {
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: activeChatFriend.avatarColor || "#ddd",
              },
            ]}
          >
            <Text style={{ fontSize: 24, fontWeight: "700" }}>
              {activeChatFriend.name.charAt(0)}
            </Text>
          </View>
          <View style={{ marginTop: 12, alignItems: "center" }}>
            <Text style={styles.chatProfileName}>{activeChatFriend.name}</Text>
            <Text style={{ color: "#6b7280" }}>
              {activeChatFriend.status || "상태 메세지가 없습니다."}
            </Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.chatBody}>
          {(chats[activeChatFriend.id] || []).length === 0 && (
            <Text style={styles.chatEmptyText}>
              아직 대화가 없습니다. 인사해보세요!
            </Text>
          )}
          {(chats[activeChatFriend.id] || []).map((msg, idx) => (
            <View
              key={`${msg.ts}-${idx}`}
              style={[
                styles.bubbleRow,
                msg.from === "me" ? styles.myBubbleRow : styles.friendBubbleRow,
              ]}
            >
              {msg.from === "friend" && (
                <View
                  style={[
                    styles.avatarTiny,
                    { backgroundColor: activeChatFriend.avatarColor || "#ddd" },
                  ]}
                >
                  <Text style={styles.avatarTinyText}>
                    {activeChatFriend.name.charAt(0)}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  msg.from === "me" ? styles.myBubble : styles.friendBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.from === "me" && { color: "#fff" },
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.chatComposer}>
          <TextInput
            placeholder="메시지를 입력하세요"
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={(e) =>
              sendMessage(activeChatFriend.id, e.nativeEvent.text || "")
            }
            style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
          />
          <TouchableOpacity
            onPress={() => sendMessage(activeChatFriend.id, chatInput)}
            style={[styles.primaryBtn, { marginTop: 0, paddingHorizontal: 18 }]}
          >
            <Text style={styles.primaryBtnText}>보내기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
