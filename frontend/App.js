import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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
import CallingScreen from "./components/CallingScreen";
import TTSScreen from "./components/TTSScreen";
import { styles } from "./components/styles";
import { PERSONALITY_OPTIONS, AVATAR_COLORS } from "./components/constants";
import * as FileSystem from "expo-file-system";

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

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [tab, setTab] = useState("friends");
  const [theme, setTheme] = useState("ios");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [callingFriend, setCallingFriend] = useState(null);
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
  const [newFriendImageUri, setNewFriendImageUri] = useState(null);
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
  const [profileFormImageUri, setProfileFormImageUri] = useState(null);
  const [profileEditVisible, setProfileEditVisible] = useState(false);

  const [friendManagementVisible, setFriendManagementVisible] = useState(false);
  const [friendFormVisible, setFriendFormVisible] = useState(false);

  const API_BASE =
    Platform.OS === "android"
      ? "http://10.0.2.2:3001"
      : "http://localhost:3001";
  const USER_ID = 1; // TODO: 실제 로그인 사용자 ID로 대체

  function handleLogin() {
    if (
      (identifier === "0000" || identifier === "0000@example.com") &&
      password === "0000"
    ) {
      setScreen("app");
      setTab("friends");
      return;
    }
    alert("로그인 실패: 테스트 계정을 이용해 주세요.");
  }

  function openFriendProfile(friend) {
    setSelectedFriend(friend);
  }

  function closeProfile() {
    setSelectedFriend(null);
  }

  function handleCall(friend) {
    setCallingFriend(friend);
    setSelectedFriend(null);
  }

  function handleEndCall() {
    setCallingFriend(null);
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

  async function pickFriendImage() {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("사진 라이브러리 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewFriendImageUri(result.assets[0].uri);
    }
  }

  async function pickProfileImage() {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("사진 라이브러리 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileFormImageUri(result.assets[0].uri);
    }
  }

  function resetFriendForm() {
    setNewFriendName("");
    setNewFriendStatus("새로운 AI 친구입니다.");
    setNewFriendPersonality(PERSONALITY_OPTIONS[0]);
    setNewFriendAvatarColor(AVATAR_COLORS[0]);
    setNewFriendImageUri(null);
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
      setNewFriendImageUri(friend.imageUri || null);
    } else {
      resetFriendForm();
    }
    setFriendFormTitle(title);
    setFriendFormVisible(true);
  }

  function handleSaveFriend() {
    const name = newFriendName.trim();
    if (!name) return alert("이름을 입력하세요.");
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
                imageUri: newFriendImageUri || f.imageUri,
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
        imageUri: newFriendImageUri,
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
    setProfileFormImageUri(userProfile.imageUri || null);
    setProfileEditVisible(true);
  }

  async function uploadProfileImageIfNeeded() {
    try {
      if (!profileFormImageUri) return;
      const base64 = await FileSystem.readAsStringAsync(profileFormImageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await fetch(`${API_BASE}/api/user/profile-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          imageBase64: base64,
          mimeType: "image/jpeg",
        }),
      });
    } catch (e) {
      console.warn("프로필 이미지 업로드 실패", e);
    }
  }

  async function handleSaveUserProfile() {
    setUserProfile({
      name: profileFormName,
      status: profileFormStatus,
      avatarColor: profileFormAvatarColor,
      imageUri: profileFormImageUri || userProfile.imageUri,
    });
    await uploadProfileImageIfNeeded();
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
      />
    );
  }

  // 통화 화면 렌더링
  if (callingFriend) {
    return <CallingScreen friend={callingFriend} onEndCall={handleEndCall} />;
  }

  return (
    <SafeAreaView style={[styles.container, styles.appBg]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appHeader}>
        <Text style={styles.appHeaderTitle}>
          {tab === "friends"
            ? "친구"
            : tab === "chats"
            ? "채팅"
            : tab === "settings"
            ? "설정"
            : tab === "tts"
            ? "TTS"
            : ""}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setScreen("landing");
          }}
          style={styles.smallBtn}
        >
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
            onOpenAccount={() => alert("계정 설정 화면은 준비 중입니다.")}
          />
        )}
        {tab === "tts" && <TTSScreen activeFriend={selectedFriend} />}
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
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab("tts")}>
          <Text style={tab === "tts" ? styles.tabActive : undefined}>TTS</Text>
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
        imageUri={newFriendImageUri}
        onPickImage={pickFriendImage}
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
        imageUri={profileFormImageUri}
        onPickImage={pickProfileImage}
      />
    </SafeAreaView>
  );
}
