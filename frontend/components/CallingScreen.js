import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import { styles } from "./styles";
import Voice from "@react-native-voice/voice";
import { useChat } from "./useChat";
import { playTts } from "../lib/TtsPlayer";
import { PERSONA_CONFIG } from "./constants";

export default function CallingScreen({ friend, userId, onEndCall }) {
  console.log("📞 CallingScreen mounted with:", { friend, userId });

  const [sttResults, setSttResults] = useState([]);
  const [recognizing, setRecognizing] = useState(false);
  const [currentResultId, setCurrentResultId] = useState(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const currentResultIdRef = useRef(null);
  const startingRef = useRef(false);
  const listeningRef = useRef(false);
  const noMatchCountRef = useRef(0);
  const noMatchResetTimerRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const silenceTimerRef = useRef(null);

  const roomId = friend?.id ?? null;
  const { uiMessages, sendMessage: wsSendMessage, connected } = useChat(
    roomId,
    userId,
    "CALL"
  );

  // 친구의 페르소나에 맞는 음성 설정 가져오기
  const voiceConfig = PERSONA_CONFIG[friend?.personality] || {
    voice: "ko-KR-Standard-A",
    rate: 1.0,
    pitch: 0.0,
  };

  // AI 응답 수신 시 자동 TTS 재생
  const lastMessageRef = useRef(null);
  useEffect(() => {
    if (uiMessages.length === 0) return;
    const lastMsg = uiMessages[uiMessages.length - 1];
    
    // AI(친구)로부터 온 메시지만 TTS 재생
    if (lastMsg.from === "friend" && lastMsg !== lastMessageRef.current) {
      lastMessageRef.current = lastMsg;
      
      console.log("🔊 AI 응답 수신, TTS 재생 시작:", lastMsg.text);
      console.log("🎵 음성 설정:", voiceConfig);
      
      setAiSpeaking(true);
      
      playTts(lastMsg.text, {
        voice: voiceConfig.voice,
        rate: voiceConfig.rate,
        pitch: voiceConfig.pitch,
      })
        .then(() => {
          console.log("✅ TTS 재생 완료");
          setAiSpeaking(false);
        })
        .catch((e) => {
          console.error("❌ TTS playback error:", e);
          setAiSpeaking(false);
        });
    }
  }, [uiMessages, voiceConfig]);

  const realtimeTranscript =
    sttResults.length > 0 ? sttResults[sttResults.length - 1].text : "";

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      if (recognizing && currentResultId !== null) {
        setCurrentResultId(null);
      }
    }, 2000);
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn("마이크 권한 요청 중 오류:", err);
        return false;
      }
    }
    return true;
  };

  const startListening = async () => {
    if (startingRef.current || listeningRef.current) return;
    startingRef.current = true;
    try {
      const ok = await requestMicrophonePermission();
      if (!ok) {
        Alert.alert("권한 필요", "마이크 권한을 허용해야 합니다.");
        startingRef.current = false;
        return;
      }
      await Voice.start("ko-KR");
      listeningRef.current = true;
      setRecognizing(true);
    } catch (err) {
      console.error("STT 시작 에러:", err);
    } finally {
      startingRef.current = false;
    }
  };

  const stopListening = () => {
    try {
      Voice.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      const ok = await requestMicrophonePermission();
      if (ok) await startListening();
    };
    init();

    return () => {
      stopListening();
    };
  }, []);

  // ===== Voice 이벤트 바인딩 (기존 동일) =====
  useEffect(() => {
    Voice.onSpeechStart = () => {
      if (listeningRef.current) return;
      setRecognizing(true);
      setIsSpeaking(true);
      const id = Date.now();
      currentResultIdRef.current = id;
      setCurrentResultId(id);
    };

    Voice.onSpeechEnd = () => {
      setRecognizing(false);
      setIsSpeaking(false);
      listeningRef.current = false;
      setTimeout(() => {
        currentResultIdRef.current = null;
        setCurrentResultId(null);
      }, 1200);
    };

    Voice.onSpeechResults = (e) => {
      const finalText = e?.value?.[0] || "";
      if (!finalText.trim()) return;

      console.log("🎤 STT 최종 결과:", finalText);

      setSttResults((prev) => {
        let id = currentResultIdRef.current || Date.now();
        const timestamp = new Date().toLocaleTimeString("ko-KR");
        const index = prev.findIndex((item) => item.id === id);
        if (index !== -1) {
          return prev.map((item, i) =>
            i === index ? { ...item, text: finalText, timestamp } : item
          );
        }
        return [...prev, { id, text: finalText, timestamp }];
      });

      // WebSocket으로 서버에 전송
      console.log("📤 서버로 메시지 전송:", finalText);
      wsSendMessage(finalText);

      currentResultIdRef.current = null;
      setCurrentResultId(null);
    };

    Voice.onSpeechPartialResults = (e) => {
      const text = e?.value?.[0] || "";
      if (!text.trim()) {
        resetSilenceTimer();
        return;
      }
      setSttResults((prev) => {
        let id = currentResultIdRef.current;
        const timestamp = new Date().toLocaleTimeString("ko-KR");
        if (!id) {
          id = Date.now();
          currentResultIdRef.current = id;
          setCurrentResultId(id);
        }
        const index = prev.findIndex((item) => item.id === id);
        if (index !== -1) {
          return prev.map((item, i) =>
            i === index ? { ...item, text, timestamp } : item
          );
        }
        return [...prev, { id, text, timestamp }];
      });

      resetSilenceTimer();
    };

    Voice.onSpeechError = () => {
      setRecognizing(false);
      setIsSpeaking(false);
      currentResultIdRef.current = null;
      setCurrentResultId(null);
      listeningRef.current = false;
      startingRef.current = false;
      setTimeout(() => startListening(), 1000);
    };

    return () => {
      Voice.removeAllListeners();
    };
  }, []);

  const handleEndCall = () => {
    onEndCall();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.callingContainer}>

        {/* ===== 헤더 ===== */}
        <View style={styles.callingHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={handleEndCall}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.avatarLarge,
              {
                backgroundColor: friend?.avatarColor || "#007AFF",
                marginBottom: 12,
              },
            ]}
          >
            <Text style={{ fontSize: 40, fontWeight: "700", color: "#fff" }}>
              {friend?.name?.charAt(0) || "?"}
            </Text>
          </View>

          <Text style={styles.callingTitle}>{friend?.name}</Text>
          <Text style={styles.callingStatus}>{friend?.statusMessage}</Text>
        </View>

        {/* ===== 중앙: 실시간 자막 한 줄만 ===== */}
        <View style={styles.currentRecognitionContainer}>
          {aiSpeaking ? (
            <>
              <Text style={[styles.currentRecognitionLabel, { color: "#10b981" }]}>
                🔊 AI 응답 중...
              </Text>
              <Text
                style={[
                  styles.transcriptDisplay,
                  { textAlign: "center", fontSize: 16, paddingHorizontal: 20, color: "#6b7280" },
                ]}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {uiMessages.length > 0 && uiMessages[uiMessages.length - 1].from === "friend"
                  ? uiMessages[uiMessages.length - 1].text
                  : ""}
              </Text>
            </>
          ) : recognizing ? (
            <>
              <Text style={styles.currentRecognitionLabel}>🎤 청취 중...</Text>
              <Text
                style={[
                  styles.transcriptDisplay,
                  { textAlign: "center", fontSize: 18, paddingHorizontal: 20 },
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {realtimeTranscript || ""}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.currentRecognitionLabel}>💬 대기 중</Text>
              <TouchableOpacity
                style={styles.manualStartButton}
                onPress={startListening}
              >
                <Text style={styles.manualStartButtonText}>청취 시작</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ===== 하단: 통화 종료 버튼 ===== */}
        <View style={styles.callingActions}>
          <TouchableOpacity onPress={handleEndCall} style={styles.endCallBtn}>
            <Text style={styles.endCallText}>통화 종료</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
