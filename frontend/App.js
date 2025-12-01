import { TextEncoder, TextDecoder } from "text-encoding";

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Components
import CompleteSignupScreen from "./components/CompleteSignupScreen";
import SignupScreen from "./components/SignupScreen";
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
import { API_BASE_URL, PERSONALITY_OPTIONS, AVATAR_COLORS } from "./components/constants";

export default function App() {
  // 화면 관리
  const [screen, setScreen] = useState("landing");
  const [tab, setTab] = useState("friends");
  const [theme, setTheme] = useState("ios");

  // 로그인 관련
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [userId, setUserId] = useState(null);

  // ⭐ DB에서 불러오는 친구 & 채팅 (초기값 빈 배열)
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeChatFriend, setActiveChatFriend] = useState(null);

  // 친구 추가/수정 관련
  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendStatus, setNewFriendStatus] = useState("새로운 AI 친구입니다.");
  const [newFriendPersonality, setNewFriendPersonality] = useState(PERSONALITY_OPTIONS[0]);
  const [newFriendAvatarColor, setNewFriendAvatarColor] = useState(AVATAR_COLORS[0]);
  const [editingFriendId, setEditingFriendId] = useState(null);
  const [personalityDropdownOpen, setPersonalityDropdownOpen] = useState(false);
  const [friendFormTitle, setFriendFormTitle] = useState("친구 추가");

  // 사용자 프로필
  const [userProfile, setUserProfile] = useState({
    name: "",
    status: "",
    avatarColor: "#F97316",
  });
  const [profileFormName, setProfileFormName] = useState("");
  const [profileFormStatus, setProfileFormStatus] = useState("");
  const [profileFormAvatarColor, setProfileFormAvatarColor] = useState("#F97316");

  // 모달 관리
  const [profileEditVisible, setProfileEditVisible] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState(null);
  const [friendManagementVisible, setFriendManagementVisible] = useState(false);
  const [friendFormVisible, setFriendFormVisible] = useState(false);

  // =====================================================================
  // 앱 시작 시 자동 로그인 확인
  // =====================================================================
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
        setUserId(userData.id || userData.memberId);
        setScreen("app");
        setTab("friends");
        console.log("✅ 자동 로그인 성공:", userData.nickname);
        
        // ⭐ DB에서 친구 목록 로드
        if (userData.id || userData.memberId) {
          await loadFriends(userData.id || userData.memberId);
        }
      }
    } catch (error) {
      console.error("❌ 자동 로그인 실패:", error);
    }
  }

  // =====================================================================
  // 일반 로그인
  // =====================================================================
function handleLogin() {
  if (!identifier || !password) {
    return Alert.alert('로그인 실패', '이메일과 비밀번호를 입력하세요');
  }

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
      
      // ⭐ 응답 확인
      console.log("🔍 로그인 응답 member:", JSON.stringify(member, null, 2));
      
      const extractedUserId = member.id || member.memberId || member.userId;
      console.log("🆔 추출된 userId:", extractedUserId);
      
      if (!extractedUserId) {
        console.error("❌ userId를 찾을 수 없습니다!");
        Alert.alert('오류', 'userId를 받아올 수 없습니다.');
        return;
      }
      
      await AsyncStorage.setItem('userData', JSON.stringify(member));
      setUserProfile({ name: member.name || '사용자', status: '환영합니다!', avatarColor: '#F97316' });
      setUserId(extractedUserId); // ⭐
      setScreen('app');
      setTab('friends');
      
      await loadFriends(extractedUserId); // ⭐
    } catch (err) {
      console.error('login error', err);
      Alert.alert('로그인 실패', err.message || String(err));
    } finally {
      setIsLoggingIn(false);
    }
  })();
}

  // =====================================================================
  // 카카오 로그인
  // =====================================================================
