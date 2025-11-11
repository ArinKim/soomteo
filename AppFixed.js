import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Modal,
  ScrollView,
} from "react-native";

const INITIAL_FRIENDS = [
  {
    id: "1",
    name: "민지",
    status: "오늘 기분은 괜찮아요.",
    avatarColor: "#F2C94C",
  },
  {
    id: "2",
    name: "준호",
    status: "도움이 필요하면 말해요.",
    avatarColor: "#60A5FA",
  },
  {
    id: "3",
    name: "수빈",
    status: "농담은 내가 최고!",
    avatarColor: "#34D399",
  },
];

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [tab, setTab] = useState("friends");

  const [theme, setTheme] = useState("kakao");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chats, setChats] = useState({});

  const [newFriendName, setNewFriendName] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingStatus, setEditingStatus] = useState("");

  function handleLogin() {
    if (
      (identifier === "0000" || identifier === "0000@example.com") &&
      password === "0000"
    ) {
      setUser({ id: "0000", name: "테스트 유저" });
      setScreen("app");
      setTab("friends");
      return;
    }
    alert("로그인 실패: 테스트 계정은 id:0000 password:0000 입니다.");
  }

  function openProfile(friend) {
    setSelectedFriend(friend);
    setEditingName(friend.name);
    setEditingStatus(friend.status);
  }

  function closeProfile() {
    setSelectedFriend(null);
  }

  function saveProfile() {
    if (!selectedFriend) return;
    setFriends((prev) =>
      prev.map((f) =>
        f.id === selectedFriend.id
          ? { ...f, name: editingName, status: editingStatus }
          : f
      )
    );
    setSelectedFriend((prev) =>
      prev ? { ...prev, name: editingName, status: editingStatus } : prev
    );
    alert("프로필이 저장되었습니다.");
  }

  function handleCall(friend) {
    alert(`${friend.name}에게 전화 거는 중... (시뮬레이션)`);
  }
  function handleStartChat(friend) {
    setChats((prev) => ({ ...prev, [friend.id]: prev[friend.id] ?? [] }));
    setTab("chats");
  }

  function addFriendFromSettings() {
    const name = newFriendName.trim();
    if (!name) return alert("이름을 입력하세요.");
    const nf = {
      id: String(Date.now()),
      name,
      status: "새로운 AI 친구입니다.",
      avatarColor: "#D1D5DB",
    };
    setFriends((prev) => [nf, ...prev]);
    setNewFriendName("");
    alert("새 친구가 추가되었습니다.");
  }

  function sendMessage(friendId, text) {
    if (!text.trim()) return;
    setChats((prev) => {
      const updated = { ...(prev || {}) };
      updated[friendId] = [
        ...(updated[friendId] || []),
        { from: "me", text: text.trim(), ts: Date.now() },
      ];
      return updated;
    });
  }

  if (screen === "landing") {
    return (
      <SafeAreaView
        style={[
          styles.container,
          theme === "kakao" ? styles.kakaoBg : styles.iosBg,
        ]}
      >
        <StatusBar
          barStyle={theme === "kakao" ? "dark-content" : "light-content"}
        />
        <View style={styles.center}>
          <Text
            style={[
              styles.title,
              theme === "kakao" ? styles.kakaoTitle : styles.iosTitle,
            ]}
          >
            soomteo
          </Text>
          <Text style={styles.subtitle}>청소년·노약자 상담용 AI 전화 친구</Text>
          <View style={styles.themeRow}>
            <TouchableOpacity
              onPress={() => setTheme("kakao")}
              style={[
                styles.themeBtn,
                theme === "kakao" && styles.themeBtnActive,
              ]}
            >
              <Text>카카오 테마</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTheme("ios")}
              style={[
                styles.themeBtn,
                theme === "ios" && styles.themeBtnActive,
              ]}
            >
              <Text>아이폰 전화 테마</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setScreen("login")}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>로그인 / 시작</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === "login") {
    return (
      <SafeAreaView
        style={[
          styles.container,
          theme === "kakao" ? styles.kakaoBg : styles.iosBg,
        ]}
      >
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>로그인</Text>
          <TextInput
            placeholder="이메일 또는 전화번호"
            value={identifier}
            onChangeText={setIdentifier}
            style={styles.input}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
          <Text style={styles.hint}>* 테스트 계정: id:0000 password:0000</Text>
          <TouchableOpacity onPress={handleLogin} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setScreen("landing")}
            style={styles.linkBtn}
          >
            <Text>뒤로</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, styles.appBg]}>
      <StatusBar barStyle={"dark-content"} />
      <View style={styles.appHeader}>
        <Text style={styles.appHeaderTitle}>
          {tab === "friends" ? "친구" : tab === "chats" ? "채팅" : "설정"}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setUser(null);
            setScreen("landing");
          }}
          style={styles.smallBtn}
        >
          <Text>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {tab === "friends" && (
          <FlatList
            data={friends}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.friendRow}
                onPress={() => openProfile(item)}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: item.avatarColor || "#ddd" },
                  ]}
                >
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{item.name}</Text>
                  <Text style={styles.friendSubtitle}>{item.status}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {tab === "chats" && (
          <ScrollView>
            {friends.map((f) => (
              <View key={f.id} style={styles.chatRow}>
                <View
                  style={[
                    styles.avatarSmall,
                    { backgroundColor: f.avatarColor || "#ddd" },
                  ]}
                >
                  <Text style={styles.avatarText}>{f.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600" }}>{f.name}</Text>
                  <Text style={{ color: "#666" }}>
                    {chats[f.id] && chats[f.id].length
                      ? chats[f.id][chats[f.id].length - 1].text
                      : "대화가 없습니다."}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleStartChat(f)}
                  style={styles.openChatBtn}
                >
                  <Text>열기</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {tab === "settings" && (
          <View style={styles.settingsBox}>
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>
              새 친구 추가
            </Text>
            <TextInput
              placeholder="친구 이름"
              value={newFriendName}
              onChangeText={setNewFriendName}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={addFriendFromSettings}
              style={[styles.primaryBtn, { marginTop: 8 }]}
            >
              <Text style={styles.primaryBtnText}>추가</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 16, color: "#666" }}>
              설정: 친구 프로필 편집, 알림 설정 등(간략화됨)
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setTab("friends")}
        >
          <Text style={tab === "friends" ? styles.tabActive : undefined}>
            친구
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setTab("chats")}
        >
          <Text style={tab === "chats" ? styles.tabActive : undefined}>
            채팅
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setTab("settings")}
        >
          <Text style={tab === "settings" ? styles.tabActive : undefined}>
            설정
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={!!selectedFriend}
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

          {selectedFriend && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
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
              <TextInput
                value={editingName}
                onChangeText={setEditingName}
                style={[styles.input, { marginBottom: 12 }]}
              />

              <Text style={{ fontWeight: "700" }}>상태 메세지</Text>
              <TextInput
                value={editingStatus}
                onChangeText={setEditingStatus}
                style={[styles.input, { marginBottom: 12 }]}
              />

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

              <TouchableOpacity
                onPress={saveProfile}
                style={[styles.primaryBtn, { marginTop: 20 }]}
              >
                <Text style={styles.primaryBtnText}>저장</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {tab === "chats" && (
        <View style={styles.chatComposer}>
          <TextInput
            placeholder="메시지 입력"
            onSubmitEditing={(e) => {
              const text = e.nativeEvent.text || "";
              if (friends[0]) sendMessage(friends[0].id, text);
            }}
            style={styles.input}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBg: { backgroundColor: "#fff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#444", marginBottom: 16 },
  themeRow: { flexDirection: "row", marginBottom: 20 },
  themeBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 6,
  },
  themeBtnActive: { borderColor: "#f4c430" },
  primaryBtn: {
    backgroundColor: "#F2C94C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 12,
  },
  primaryBtnText: { fontWeight: "700" },

  kakaoBg: { backgroundColor: "#FFF8E6" },
  iosBg: { backgroundColor: "#0A84FF" },
  kakaoTitle: { color: "#3C1E00" },
  iosTitle: { color: "#fff" },

  loginBox: { padding: 20, marginTop: 60 },
  loginTitle: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  hint: { fontSize: 12, color: "#666", marginBottom: 10 },
  linkBtn: { marginTop: 10, alignItems: "center" },

  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  appHeaderTitle: { fontSize: 20, fontWeight: "700" },
  smallBtn: { padding: 8 },

  content: { flex: 1 },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontWeight: "700" },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  friendInfo: { flex: 1 },
  friendName: { fontWeight: "700", fontSize: 16 },
  friendSubtitle: { color: "#6b7280", fontSize: 13 },

  tabBar: {
    height: 64,
    borderTopWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabActive: { color: "#111", fontWeight: "700" },

  settingsBox: { padding: 16 },

  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 8 },

  callBtn: { backgroundColor: "#1E90FF", padding: 12, borderRadius: 10 },
  chatBtn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },

  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  openChatBtn: { padding: 8, backgroundColor: "#eee", borderRadius: 8 },

  chatComposer: { padding: 8, borderTopWidth: 1, borderColor: "#eee" },
});
