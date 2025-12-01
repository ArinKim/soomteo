import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as Speech from "expo-speech";
import SystemSetting from "react-native-system-setting";
import { PERSONALITY_OPTIONS, PERSONA_CONFIG } from "./constants";
import { styles as appStyles } from "./styles";
import { playTts } from "../lib/TtsPlayer";

export default function TTSScreen({ activeFriend }) {
  // activeFriend가 있을 경우 해당 친구의 페르소나 사용, 없으면 선택 모드
  const initialPersona = activeFriend?.personality || PERSONALITY_OPTIONS[0];
  const [persona, setPersona] = useState(initialPersona);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [text, setText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // 현재 시스템 볼륨 로드
  useEffect(() => {
    SystemSetting.getVolume("music").then((vol) => {
      setVolume(vol);
    });
  }, []);

  // 현재 페르소나에 따른 음성 옵션 계산
  const voiceParams = useMemo(() => {
    const config = PERSONA_CONFIG[persona];
    if (!config) {
      return {
        voice: "ko-KR-Standard-A",
        pitch: 0.0,
        rate: 1.0,
        prompt: "",
        target: "공통",
      };
    }
    return {
      voice: config.voice,
      pitch: config.pitch,
      rate: config.rate,
      prompt: config.prompt,
      target: config.target,
    };
  }, [persona]);

  const handleSpeak = async () => {
    const s = text.trim();
    if (!s) return;
    setSpeaking(true);
    try {
      // 페르소나에 따른 음성 옵션 전달
      await playTts(s, {
        voice: voiceParams.voice,
        rate: voiceParams.rate,
        pitch: voiceParams.pitch,
      });
    } catch (e) {
      console.error("playTts error", e);
    } finally {
      setSpeaking(false);
    }
  };

  const handleStop = () => {
    // Server TTS는 중지 기능이 없으므로 상태만 리셋
    setSpeaking(false);
  };

  const toggleDropdown = () => {
    if (activeFriend) return; // 친구 기반일 때 변경 불가
    setDropdownOpen((prev) => !prev);
  };

  const choosePersona = (p) => {
    setPersona(p);
    setDropdownOpen(false);
  };

  const increaseVolume = () => {
    const newVol = Math.min(1.0, volume + 0.1);
    SystemSetting.setVolume(newVol, { type: "music" });
    setVolume(newVol);
  };

  const decreaseVolume = () => {
    const newVol = Math.max(0.0, volume - 0.1);
    SystemSetting.setVolume(newVol, { type: "music" });
    setVolume(newVol);
  };

  return (
    <View style={[appStyles.container, localStyles.container]}>
      <ScrollView contentContainerStyle={localStyles.scrollInner}>
        <Text style={localStyles.title}>AI 음성 출력</Text>

        <TouchableOpacity
          style={localStyles.personaSelector}
          onPress={toggleDropdown}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={localStyles.personaLabel}>사용 중인 AI 패르소나</Text>
            <Text style={localStyles.personaValue}>{persona}</Text>
          </View>
          {!activeFriend && (
            <Text style={localStyles.selectorHint}>
              {dropdownOpen ? "닫기" : "변경"}
            </Text>
          )}
        </TouchableOpacity>
        {dropdownOpen && !activeFriend && (
          <View style={localStyles.dropdownBox}>
            {PERSONALITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  localStyles.dropdownItem,
                  opt === persona && localStyles.dropdownItemActive,
                ]}
                onPress={() => choosePersona(opt)}
              >
                <Text
                  style={
                    opt === persona
                      ? localStyles.dropdownItemActiveText
                      : localStyles.dropdownItemText
                  }
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={localStyles.paramBox}>
          <Text style={localStyles.paramTitle}>음성 설정</Text>
          <Text style={localStyles.paramText}>대상: {voiceParams.target}</Text>
          <Text style={localStyles.paramText}>음성: {voiceParams.voice}</Text>
          <Text style={localStyles.paramText}>Rate: {voiceParams.rate}</Text>
          <Text style={localStyles.paramText}>Pitch: {voiceParams.pitch}</Text>
          {voiceParams.prompt && (
            <Text style={localStyles.paramPrompt}>
              어투: {voiceParams.prompt}
            </Text>
          )}
        </View>

        <View style={localStyles.volumeBox}>
          <Text style={localStyles.volumeTitle}>미디어 볼륨</Text>
          <View style={localStyles.volumeControls}>
            <TouchableOpacity
              style={localStyles.volumeBtn}
              onPress={decreaseVolume}
            >
              <Text style={localStyles.volumeBtnText}>🔉 -</Text>
            </TouchableOpacity>
            <Text style={localStyles.volumeText}>
              {Math.round(volume * 100)}%
            </Text>
            <TouchableOpacity
              style={localStyles.volumeBtn}
              onPress={increaseVolume}
            >
              <Text style={localStyles.volumeBtnText}>🔊 +</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={localStyles.inputLabel}>출력할 텍스트</Text>
        <TextInput
          value={text == "" ? "안녕? 오늘 하루는 어때?" : text}
          onChangeText={setText}
          placeholder="여기에 텍스트를 입력하세요"
          multiline
          style={localStyles.textArea}
        />

        <View style={localStyles.actionsRow}>
          <TouchableOpacity
            style={[
              localStyles.actionBtn,
              localStyles.speakBtn,
              speaking && localStyles.disabledBtn,
            ]}
            onPress={handleSpeak}
            disabled={speaking || !text.trim()}
          >
            <Text style={localStyles.speakBtnText}>
              {speaking ? "재생 중" : "재생"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[localStyles.actionBtn, localStyles.stopBtn]}
            onPress={handleStop}
            disabled={!speaking}
          >
            <Text style={localStyles.stopBtnText}>중지</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={localStyles.clearBtn}
          onPress={() => setText("")}
          disabled={!text.length}
        >
          <Text style={localStyles.clearBtnText}>입력 초기화</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { backgroundColor: "#fff" },
  scrollInner: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  personaSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  personaLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  personaValue: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  selectorHint: { fontSize: 13, color: "#0A84FF", fontWeight: "600" },
  dropdownBox: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 6,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  dropdownItemActive: { backgroundColor: "#0A84FF" },
  dropdownItemText: { color: "#111" },
  dropdownItemActiveText: { color: "#fff", fontWeight: "600" },
  paramBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f9fafb",
    marginBottom: 16,
  },
  paramTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  paramText: { fontSize: 12, color: "#374151", marginBottom: 2 },
  paramVoice: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  paramPrompt: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 6,
    fontStyle: "italic",
  },
  inputLabel: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    textAlignVertical: "top",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  actionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 12,
    marginHorizontal: 8,
    minWidth: 120,
    alignItems: "center",
  },
  speakBtn: { backgroundColor: "#0A84FF" },
  speakBtnText: { color: "#fff", fontWeight: "700" },
  stopBtn: { backgroundColor: "#fee2e2" },
  stopBtnText: { color: "#b91c1c", fontWeight: "700" },
  disabledBtn: { opacity: 0.7 },
  clearBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  clearBtnText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  warningBox: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    color: "#92400e",
  },
  warningText: { fontSize: 12, color: "#78350f", lineHeight: 18 },
  forceBtn: {
    backgroundColor: "#fbbf24",
    marginTop: 10,
  },
  forceBtnText: { color: "#78350f", fontWeight: "700" },
  volumeBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f9fafb",
    marginBottom: 16,
  },
  volumeTitle: { fontSize: 13, fontWeight: "700", marginBottom: 10 },
  volumeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  volumeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  volumeBtnText: { fontSize: 16, fontWeight: "600" },
  volumeText: { fontSize: 18, fontWeight: "700", color: "#374151" },
});