async function handleKakaoLogin() {
  if (isLoggingIn) return;
  
  try {
    setIsLoggingIn(true);
    console.log("=== 카카오 SDK 로그인 시작 ===");

    const result = await KakaoLogin.login();
    console.log("✅ 카카오 로그인 성공:", result);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/kakao/mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        refreshTokenExpiresIn: result.refreshTokenExpiresIn,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      Alert.alert('로그인 실패', `서버 로그인 처리 중 오류: ${errorText}`);
      return;
    }

    const userData = await response.json();
    
    // ⭐⭐⭐ 여기서 백엔드 응답 확인!
    console.log("🔍 백엔드 응답 userData:", JSON.stringify(userData, null, 2));

    if (userData.needsSignup) {
      setPendingSignupData(userData);
      setScreen("signup");
      return;
    }

    await AsyncStorage.setItem("userData", JSON.stringify(userData));

    // ⭐⭐⭐ userId 추출 로직 강화
    const extractedUserId = userData.id || userData.memberId || userData.userId || userData.user_id;
    console.log("🆔 추출된 userId:", extractedUserId);
    
    if (!extractedUserId) {
      console.error("❌ userId를 찾을 수 없습니다! userData:", userData);
      Alert.alert('오류', 'userId를 받아올 수 없습니다.');
      return;
    }

    setUserProfile({
      name: userData.nickname || userData.name || '카카오 사용자',
      status: '환영합니다!',
      avatarColor: '#F97316',
    });
    setUserId(extractedUserId); // ⭐ 추출한 ID 설정

    setScreen("app");
    setTab("friends");
    
    // ⭐⭐⭐ loadFriends 호출 전에 userId 확인
    console.log("🚀 loadFriends 호출 전 userId:", extractedUserId);
    await loadFriends(extractedUserId);
    
    Alert.alert("로그인 성공", `${userData.nickname}님, 환영합니다! 🎉`);

  } catch (error) {
    console.error('❌ 카카오 로그인 에러:', error);
    
    if (error.code === 'E_CANCELLED_OPERATION') {
      Alert.alert('로그인 취소', '카카오 로그인이 취소되었습니다.');
    } else {
      Alert.alert('오류', `카카오 로그인 중 오류가 발생했습니다:\n${error.message}`);
    }
  } finally {
    setIsLoggingIn(false);
  }
}

  // =====================================================================
  // 로그아웃
  // =====================================================================
  async function handleLogout() {
    try {
      // 카카오 로그아웃 시도
      try {
        await KakaoLogin.logout();
        console.log("✅ 카카오 로그아웃 성공");
      } catch (kakaoError) {
        console.log("ℹ️ 카카오 로그아웃 스킵:", kakaoError.message);
      }

      await AsyncStorage.removeItem("userData");
      
      setUserId(null);
      setScreen("landing");
      setFriends([]); // ⭐ 친구 목록 초기화
      setUserProfile({
        name: "",
        status: "",
        avatarColor: "#F97316",
      });
      
      Alert.alert("로그아웃", "로그아웃되었습니다.");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  }

  async function handleKakaoUnlink() {
    try {
      await AsyncStorage.removeItem("userData");
      
      setUserId(null);
      setScreen("landing");
      setFriends([]); // ⭐ 친구 목록 초기화
      setUserProfile({
        name: "",
        status: "",
        avatarColor: "#F97316",
      });
      
      console.log("✅ 카카오 언링크 후 로그아웃 완료");
    } catch (error) {
      console.error("❌ 언링크 후 로그아웃 실패:", error);
    }
  }

  // =====================================================================
  // ⭐ DB에서 친구 목록 불러오기
  // =====================================================================
  async function loadFriends(uid) {
    try {
      const url = `${API_BASE_URL}/api/friends/${uid}`;
      console.log("[loadFriends] GET", url);

      const res = await fetch(url);
      
      if (!res.ok) {
        console.warn("[loadFriends] HTTP error:", res.status);
        setFriends([]);
        return;
      }

      const rawText = await res.text();
      console.log("[loadFriends] raw response:", res.status, rawText);

      let data;
      try {
        data = rawText ? JSON.parse(rawText) : [];
      } catch (parseErr) {
        console.warn("[loadFriends] JSON parse error:", parseErr);
        setFriends([]);
        return;
      }

      console.log("[loadFriends] parsed data:", data);

      // 백엔드가 배열이 아닌 형태로 줄 수도 있으니 방어
      let list = data;
      if (!Array.isArray(list) && Array.isArray(data.friends)) {
        list = data.friends;
      }

      if (!Array.isArray(list)) {
        console.warn("[loadFriends] not an array. data =", data);
        setFriends([]);
        return;
      }

      // 배열 매핑
      const mapped = list.map((f) => ({
        id: String(f.id),
        name: f.name,
        status: f.status_message || f.statusMessage || f.status || "",
        avatarColor: f.avatarColor || "#A5B4FC",
        personality: f.personality || PERSONALITY_OPTIONS[0],
      }));

      console.log("[loadFriends] mapped friends:", mapped);
      setFriends(mapped);
    } catch (e) {
      console.warn("loadFriends error:", e);
      setFriends([]);
    }
  }

  // =====================================================================
  // 친구 프로필 열기/닫기
  // =====================================================================
  function openFriendProfile(friend) {
    setSelectedFriend(friend);
  }

  function closeProfile() {
    setSelectedFriend(null);
  }

  function handleCall(friend) {
    Alert.alert("전화", `${friend.name}에게 전화 거는 중... (시뮬레이션)`);
  }

  // =====================================================================
  // 채팅방 열기/닫기
  // =====================================================================
  function openChatSession(friend) {
    setActiveChatFriend(friend);
    setTab("chats");
  }

  function closeChatSession() {
    setActiveChatFriend(null);
  }

  function handleStartChat(friend) {
    openChatSession(friend);
    setSelectedFriend(null);
  }

  // =====================================================================
  // 친구 관리 (로컬 추가/수정/삭제 - DB 연동은 별도 구현 필요)
  // =====================================================================
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
      // 친구 수정 (DB 업데이트 필요)
      setFriends((prev) =>
        prev.map((f) =>
          f.id === editingFriendId
            ? {
                ...f,
                name,
                status: newFriendStatus.trim() || "새로운 AI 친구입니다.",
                avatarColor: newFriendAvatarColor,
                personality: newFriendPersonality,
              }
            : f
        )
      );
    } else {
      // 친구 추가 (DB 저장 필요)
      const nf = {
        id: String(Date.now()),
        name,
        status: newFriendStatus.trim() || "새로운 AI 친구입니다.",
        avatarColor: newFriendAvatarColor,
        personality: newFriendPersonality,
      };
      setFriends((prev) => [nf, ...prev]);
    }
    
    setFriendFormVisible(false);
    resetFriendForm();
  }

  function handleDeleteFriendFromForm(id) {
    if (!id) return;
    
    // DB에서 삭제 필요
    setFriends((prev) => prev.filter((f) => f.id !== id));
    
    if (selectedFriend && selectedFriend.id === id) {
      setSelectedFriend(null);
    }
  }

  function togglePersonalityDropdown() {
    setPersonalityDropdownOpen((prev) => !prev);
  }

  // =====================================================================
  // 사용자 프로필 편집
  // =====================================================================
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

  // =====================================================================
  // MAIN RENDER
  // =====================================================================
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

            await AsyncStorage.setItem('userData', JSON.stringify(member));
            setUserProfile({ name: member.name || payload.name, status: '환영합니다!', avatarColor: '#F97316' });
            setUserId(member.id);
            setPendingSignupData(null);
            setScreen('app');
            setTab('friends');
            
            // ⭐ DB에서 친구 목록 로드
            await loadFriends(member.id);
            
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
            setUserId(member.id);
            setScreen('app');
            setTab('friends');
            
            // ⭐ DB에서 친구 목록 로드
            await loadFriends(member.id);

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
        
        {tab === "chats" && (
          <ChatListView 
            friends={friends} 
            openChatSession={openChatSession} 
          />
        )}
        
        {tab === "settings" && (
          <SettingsView
            theme={theme}
            setTheme={setTheme}
            onOpenFriendManagement={() => setFriendManagementVisible(true)}
            onOpenAccount={() => Alert.alert("알림", "계정 설정 화면은 준비 중입니다.")}
            onKakaoUnlink={handleKakaoUnlink}
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
        closeChatSession={closeChatSession}
        userId={userId}
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