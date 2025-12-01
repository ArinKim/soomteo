import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import LandingScreen from "../components/LandingScreen.js";
import LoginScreen from "./components/LoginScreen";
import SignupScreen from "./components/SignupScreen.js";
import FriendsListView from "../components/FriendsListView.js";
import SettingsView from "../components/SettingsView.js";
import ProfileModalView from "../components/ProfileModalView.js";
import ChatModalView from "../components/ChatModalView.js";
import FriendManagementModal from "../components/FriendManagementModal.js";
import FriendAddModal from "../components/FriendAddModal.js";
import ProfileEditModal from "../components/ProfileEditModal.js";
import ChatListView from "../components/ChatListView.js";
import { styles } from "../components/styles.js";
import { PERSONALITY_OPTIONS, AVATAR_COLORS } from "../components/constants.js";

const INITIAL_FRIENDS = [
  { id: "1", name: "Be:U", status: "디폴트 친구", avatarColor: "#4c5ff2ff" },
  {
    id: "2",
    name: "준호",
    status: "도움이 필요하면 말해요.",
    avatarColor: "#e8a6d0ff",
  },
  {
    id: "3",
    name: "수빈",
    status: "농담은 내가 최고!",
    avatarColor: "#34D399",
  },
  {
    id: "4",
    name: "민지",
    status: "오늘 기분은 괜찮아요.",
    avatarColor: "#F2C94C",
  },
];

const INITIAL_CHATS = {
  1: [
    {
      from: "friend",
      text: "오늘 하루 어땠어요?",
      ts: Date.now() - 400000,
    },
    {
      from: "me",
      text: "괜찮았어요. 잠깐 대화하러 왔어요!",
      ts: Date.now() - 380000,
    },
  ],
  2: [
    {
      from: "friend",
      text: "심호흡 같이 해볼까요?",
      ts: Date.now() - 200000,
    },
  ],
  3: [],
};

// API 설정 - 서버 포트에 맞춰 수정하세요
const API_BASE_URL = "http://10.0.2.2:8082";  // Android 에뮬레이터
// const API_BASE_URL = "http://localhost:8082";  // iOS 시뮬레이터
// const API_BASE_URL = "http://192.168.x.x:8082";  // 실제 기기 (컴퓨터 IP로 변경)

// 카카오 설정
const KAKAO_CLIENT_ID = "0359706448590fb07399b26bd5ceebe3";

