import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
// The Kakao package exports named functions (login, logout, etc.)
// Use namespace import so we can call KakaoLogin.login() and friends.
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import AsyncStorage from "@react-native-async-storage/async-storage";
import CompleteSignupScreen from "./components/CompleteSignupScreen";
import SignupScreen from "./components/SignupScreen";
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
import ChatListView from "./components/ChatListView";
import { styles } from "./components/styles";
import { API_BASE_URL } from "./components/constants";

// API 설정
// const API_BASE_URL = "http://10.50.1.97:8082";
const API_BASE_URL = "http://10.0.2.2:8080";

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
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [chatInput, setChatInput] = useState("");

  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendStatus, setNewFriendStatus] = useState("새로운 AI 친구입니다.");
  const [newFriendPersonality, setNewFriendPersonality] = useState(PERSONALITY_OPTIONS[0]);
  const [newFriendAvatarColor, setNewFriendAvatarColor] = useState(AVATAR_COLORS[0]);
  const [editingFriendId, setEditingFriendId] = useState(null);
  const [personalityDropdownOpen, setPersonalityDropdownOpen] = useState(false);
  const [friendFormTitle, setFriendFormTitle] = useState("친구 추가");

  const [profileEditVisible, setProfileEditVisible] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    status: "",
    avatarColor: "#F97316",
  });

  // 친구 관리 모달
  const [profileFormName, setProfileFormName] = useState(userProfile.name);
  const [profileFormStatus, setProfileFormStatus] = useState(userProfile.status);
  const [profileFormAvatarColor, setProfileFormAvatarColor] = useState(userProfile.avatarColor);
  const [profileEditVisible, setProfileEditVisible] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState(null);
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

  // 앱 시작 시 자동 로그인 확인
  useEffect(() => {
    checkAutoLogin();
  }, []);

  async function checkAutoLogin() {
    try {
      const savedUserData = await AsyncStorage.getItem("userData");
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        setUserProfile({
          name: userData.nickname || userData.name || "사용자",
          status: "환영합니다!",
          avatarColor: "#F97316",
        });
        setScreen("app");
        setTab("friends");
        console.log("✅ 자동 로그인 성공:", userData.nickname);
      }
    } catch (error) {
      console.error("❌ 자동 로그인 실패:", error);
    }
  }

  function handleLogin() {
    // basic validation
    if (!identifier || !password) return Alert.alert('로그인 실패', '이메일과 비밀번호를 입력하세요');

    (async () => {
      try {
        setIsLoggingIn(true);
        const resp = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier.trim(), password }),
        });

        if (!resp.ok) {
          const text = await resp.text();
          Alert.alert('로그인 실패', text || '이메일 또는 비밀번호가 올바르지 않습니다');
          return;
        }

        const member = await resp.json();
        // save and go to app
        await AsyncStorage.setItem('userData', JSON.stringify(member));
        setUserProfile({ name: member.name || '사용자', status: '환영합니다!', avatarColor: '#F97316' });
        setScreen('app');
        setTab('friends');
      } catch (err) {
        console.error('login error', err);
        Alert.alert('로그인 실패', err.message || String(err));
      } finally {
        setIsLoggingIn(false);
      }
    })();
  }

  // 카카오 로그인 - SDK 방식
  async function handleKakaoLogin() {
  if (isLoggingIn) return;

  try {
      setIsLoggingIn(true);
      console.log("=== 카카오 SDK 로그인 시작 ===");

      // 1. 카카오 SDK로 로그인 (카카오톡 간편로그인 or 카카오계정 로그인)
      const result = await KakaoLogin.login();

      console.log("✅ 카카오 로그인 성공:", result);
      console.log("📍 액세스 토큰:", result.accessToken);

      // 2. 서버에 액세스 토큰 전달
      console.log("🚀 서버에 로그인 요청 중...");

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/kakao/mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          refreshTokenExpiresIn: result.refreshTokenExpiresIn,
        }),
      });

      console.log("📡 서버 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ 서버 응답 에러:", errorText);
        Alert.alert('로그인 실패', `서버 로그인 처리 중 오류: ${errorText}`);
        return;
      }

      const userData = await response.json();
      console.log("✅ 로그인 성공:", userData);

      // If backend indicates the user still needs to complete registration into `users` table,
      // show the CompleteSignup screen so we can collect required fields.
      if (userData.needsSignup) {
        // Always route Kakao users to the general signup flow so they go through
        // the same 'users' creation and linking step.
        setPendingSignupData(userData);
        setScreen("signup");
        return;
      }

      // 3. 기본 사용자 데이터 저장
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      // 4. 프로필 업데이트
      setUserProfile({
        name: userData.nickname || '카카오 사용자',
        status: '환영합니다!',
        avatarColor: '#F97316',
      });

      setScreen("app");
      setTab("friends");
      Alert.alert("로그인 성공", `${userData.nickname}님, 환영합니다! 🎉`);

    } catch (error) {
      console.error('❌ 카카오 로그인 에러:', error);

      // 키 해시 에러인 경우 자세한 정보 출력
      if (error.message && error.message.includes('keyHash')) {
        console.log("==================");
        console.log("키 해시 에러 발생!");
        console.log("Android Studio Logcat에서 키 해시를 확인하세요");
        console.log("또는 adb logcat | grep KeyHash 실행");
        console.log("==================");
      }

      if (error.code === 'E_CANCELLED_OPERATION') {
        Alert.alert('로그인 취소', '카카오 로그인이 취소되었습니다.');
      } else {
        Alert.alert('오류', `카카오 로그인 중 오류가 발생했습니다:\n${error.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }

    alert("로그인 실패: 테스트 계정을 이용해 주세요.");
  }

  async function handleLogout() {
    try {

      // 카카오 로그아웃 시도
      try {
        await KakaoLogin.logout();
        console.log("✅ 카카오 로그아웃 성공");
      } catch (kakaoError) {
        // 토큰 없으면 무시 (일반 로그인 사용자)
        console.log("ℹ️ 카카오 로그아웃 스킵:", kakaoError.message);
      }

      // 로컬 데이터 삭제
      await AsyncStorage.removeItem("userData");

      setScreen("landing");
      setUserProfile({
        name: "테스트 유저",
        status: "친절한 상담 AI 친구를 찾아보세요.",
        avatarColor: "#F97316",
      });

      Alert.alert("로그아웃", "로그아웃되었습니다.");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  }

  async function handleKakaoUnlink() {
  try {
      // 로컬 데이터 삭제
      await AsyncStorage.removeItem("userData");

      // 초기 상태로 복귀
      setScreen("landing");
      setUserProfile({
        name: "테스트 유저",
        status: "친절한 상담 AI 친구를 찾아보세요.",
        avatarColor: "#F97316",
      });

      console.log("✅ 카카오 언링크 후 로그아웃 완료");
    } catch (error) {
      console.error("❌ 언링크 후 로그아웃 실패:", error);
    }
  }

  // ... 나머지 함수들 (openFriendProfile, handleCall, sendMessage 등)은 기존과 동일



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

      function handleCall(friend) {
        Alert.alert("전화", `${friend.name}에게 전화 거는 중... (시뮬레이션)`);
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

      function ensureChatThread(friend) {
        setChats((prev) => {
          if (prev[friend.id]) return prev;
          const seed = INITIAL_CHATS[friend.id] ? [...INITIAL_CHATS[friend.id]] : [];
          return { ...prev, [friend.id]: seed };
        });
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

  function openUserProfileEditor() {
    setProfileFormName(userProfile.name);
    setProfileFormStatus(userProfile.status);
    setProfileFormAvatarColor(userProfile.avatarColor);
    setProfileEditVisible(true);
  }

  // =====================================================================
  // MAIN RENDER
  // =====================================================================

  if (screen === "landing") {
    return (
      <LandingScreen theme={theme} onLoginPress={() => setScreen("login")} />
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