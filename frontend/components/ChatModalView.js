// components/ChatModalView.js
import React, { useState, useEffect, useRef } from "react";
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
import { useChat } from "./useChat";

export default function ChatModalView({
                                          visible,
                                          activeChatFriend,
                                          closeChatSession,
                                          userId,
                                      }) {
    const [localInput, setLocalInput] = useState("");

    const scrollViewRef = useRef(null);

    const roomId = activeChatFriend?.id ?? null;

    const { uiMessages, sendMessage: wsSendMessage, connected } = useChat(
        roomId,
        userId
    );

    // 메시지가 추가될 때마다 맨 아래로 스크롤
    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [uiMessages.length]);

    useEffect(() => {
        if (!visible) {
            setLocalInput("");
        }
    }, [visible]);

    const handleChangeText = (text) => {
        setLocalInput(text);
    };

    const handleSend = (text) => {
        const msgText = (text || localInput || "").trim();
        if (!msgText) return;
        if (!roomId) return;
        if (!connected) {
            console.warn("아직 서버와 연결되지 않았습니다.");
            return;
        }

        wsSendMessage(msgText);
        setLocalInput("");
    };

    if (!activeChatFriend) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={closeChatSession}
        >
            <SafeAreaView style={styles.modalContainer}>
                {/* 헤더 */}
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{activeChatFriend.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text
                            style={{
                                marginRight: 8,
                                fontSize: 12,
                                color: connected ? "#16a34a" : "#9ca3af",
                            }}
                        >
                            {connected ? "● 온라인" : "○ 연결 중..."}
                        </Text>
                        <TouchableOpacity
                            onPress={closeChatSession}
                            style={styles.closeBtn}
                        >
                            <Text style={{ fontSize: 18 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 프로필 */}
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
                        <Text style={styles.chatProfileName}>
                            {activeChatFriend.name}
                        </Text>
                        <Text style={{ color: "#6b7280" }}>
                            {activeChatFriend.status || "상태 메세지가 없습니다."}
                        </Text>
                    </View>
                </View>

                {/* 채팅 내용 */}
                <ScrollView ref={scrollViewRef} contentContainerStyle={styles.chatBody}>
                    {uiMessages.length === 0 && (
                        <Text style={styles.chatEmptyText}>
                            아직 대화가 없습니다. 인사해보세요!
                        </Text>
                    )}
                    {uiMessages.map((msg, idx) => (
                        <View
                            key={`${msg.ts}-${idx}`}
                            style={[
                                styles.bubbleRow,
                                msg.from === "me"
                                    ? styles.myBubbleRow
                                    : styles.friendBubbleRow,
                            ]}
                        >
                            {msg.from === "friend" && (
                                <View
                                    style={[
                                        styles.avatarTiny,
                                        {
                                            backgroundColor:
                                                activeChatFriend.avatarColor || "#ddd",
                                        },
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
                                    msg.from === "me"
                                        ? styles.myBubble
                                        : styles.friendBubble,
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

                {/* 입력 */}
                <View style={styles.chatComposer}>
                    <TextInput
                        placeholder="메시지를 입력하세요"
                        value={localInput}
                        onChangeText={handleChangeText}
                        onSubmitEditing={(e) =>
                            handleSend(e.nativeEvent.text || "")
                        }
                        style={[
                            styles.input,
                            { flex: 1, marginBottom: 0, marginRight: 8 },
                        ]}
                    />
                    <TouchableOpacity
                        onPress={() => handleSend(localInput)}
                        disabled={!connected}
                        style={[
                            styles.primaryBtn,
                            {
                                marginTop: 0,
                                paddingHorizontal: 18,
                                opacity: connected ? 1 : 0.5,
                            },
                        ]}
                    >
                        <Text style={styles.primaryBtnText}>
                            {connected ? "보내기" : "연결 중..."}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