// WebBrowser 완료 후 처리
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [tab, setTab] = useState("friends");
  const [theme, setTheme] = useState("ios");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [chatInput, setChatInput] = useState("");

  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendStatus, setNewFriendStatus] =
    useState("새로운 AI 친구입니다.");
  const [newFriendPersonality, setNewFriendPersonality] = useState(
    PERSONALITY_OPTIONS[0]
  );
  const [newFriendAvatarColor, setNewFriendAvatarColor] = useState(
    AVATAR_COLORS[0]
  );
  const [editingFriendId, setEditingFriendId] = useState(null);
  const [personalityDropdownOpen, setPersonalityDropdownOpen] = useState(false);
  const [friendFormTitle, setFriendFormTitle] = useState("친구 추가");

  const [userProfile, setUserProfile] = useState({
    name: "테스트 유저",
    status: "친절한 상담 AI 친구를 찾아보세요.",
    avatarColor: "#F97316",
  });
  const [profileFormName, setProfileFormName] = useState(userProfile.name);
  const [profileFormStatus, setProfileFormStatus] = useState(
    userProfile.status
  );
  const [profileFormAvatarColor, setProfileFormAvatarColor] = useState(
    userProfile.avatarColor
  );
  const [profileEditVisible, setProfileEditVisible] = useState(false);

  const [friendManagementVisible, setFriendManagementVisible] = useState(false);
  const [friendFormVisible, setFriendFormVisible] = useState(false);

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
          name: userData.nickname || "사용자",
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
    if (
      (identifier === "0000" || identifier === "0000@example.com") &&
      password === "0000"
    ) {
      setScreen("app");
      setTab("friends");
      return;
    }
    Alert.alert("로그인 실패", "테스트 계정을 이용해 주세요.");
  }

  // Kakao 로그인 - expo-auth-session 사용
  async function handleKakaoLogin() {
    if (isLoggingIn) return;
    
    try {
      setIsLoggingIn(true);
      
      // Redirect URI를 직접 지정
      const redirectUri = 'http://10.50.1.97:8082/callback';

      console.log("=== 카카오 로그인 시작 ===");
      console.log("📍 Redirect URI:", redirectUri);
      console.log("⚠️  이 URI를 카카오 개발자 콘솔에 등록해야 합니다!");

      // 카카오 인증 URL
      const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

      console.log("🔗 Auth URL:", authUrl);

      // 브라우저에서 카카오 로그인 진행
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      console.log("📱 브라우저 결과:", result);

      let code = null;
      if (result.type === 'success' && result.url) {
        // redirect URL에서 code 파라미터 추출
        const url = result.url;
        console.log("🔗 Redirect URL:", url);
        
        const match = url.match(/[?&]code=([^&]+)/);
        if (match && match[1]) {
          code = decodeURIComponent(match[1]);
        }
      }

      if (code) {
        console.log("✅ 인가 코드 받음:", code);

        // 서버에 code 전달하여 토큰 교환 및 로그인 처리
        console.log("🚀 서버에 로그인 요청 중...");
        console.log("📍 API URL:", `${API_BASE_URL}/api/v1/auth/kakao/mobile/code`);
        
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/kakao/mobile/code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code, 
            redirectUri  // 서버에서 같은 redirectUri로 토큰 교환
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

        // 사용자 데이터 저장
        await AsyncStorage.setItem("userData", JSON.stringify(userData));

        // 프로필 업데이트
        setUserProfile({
          name: userData.nickname || '카카오 사용자',
          status: '환영합니다!',
          avatarColor: '#F97316',
        });

        setScreen("app");
        setTab("friends");
        Alert.alert("로그인 성공", `${userData.nickname}님, 환영합니다! 🎉`);

      } else if (result.type === 'cancel') {
        console.log("⚠️  사용자가 로그인을 취소했습니다.");
        Alert.alert('로그인 취소', '카카오 로그인이 취소되었습니다.');
      } else {
        console.log("❌ 로그인 실패:", result);
        Alert.alert('로그인 실패', '카카오 로그인에 실패했습니다.');
      }

    } catch (error) {
      console.error('❌ 카카오 로그인 에러:', error);
      Alert.alert('오류', `카카오 로그인 중 오류가 발생했습니다:\n${error.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleSignupComplete(additionalInfo) {
    console.log("추가 정보:", additionalInfo);
    setScreen("app");
    setTab("friends");
  }

  async function handleLogout() {
    try {
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

  function openFriendProfile(friend) {
    setSelectedFriend(friend);
  }

  function closeProfile() {
    setSelectedFriend(null);
  }

  function handleCall(friend) {
    Alert.alert("전화", `${friend.name}에게 전화 거는 중... (시뮬레이션)`);
  }

  function ensureChatThread(friend) {
    setChats((prev) => {
      if (prev[friend.id]) return prev;
      const seed = INITIAL_CHATS[friend.id]
        ? [...INITIAL_CHATS[friend.id]]
        : [];
      return { ...prev, [friend.id]: seed };
    });
  }

  function openChatSession(friend) {
    ensureChatThread(friend);
    setActiveChatFriend(friend);
    setTab("chats");
  }

  function closeChatSession() {
    setActiveChatFriend(null);
    setChatInput("");
  }

  function handleStartChat(friend) {
    openChatSession(friend);
    setSelectedFriend(null);
  }

  function sendMessage(friendId, text) {
    const trimmed = text.trim();
    if (!friendId || !trimmed) return;
    setChats((prev) => {
      const updated = { ...(prev || {}) };
      updated[friendId] = [
        ...(updated[friendId] || []),
        { from: "me", text: trimmed, ts: Date.now() },
      ];
      return updated;
    });
    setChatInput("");

    const friend = friends.find((f) => f.id === friendId);
    if (friend) {
      setTimeout(() => {
        setChats((prev) => {
          const updated = { ...(prev || {}) };
          const reply = friend.status;
          updated[friendId] = [
            ...(updated[friendId] || []),
            { from: "friend", text: reply, ts: Date.now() },
          ];
          return updated;
        });
      }, 700);
    }
  }

  function resetFriendForm() {
    setNewFriendName("");
    setNewFriendStatus("새로운 AI 친구입니다.");
    setNewFriendPersonality(PERSONALITY_OPTIONS[0]);
    setNewFriendAvatarColor(AVATAR_COLORS[0]);
    setEditingFriendId(null);
    setPersonalityDropdownOpen(false);
  }

  function openFriendForm(friend = null, title = "친구 추가") {
    if (friend) {
      setEditingFriendId(friend.id);
      setNewFriendName(friend.name);
      setNewFriendStatus(friend.status);
      setNewFriendPersonality(friend.personality || PERSONALITY_OPTIONS[0]);
      setNewFriendAvatarColor(friend.avatarColor || AVATAR_COLORS[0]);
    } else {
      resetFriendForm();
    }
    setFriendFormTitle(title);
    setFriendFormVisible(true);
  }

  function handleSaveFriend() {
    const name = newFriendName.trim();
    if (!name) return Alert.alert("알림", "이름을 입력하세요.");
    if (editingFriendId) {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === editingFriendId
            ? {
                ...f,
                name,
                status: newFriendStatus.trim()
                  ? newFriendStatus
                  : "새로운 AI 친구입니다.",
                avatarColor: newFriendAvatarColor,
                personality: newFriendPersonality,
              }
            : f
        )
      );
    } else {
      const nf = {
        id: String(Date.now()),
        name,
        status: newFriendStatus.trim()
          ? newFriendStatus
          : "새로운 AI 친구입니다.",
        avatarColor: newFriendAvatarColor,
        personality: newFriendPersonality,
      };
      setFriends((prev) => [nf, ...prev]);
      setChats((prev) => ({ ...prev, [nf.id]: [] }));
    }
    setFriendFormVisible(false);
    resetFriendForm();
  }

  function handleDeleteFriendFromForm(id) {
    if (!id) return;
    setFriends((prev) => prev.filter((f) => f.id !== id));
    setChats((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    if (selectedFriend && selectedFriend.id === id) {
      setSelectedFriend(null);
    }
  }

  function togglePersonalityDropdown() {
    setPersonalityDropdownOpen((prev) => !prev);
  }

  function openUserProfileEditor() {
    setProfileFormName(userProfile.name);
    setProfileFormStatus(userProfile.status);
    setProfileFormAvatarColor(userProfile.avatarColor);
    setProfileEditVisible(true);
  }

  function handleSaveUserProfile() {
    setUserProfile({
      name: profileFormName,
      status: profileFormStatus,
      avatarColor: profileFormAvatarColor,
    });
    setProfileEditVisible(false);
  }

  if (screen === "landing") {
    return (
      <LandingScreen theme={theme} onLoginPress={() => setScreen("login")} />
    );
  }

  if (screen === "login") {
    return (
      <LoginScreen
        theme={theme}
        identifier={identifier}
        password={password}
        setIdentifier={setIdentifier}
        setPassword={setPassword}
        onLogin={handleLogin}
        onBack={() => setScreen("landing")}
        onKakaoLogin={handleKakaoLogin}
        isLoggingIn={isLoggingIn}
      />
    );
  }

  if (screen === "signup") {
    return (
      <SignupScreen
        userProfile={userProfile}
        onComplete={handleSignupComplete}
        onSkip={() => {
          setScreen("app");
          setTab("friends");
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, styles.appBg]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appHeader}>
        <Text style={styles.appHeaderTitle}>
          {tab === "friends" ? "친구" : tab === "chats" ? "채팅" : "설정"}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.smallBtn}>
          <Text>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {tab === "friends" && (
          <FriendsListView
            friends={friends}
            userProfile={userProfile}
            openProfile={openFriendProfile}
            openSelfEditor={openUserProfileEditor}
          />
        )}
        {tab === "chats" && (
          <ChatListView friends={friends} openChatSession={openChatSession} />
        )}
        {tab === "settings" && (
          <SettingsView
            theme={theme}
            setTheme={setTheme}
            onOpenFriendManagement={() => setFriendManagementVisible(true)}
            onOpenAccount={() => Alert.alert("알림", "계정 설정 화면은 준비 중입니다.")}
          />
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

      <ProfileModalView
        visible={!!selectedFriend}
        selectedFriend={selectedFriend}
        closeProfile={closeProfile}
        handleCall={handleCall}
        handleStartChat={handleStartChat}
      />

      <ChatModalView
        visible={!!activeChatFriend}
        activeChatFriend={activeChatFriend}
        chats={chats}
        closeChatSession={closeChatSession}
        chatInput={chatInput}
        setChatInput={setChatInput}
        sendMessage={sendMessage}
      />

      <FriendManagementModal
        visible={friendManagementVisible}
        friends={friends}
        onClose={() => setFriendManagementVisible(false)}
        onEditFriend={(friend) => {
          setFriendManagementVisible(false);
          openFriendForm(friend, "친구 정보 수정");
        }}
        deleteFriend={(id) => {
          handleDeleteFriendFromForm(id);
        }}
        onAddFriend={() => {
          setFriendManagementVisible(false);
          openFriendForm(null, "친구 추가");
        }}
        setPersonalityDropdownOpen={setPersonalityDropdownOpen}
      />

      <FriendAddModal
        visible={friendFormVisible}
        onClose={() => {
          setFriendFormVisible(false);
          setPersonalityDropdownOpen(false);
          resetFriendForm();
        }}
        newFriendName={newFriendName}
        setNewFriendName={setNewFriendName}
        newFriendStatus={newFriendStatus}
        setNewFriendStatus={setNewFriendStatus}
        newFriendAvatarColor={newFriendAvatarColor}
        setNewFriendAvatarColor={setNewFriendAvatarColor}
        newFriendPersonality={newFriendPersonality}
        setNewFriendPersonality={setNewFriendPersonality}
        personalityDropdownOpen={personalityDropdownOpen}
        togglePersonalityDropdown={togglePersonalityDropdown}
        handleSaveFriend={handleSaveFriend}
        setPersonalityDropdownOpen={setPersonalityDropdownOpen}
        editingFriendId={editingFriendId}
        onDeleteFriend={(id) => {
          handleDeleteFriendFromForm(id);
          setFriendFormVisible(false);
          resetFriendForm();
        }}
        headerTitle={friendFormTitle}
      />

      <ProfileEditModal
        visible={profileEditVisible}
        onClose={() => setProfileEditVisible(false)}
        name={profileFormName}
        status={profileFormStatus}
        avatarColor={profileFormAvatarColor}
        setName={setProfileFormName}
        setStatus={setProfileFormStatus}
        setAvatarColor={setProfileFormAvatarColor}
        onSave={handleSaveUserProfile}
      />
    </SafeAreaView>
  );
}