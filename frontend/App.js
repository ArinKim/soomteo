import { TextEncoder, TextDecoder } from "text-encoding";
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

import React, { useState } from "react";
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
import CallingScreen from "./components/CallingScreen";

import { styles } from "./components/styles";
import { API_BASE_URL, AVATAR_COLORS } from "./components/constants";

// 성별 / 타입 옵션
const GENDER_OPTIONS = [
  { code: "FEMALE", label: "여" },
  { code: "MALE", label: "남" },
];

const TYPE_OPTIONS = ["친구", "부모님", "자식", "친척"];

// character_type 테이블(8개 더미 데이터)에 맞춰 하드코딩한 매핑
//   1: ('친구','FEMALE')
//   2: ('친구','MALE')
//   3: ('부모님','FEMALE')
//   4: ('부모님','MALE')
//   5: ('자식','FEMALE')
//   6: ('자식','MALE')
//   7: ('친척','FEMALE')
//   8: ('친척','MALE')
const CHARACTER_TYPE_MAP = {
  FEMALE: { 친구: 1, 부모님: 3, 자식: 5, 친척: 7 },
  MALE: { 친구: 2, 부모님: 4, 자식: 6, 친척: 8 },
};

function resolveCharacterTypeId(typeLabel, genderCode) {
  const gMap = CHARACTER_TYPE_MAP[genderCode || "FEMALE"] || {};
  return gMap[typeLabel] || 1; // fallback
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [tab, setTab] = useState("friends");
  const [theme, setTheme] = useState("ios");

  // 로그인 정보
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState(null); // 실제 DB users.id

  // 서버에서 가져온 친구 목록
  const [friends, setFriends] = useState([]);

  // 채팅 중인 친구
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [callingFriend, setCallingFriend] = useState(null);

  // 프로필 / 모달 관련
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

  // 친구 추가/수정 모달용 상태
  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendGender, setNewFriendGender] = useState("FEMALE"); // 'FEMALE' or 'MALE'
  const [newFriendType, setNewFriendType] = useState("친구");
  const [newFriendProfileImageUrl, setNewFriendProfileImageUrl] = useState("");
  const [newFriendStatus, setNewFriendStatus] = useState("");
  const [newFriendPrompt, setNewFriendPrompt] = useState("");
  const [newFriendAvatarColor, setNewFriendAvatarColor] = useState(
    AVATAR_COLORS[0]
  );

  // 안부 메시지 스케줄
  const [newFriendStartDate, setNewFriendStartDate] = useState(""); // "2025-12-01"
  const [newFriendEndDate, setNewFriendEndDate] = useState(""); // "2025-12-13"
  const [newFriendStartTime, setNewFriendStartTime] = useState(""); // "07:00:00"
  const [newFriendEndTime, setNewFriendEndTime] = useState(""); // "21:00:00"
  const [newFriendCount, setNewFriendCount] = useState("3"); // 문자열로 입력받고 숫자로 변환

  const [editingFriendId, setEditingFriendId] = useState(null);
  const [friendFormTitle, setFriendFormTitle] = useState("친구 추가");

  // =====================================================================
  // 1) 로그인 → 토큰 없이 userId만 사용
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
  //
  //     setUserId(data.userId);
  //     setUserProfile({
  //       name: data.name,
  //       status: data.status_message ?? "",
  //       avatarColor: "#F97316",
  //     });
  //
  //     setScreen("app");
  //     setTab("friends");
  //     loadFriends(data.userId);
  //   } catch (e) {
  //     console.warn("login error:", e);
  //     alert("로그인 중 오류가 발생했습니다.");
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
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => "<no body>");
        console.warn("loadFriends failed", {
          status: res.status,
          url,
          body: text,
        });
        alert(`친구 목록을 불러오지 못했습니다 (status: ${res.status}).`);
        return;
      }
      let data;
      try {
        data = await res.json();
      } catch (e) {
        const text = await res.text().catch(() => "<no body>");
        console.warn("loadFriends: JSON 파싱 실패", {
          url,
          body: text,
          error: e,
        });
        alert("친구 목록 응답 파싱에 실패했습니다.");
        return;
      }

      // FriendDto 가 아래 필드를 내려준다고 가정:
      // { id, name, statusMessage, profileImageUrl, characterTypeId,
      //   gender, typeLabel, prompt, startDate, endDate, startTime, endTime, count }
      const mapped = data.map((f) => ({
        id: f.id,
        name: f.name,
        status: f.statusMessage || "",
        avatarColor: "#A5B4FC",
        characterTypeId: f.characterTypeId,
        gender: f.gender || "FEMALE",
        typeLabel: f.typeLabel || "친구",
        profileImageUrl: f.profileImageUrl || "",
        prompt: f.prompt || "",
        startDate: f.startDate || "",
        endDate: f.endDate || "",
        startTime: f.startTime || "",
        endTime: f.endTime || "",
        count:
          typeof f.count === "number" || typeof f.count === "string"
            ? String(f.count)
            : "3",
      }));

      setFriends(mapped);
    } catch (e) {
      console.warn("loadFriends error:", e);
      alert(
        "친구 목록을 불러오는 중 오류가 발생했습니다. 서버 주소(API_BASE_URL)와 네트워크를 확인하세요."
      );
    }
  }

  // =====================================================================
  // 3) 채팅방 열기 / 닫기
  // =====================================================================
  function openChatSession(friend) {
    setActiveChatFriend(friend);
    setTab("chats");
  }

  function closeChatSession() {
    setActiveChatFriend(null);
  }

  // =====================================================================
  // 4) 친구 프로필 열기 / 닫기
  // =====================================================================
  function openFriendProfile(friend) {
    setSelectedFriend(friend);
  }

  function closeProfile() {
    setSelectedFriend(null);
  }

  // 통화 시작/종료
  function handleCall(friend) {
    setCallingFriend(friend);
    // 프로필 모달 닫기
    setSelectedFriend(null);
  }

  function handleEndCall() {
    setCallingFriend(null);
  }

  // =====================================================================
  // 5) 로그아웃
  // =====================================================================
  function handleLogout() {
    setScreen("landing");
    setUserId(null);
    setFriends([]);
    setActiveChatFriend(null);
    setSelectedFriend(null);
    setFriendManagementVisible(false);
    setFriendFormVisible(false);
  }

  // =====================================================================
  // 6) 친구 추가/수정 폼 관련
  // =====================================================================
  function resetFriendForm() {
    setNewFriendName("");
    setNewFriendGender("FEMALE");
    setNewFriendType("친구");
    setNewFriendProfileImageUrl("");
    setNewFriendStatus("");
    setNewFriendPrompt("");
    setNewFriendAvatarColor(AVATAR_COLORS[0]);
    setNewFriendStartDate("");
    setNewFriendEndDate("");
    setNewFriendStartTime("");
    setNewFriendEndTime("");
    setNewFriendCount("3");
    setEditingFriendId(null);
  }

  function openFriendForm(friend = null, title = "친구 추가") {
    if (friend) {
      setEditingFriendId(friend.id);
      setNewFriendName(friend.name);
      setNewFriendGender(friend.gender || "FEMALE");
      setNewFriendType(friend.typeLabel || "친구");
      setNewFriendProfileImageUrl(friend.profileImageUrl || "");
      setNewFriendStatus(friend.status || "");
      setNewFriendPrompt(friend.prompt || "");
      setNewFriendAvatarColor(friend.avatarColor || AVATAR_COLORS[0]);
      setNewFriendStartDate(friend.startDate || "");
      setNewFriendEndDate(friend.endDate || "");
      setNewFriendStartTime(friend.startTime || "");
      setNewFriendEndTime(friend.endTime || "");
      setNewFriendCount(friend.count || "3");
    } else {
      resetFriendForm();
    }
    setFriendFormTitle(title);
    setFriendFormVisible(true);
  }

  // 친구 저장 (추가 / 수정)
  async function handleSaveFriend() {
    const name = newFriendName.trim();
    if (!name) {
      alert("이름을 입력하세요.");
      return;
    }
    if (!userId) {
      alert("로그인 정보가 없습니다.");
      return;
    }

    const characterTypeId = resolveCharacterTypeId(
      newFriendType,
      newFriendGender
    );

    const parsedCount = parseInt(newFriendCount, 10);
    const countValue = Number.isNaN(parsedCount) ? null : parsedCount;

    const payload = {
      name: name,
      statusMessage: newFriendStatus.trim(),
      profileImageUrl: newFriendProfileImageUrl || null,
      characterTypeId,
      prompt: newFriendPrompt, // 프롬프트(성격 설명 등)
      startDate: newFriendStartDate || null, // "YYYY-MM-DD"
      endDate: newFriendEndDate || null,
      startTime: newFriendStartTime || null, // "HH:mm:ss"
      endTime: newFriendEndTime || null,
      count: countValue,
      gender: newFriendGender, // (선택) 백엔드에서 사용하려면 FriendDto에 추가
      typeLabel: newFriendType, // (선택)
    };

    try {
      if (editingFriendId) {
        // 수정
        const res = await fetch(
          `${API_BASE_URL}/api/friends/${editingFriendId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) {
          alert("친구 수정에 실패했습니다.");
          return;
        }

        const updated = await res.json();

        setFriends((prev) =>
          prev.map((f) =>
            f.id === updated.id
              ? {
                  ...f,
                  name: updated.name,
                  status: updated.statusMessage || "",
                  avatarColor: newFriendAvatarColor,
                  characterTypeId: updated.characterTypeId,
                  prompt: updated.prompt,
                  gender: updated.gender || newFriendGender,
                  typeLabel: updated.typeLabel || newFriendType,
                  profileImageUrl: updated.profileImageUrl || "",
                  startDate: updated.startDate || "",
                  endDate: updated.endDate || "",
                  startTime: updated.startTime || "",
                  endTime: updated.endTime || "",
                  count:
                    typeof updated.count === "number" ||
                    typeof updated.count === "string"
                      ? String(updated.count)
                      : "3",
                }
              : f
          )
        );
      } else {
        // 추가
        const res = await fetch(`${API_BASE_URL}/api/friends/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          alert("친구 추가에 실패했습니다.");
          return;
        }

        const created = await res.json();

        const uiFriend = {
          id: created.id,
          name: created.name,
          status: created.statusMessage || "",
          avatarColor: newFriendAvatarColor,
          characterTypeId: created.characterTypeId,
          prompt: created.prompt,
          gender: created.gender || newFriendGender,
          typeLabel: created.typeLabel || newFriendType,
          profileImageUrl: created.profileImageUrl || "",
          startDate: created.startDate || "",
          endDate: created.endDate || "",
          startTime: created.startTime || "",
          endTime: created.endTime || "",
          count:
            typeof created.count === "number" ||
            typeof created.count === "string"
              ? String(created.count)
              : "3",
        };

        setFriends((prev) => [...prev, uiFriend]);
      }

      setFriendFormVisible(false);
      resetFriendForm();
    } catch (e) {
      console.warn("handleSaveFriend error:", e);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  }

  // 친구 삭제
  async function handleDeleteFriendFromForm(id) {
    if (!id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("친구 삭제에 실패했습니다.");
        return;
      }

      setFriends((prev) => prev.filter((f) => f.id !== id));

      if (selectedFriend && selectedFriend.id === id) {
        setSelectedFriend(null);
      }
    } catch (e) {
      console.warn("deleteFriend error:", e);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  }

  // =====================================================================
  // 7) 렌더링
  // =====================================================================

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
            theme={theme}
            setTheme={setTheme}
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

      {/* 프로필 모달 */}
      <ProfileModalView
        visible={!!selectedFriend}
        selectedFriend={selectedFriend}
        closeProfile={closeProfile}
        handleCall={handleCall}
        handleStartChat={openChatSession}
      />

      {/* 채팅 모달 */}
      <ChatModalView
        visible={!!activeChatFriend}
        activeChatFriend={activeChatFriend}
        closeChatSession={closeChatSession}
        userId={userId}
      />

      {/* 통화 화면 (숨김 채팅 전송 포함) */}
      {callingFriend && (
        <CallingScreen
          friend={callingFriend}
          userId={userId}
          onEndCall={handleEndCall}
        />
      )}

      {/* 친구 관리 모달 */}
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
      />

      {/* 친구 추가/수정 모달 */}
      <FriendAddModal
        visible={friendFormVisible}
        onClose={() => {
          setFriendFormVisible(false);
          resetFriendForm();
        }}
        newFriendName={newFriendName}
        setNewFriendName={setNewFriendName}
        newFriendGender={newFriendGender}
        setNewFriendGender={setNewFriendGender}
        newFriendType={newFriendType}
        setNewFriendType={setNewFriendType}
        newFriendProfileImageUrl={newFriendProfileImageUrl}
        setNewFriendProfileImageUrl={setNewFriendProfileImageUrl}
        newFriendStatus={newFriendStatus}
        setNewFriendStatus={setNewFriendStatus}
        newFriendPrompt={newFriendPrompt}
        setNewFriendPrompt={setNewFriendPrompt}
        newFriendAvatarColor={newFriendAvatarColor}
        setNewFriendAvatarColor={setNewFriendAvatarColor}
        newFriendStartDate={newFriendStartDate}
        setNewFriendStartDate={setNewFriendStartDate}
        newFriendEndDate={newFriendEndDate}
        setNewFriendEndDate={setNewFriendEndDate}
        newFriendStartTime={newFriendStartTime}
        setNewFriendStartTime={setNewFriendStartTime}
        newFriendEndTime={newFriendEndTime}
        setNewFriendEndTime={setNewFriendEndTime}
        newFriendCount={newFriendCount}
        setNewFriendCount={setNewFriendCount}
        handleSaveFriend={handleSaveFriend}
        editingFriendId={editingFriendId}
        onDeleteFriend={(id) => {
          handleDeleteFriendFromForm(id);
          setFriendFormVisible(false);
          resetFriendForm();
        }}
        headerTitle={friendFormTitle}
        genderOptions={GENDER_OPTIONS}
        typeOptions={TYPE_OPTIONS}
      />

      {/* 내 프로필 편집 모달 (지금은 로컬 상태만 수정) */}
      <ProfileEditModal
        visible={profileEditVisible}
        onClose={() => setProfileEditVisible(false)}
        name={userProfile.name}
        status={userProfile.status}
        avatarColor={userProfile.avatarColor}
        setName={(v) => setUserProfile((p) => ({ ...p, name: v }))}
        setStatus={(v) => setUserProfile((p) => ({ ...p, status: v }))}
        setAvatarColor={(v) =>
          setUserProfile((p) => ({ ...p, avatarColor: v }))
        }
        onSave={() => setProfileEditVisible(false)}
      />
    </SafeAreaView>
  );
}
