import { TextEncoder, TextDecoder } from "text-encoding";
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";

import LandingScreen from "./components/LandingScreen";
import LoginScreen from "./components/LoginScreen";
import FriendsListView from "./components/FriendsListView";
import SettingsView from "./components/SettingsView";
import ProfileModalView from "./components/ProfileModalView";
import ChatModalView from "./components/ChatModalView";
import ChatListView from "./components/ChatListView";
import FriendManagementModal from "./components/FriendManagementModal";
import FriendAddModal from "./components/FriendAddModal";
import ProfileEditModal from "./components/ProfileEditModal";

import { styles } from "./components/styles";
import { API_BASE_URL } from "./components/constants";

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [tab, setTab] = useState("friends");

  // 로그인 정보
  const [identifier, setIdentifier] = useState(""); // email or ID
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState(null); // 실제 DB의 user.id

  // 서버 데이터
  const [friends, setFriends] = useState([]);
  const [activeChatFriend, setActiveChatFriend] = useState(null);

  // 프로필 수정 관련
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [profileEditVisible, setProfileEditVisible] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    status: "",
    avatarColor: "#F97316",
  });

  // 친구 관리 모달
  const [friendManagementVisible, setFriendManagementVisible] = useState(false);
  const [friendFormVisible, setFriendFormVisible] = useState(false);

  // =====================================================================
  // 1) 로그인 → 토큰 없이 local userId (DB 값)만 사용
  // =====================================================================
  // async function handleLogin() {
  //   try {
  //     const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         identifier,
  //         password,
  //       }),
  //     });
  //
  //     if (!res.ok) {
  //       alert("로그인 실패");
  //       return;
  //     }
  //
  //     const data = await res.json();
  //     setUserId(data.userId);
  //     setUserProfile({
  //       name: data.name,
  //       status: data.status_message ?? "",
  //       avatarColor: "#F97316",
  //     });
  //
  //     setScreen("app");
  //     loadFriends(data.userId);
  //   } catch (e) {
  //     console.warn("login error:", e);
  //   }
  // }
  async function handleLogin() {
    // 테스트 로그인
    if (
        (identifier === "0000" || identifier === "0000@example.com") &&
        password === "0000"
    ) {
      const fixedUserId = 1; // DB의 users.id = 1
      setUserId(fixedUserId);

      // 로그인 성공 후 친구 목록 로딩
      loadFriends(fixedUserId);

      setScreen("app");
      setTab("friends");
      return;
    }

    alert("로그인 실패: 테스트 계정을 이용해 주세요.");
  }



  // =====================================================================
  // 2) 서버에서 친구 목록 불러오기
  // =====================================================================
  async function loadFriends(uid) {
    try {
      const url = `${API_BASE_URL}/api/friends/${uid}`;
      console.log("[loadFriends] GET", url);

      const res = await fetch(url);

      // 먼저 원시 텍스트로 한 번 확인
      const rawText = await res.text();
      console.log("[loadFriends] raw response:", res.status, rawText);

      if (!res.ok) {
        console.warn("[loadFriends] HTTP error:", res.status);
        setFriends([]);
        return;
      }

      // JSON 파싱 시도
      let data;
      try {
        data = rawText ? JSON.parse(rawText) : [];
      } catch (parseErr) {
        console.warn("[loadFriends] JSON parse error:", parseErr);
        setFriends([]);
        return;
      }

      console.log("[loadFriends] parsed data:", data);

      // 👉 백엔드가 배열이 아닌 형태로 줄 수도 있으니 방어
      let list = data;

      // 만약 { friends: [...] } 같은 형태라면 이렇게 꺼낸다
      if (!Array.isArray(list) && Array.isArray(data.friends)) {
        list = data.friends;
      }

      if (!Array.isArray(list)) {
        console.warn("[loadFriends] not an array. data =", data);
        setFriends([]);
        return;
      }

      // 여기부터는 배열이라고 가정
      const mapped = list.map((f) => ({
        id: String(f.id), // RN key 때문에 string으로
        name: f.name,
        // 자바에서 statusMessage, status_message 등 어떤 이름으로 내려와도 방어
        status: f.status_message || f.statusMessage || f.status || "",
        avatarColor: "#A5B4FC",
      }));

      console.log("[loadFriends] mapped friends:", mapped);
      setFriends(mapped);
    } catch (e) {
      console.warn("loadFriends error:", e);
      setFriends([]);
    }
  }


  // =====================================================================
  // 3) 채팅방 열기
  // =====================================================================
  function openChatSession(friend) {
    setActiveChatFriend(friend);
    setTab("chats");
  }

  function closeChatSession() {
    setActiveChatFriend(null);
  }

  // =====================================================================
  // 4) 친구 프로필 열기
  // =====================================================================
  function openFriendProfile(friend) {
    setSelectedFriend(friend);
  }

  function closeProfile() {
    setSelectedFriend(null);
  }

  // =====================================================================
  // 5) 로그아웃
  // =====================================================================
  function handleLogout() {
    setScreen("landing");
    setUserId(null);
    setFriends([]);
  }

  // =====================================================================
  // MAIN RENDER
  // =====================================================================

  if (screen === "landing") {
    return (
        <LandingScreen theme="ios" onLoginPress={() => setScreen("login")} />
    );
  }

  if (screen === "login") {
    return (
        <LoginScreen
            theme="ios"
            identifier={identifier}
            password={password}
            setIdentifier={setIdentifier}
            setPassword={setPassword}
            onLogin={handleLogin}
            onBack={() => setScreen("landing")}
        />
    );
  }

  return (
      <SafeAreaView style={[styles.container, styles.appBg]}>
        <StatusBar barStyle="dark-content" />

        {/* HEADER */}
        <View style={styles.appHeader}>
          <Text style={styles.appHeaderTitle}>
            {tab === "friends" ? "친구" : tab === "chats" ? "채팅" : "설정"}
          </Text>

          <TouchableOpacity onPress={handleLogout} style={styles.smallBtn}>
            <Text>로그아웃</Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT */}
        <View style={styles.content}>
          {tab === "friends" && (
              <FriendsListView
                  friends={friends}
                  userProfile={userProfile}
                  openProfile={openFriendProfile}
                  openSelfEditor={() => setProfileEditVisible(true)}
              />
          )}

          {tab === "chats" && (
              <ChatListView friends={friends} openChatSession={openChatSession} />
          )}

          {tab === "settings" && (
              <SettingsView
                  theme="ios"
                  setTheme={() => {}}
                  onOpenFriendManagement={() => setFriendManagementVisible(true)}
                  onOpenAccount={() => alert("준비 중")}
              />
          )}
        </View>

        {/* TAB BAR */}
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

        {/* 모달들 */}
        <ProfileModalView
            visible={!!selectedFriend}
            selectedFriend={selectedFriend}
            closeProfile={closeProfile}
            handleStartChat={openChatSession}
        />

        <ChatModalView
            visible={!!activeChatFriend}
            activeChatFriend={activeChatFriend}
            closeChatSession={closeChatSession}
            userId={userId}               // 중요!
        />

        <FriendManagementModal
            visible={friendManagementVisible}
            friends={friends}
            onClose={() => setFriendManagementVisible(false)}
            onAddFriend={() => setFriendFormVisible(true)}
            deleteFriend={() => {}}
        />

        <FriendAddModal
            visible={friendFormVisible}
            onClose={() => setFriendFormVisible(false)}
        />

        <ProfileEditModal
            visible={profileEditVisible}
            onClose={() => setProfileEditVisible(false)}
            name={userProfile.name}
            status={userProfile.status}
            avatarColor={userProfile.avatarColor}
            setName={(v) => setUserProfile((p) => ({ ...p, name: v }))}
            setStatus={(v) => setUserProfile((p) => ({ ...p, status: v }))}
            setAvatarColor={(v) => setUserProfile((p) => ({ ...p, avatarColor: v }))}
            onSave={() => setProfileEditVisible(false)}
        />
      </SafeAreaView>
  );
}
