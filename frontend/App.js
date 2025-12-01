import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
// The Kakao package exports named functions (login, logout, etc.)
// Use namespace import so we can call KakaoLogin.login() and friends.
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import AsyncStorage from "@react-native-async-storage/async-storage";
import CompleteSignupScreen from "./components/CompleteSignupScreen";
import SignupScreen from "./components/SignupScreen";
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
import FriendManagementModal from "./components/FriendManagementModal";
import FriendAddModal from "./components/FriendAddModal";
import ProfileEditModal from "./components/ProfileEditModal";
import ChatListView from "./components/ChatListView";
import { styles } from "./components/styles";
import { PERSONALITY_OPTIONS, AVATAR_COLORS } from "./components/constants";

const INITIAL_FRIENDS = [
  { id: "1", name: "Be:U", status: "디폴트 친구", avatarColor: "#4c5ff2ff" },
  { id: "2", name: "준호", status: "도움이 필요하면 말해요.", avatarColor: "#e8a6d0ff" },
  { id: "3", name: "수빈", status: "농담은 내가 최고!", avatarColor: "#34D399" },
  { id: "4", name: "민지", status: "오늘 기분은 괜찮아요.", avatarColor: "#F2C94C" },
];

const INITIAL_CHATS = {
  1: [
    { from: "friend", text: "오늘 하루 어땠어요?", ts: Date.now() - 400000 },
    { from: "me", text: "괜찮았어요. 잠깐 대화하러 왔어요!", ts: Date.now() - 380000 },
  ],
  2: [{ from: "friend", text: "심호흡 같이 해볼까요?", ts: Date.now() - 200000 }],
  3: [],
};

// API 설정
// const API_BASE_URL = "http://10.50.1.97:8082";
const API_BASE_URL = "http://10.0.2.2:8080";

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
  const [newFriendStatus, setNewFriendStatus] = useState("새로운 AI 친구입니다.");
  const [newFriendPersonality, setNewFriendPersonality] = useState(PERSONALITY_OPTIONS[0]);
  const [newFriendAvatarColor, setNewFriendAvatarColor] = useState(AVATAR_COLORS[0]);
  const [editingFriendId, setEditingFriendId] = useState(null);
  const [personalityDropdownOpen, setPersonalityDropdownOpen] = useState(false);
  const [friendFormTitle, setFriendFormTitle] = useState("친구 추가");

  const [userProfile, setUserProfile] = useState({
    name: "테스트 유저",
    status: "친절한 상담 AI 친구를 찾아보세요.",
    avatarColor: "#F97316",
  });
  const [profileFormName, setProfileFormName] = useState(userProfile.name);
  const [profileFormStatus, setProfileFormStatus] = useState(userProfile.status);
  const [profileFormAvatarColor, setProfileFormAvatarColor] = useState(userProfile.avatarColor);
  const [profileEditVisible, setProfileEditVisible] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState(null);
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
      const seed = INITIAL_CHATS[friend.id] ? [...INITIAL_CHATS[friend.id]] : [];
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
      updated[friendId] = [...(updated[friendId] || []), { from: "me", text: trimmed, ts: Date.now() }];
      return updated;
    });
    setChatInput("");

    const friend = friends.find((f) => f.id === friendId);
    if (friend) {
      setTimeout(() => {
        setChats((prev) => {
          const updated = { ...(prev || {}) };
          const reply = friend.status;
          updated[friendId] = [...(updated[friendId] || []), { from: "friend", text: reply, ts: Date.now() }];
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
                status: newFriendStatus.trim() ? newFriendStatus : "새로운 AI 친구입니다.",
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
        status: newFriendStatus.trim() ? newFriendStatus : "새로운 AI 친구입니다.",
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
    return <LandingScreen theme={theme} onLoginPress={() => setScreen("login")} />;
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
        onSignUp={() => setScreen('signup')}
        isLoggingIn={isLoggingIn}
      />
    );
  }

  if (screen === "completeSignup") {
    return (
      <CompleteSignupScreen
        initial={{
          nickname: pendingSignupData?.nickname,
          email: pendingSignupData?.email || '',
          profileImage: pendingSignupData?.profileImage,
          userDetailId: pendingSignupData?.userDetailId,
        }}
        onCancel={() => {
          // allow user to skip completion — go back to login
          setPendingSignupData(null);
          setScreen('login');
        }}
        onComplete={async (payload) => {
          try {
            const resp = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (!resp.ok) {
              const text = await resp.text();
              Alert.alert('회원가입 실패', text || '서버 오류');
              return;
            }

            const member = await resp.json();

            // Save member returned by server and continue
            await AsyncStorage.setItem('userData', JSON.stringify(member));
            setUserProfile({ name: member.name || payload.name, status: '환영합니다!', avatarColor: '#F97316' });
            setPendingSignupData(null);
            setScreen('app');
            setTab('friends');
            Alert.alert('회원가입 완료', `${payload.name}님, 환영합니다! 🎉`);
          } catch (err) {
            console.error('signup error', err);
            Alert.alert('회원가입 실패', err.message || String(err));
          }
        }}
      />
    );
  }

  if (screen === "signup") {
    return (
      <SignupScreen
        initial={{
          email: pendingSignupData?.email || '',
          name: pendingSignupData?.nickname || '',
          userDetailId: pendingSignupData?.userDetailId || pendingSignupData?.userId || null,
          kakaoId: pendingSignupData?.kakaoId || null,
          profileImageUrl: pendingSignupData?.profileImage || pendingSignupData?.profileImageUrl || null,
        }}
        userProfile={{ name: '', status: '' }}
        onComplete={async (payload) => {
          try {
            // Normal signup (if pendingSignupData exists, the payload may include userDetailId)
            const resp = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (!resp.ok) {
              const text = await resp.text();
              Alert.alert('회원가입 실패', text || '서버 오류');
              return;
            }

            const member = await resp.json();

            const userData = {
              memberId: member.id,
              nickname: member.name || payload.name,
              email: member.email,
            };

            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUserProfile({ name: payload.name, status: '환영합니다!', avatarColor: '#F97316' });
            setScreen('app');
            setTab('friends');

            Alert.alert('회원가입 완료', `${payload.name}님, 계정이 생성되었습니다! 🎉`);
          } catch (err) {
            console.error('signup error', err);
            Alert.alert('회원가입 실패', err.message || String(err));
          }
        }}
        onSkip={() => setScreen('login')}
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
        {tab === "chats" && <ChatListView friends={friends} openChatSession={openChatSession} />}
        {tab === "settings" && (
          <SettingsView
            theme={theme}
            setTheme={setTheme}
            onOpenFriendManagement={() => setFriendManagementVisible(true)}
            onOpenAccount={() => Alert.alert("알림", "계정 설정 화면은 준비 중입니다.")}
            onKakaoUnlink={handleKakaoUnlink}  // 추가!
          />
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab("friends")}>
          <Text style={tab === "friends" ? styles.tabActive : undefined}>친구</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab("chats")}>
          <Text style={tab === "chats" ? styles.tabActive : undefined}>채팅</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab("settings")}>
          <Text style={tab === "settings" ? styles.tabActive : undefined}>설정</Text>
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
        deleteFriend={(id) => handleDeleteFriendFromForm(id)}
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