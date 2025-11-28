import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  // Platform을 import하여 안드로이드 환경에서 추가 디버깅에 활용할 수 있습니다.
  Platform,
} from "react-native";
// styles 파일은 제공되지 않아 import만 유지합니다.
import { styles } from "./styles";
import Voice from "@react-native-voice/voice";

export default function CallingScreen({ friend, onEndCall }) {
  const [sttResults, setSttResults] = useState([]);
  const [mockInputText, setMockInputText] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  // 현재 실시간으로 업데이트 중인 STT 항목의 ID를 추적
  const [currentResultId, setCurrentResultId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const silenceTimerRef = useRef(null);
  // [수정] ScrollView 관리를 위해 useRef 훅 사용
  const scrollViewRef = useRef(null);

  // 현재 실시간으로 화면 상단에 보여줄 텍스트 (목록의 마지막 항목)
  const realtimeTranscript =
    sttResults.length > 0 ? sttResults[sttResults.length - 1].text : "";

  // 1.5초 묵음 감지
  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    silenceTimerRef.current = setTimeout(() => {
      // 묵음 감지 시, 현재 업데이트 중인 세그먼트를 '완료' 처리하고 다음 발화를 준비
      if (recognizing && currentResultId !== null) {
        console.log("===== 1.5초 묵음 감지 - 세그먼트 완료 =====");
        // ID를 null로 설정하여 다음 발화는 새로운 목록 항목으로 시작하게 함
        setCurrentResultId(null);
      }
    }, 1500);
  };

  // STT 시작
  const startListening = async () => {
    try {
      console.log("Voice start 시도...");
      // 안드로이드에서는 'ko-KR' 언어 코드를 사용합니다.
      await Voice.start("ko-KR");
      setRecognizing(true);
    } catch (err) {
      console.error("STT 시작 에러:", err);
      // 안드로이드 에뮬레이터에서 STT 실패 시 로그 확인
      if (Platform.OS === "android" && err.message?.includes("network")) {
        console.warn(
          "❗ Android STT: 네트워크 연결 또는 Google Play 서비스 상태를 확인하세요."
        );
      }
      // 에러 발생 시 1초 후 재시작 시도
      setTimeout(() => startListening(), 1000);
    }
  };

  // STT 중지
  const stopListening = () => {
    try {
      Voice.stop();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    } catch (err) {
      console.error("STT 중지 에러:", err);
    }
  };

  // 컴포넌트 마운트/언마운트 시 STT 관리
  useEffect(() => {
    const initializeSTT = async () => {
      console.log("📱 CallingScreen 마운트 - STT 초기화");
      await startListening();
    };

    initializeSTT();

    return () => {
      console.log("📱 CallingScreen 언마운트 - STT 중지");
      stopListening();
    };
  }, []);

  // Voice 이벤트 핸들러 바인딩 (currentResultId 변경에 의존)
  useEffect(() => {
    const onSpeechStart = (e) => {
      console.log("Voice onSpeechStart", e);
      setRecognizing(true);
      setIsSpeaking(true);
      // 새 발화가 시작되면 새로운 ID를 할당하여 목록에 새 항목을 준비
      setCurrentResultId(Date.now());
    };

    const onSpeechEnd = (e) => {
      console.log("Voice onSpeechEnd", e);
      setRecognizing(false);
      setIsSpeaking(false);
      // 발화가 끝나면 현재 ID를 초기화 (묵음 타이머와 중복 처리될 수 있지만, 안전을 위해 유지)
      setCurrentResultId(null);

      // STT 모듈을 닫고 1초 후 재시작 (연속 청취를 위해)
      Voice.destroy()
        .then(() => {
          setTimeout(() => {
            startListening();
          }, 1000);
        })
        .catch(() => {});
    };

    const onSpeechResults = (e) => {
      console.log("Voice onSpeechResults (최종):", e.value && e.value[0]);
      // 최종 결과는 중간 결과에 의해 이미 목록에 업데이트되었으므로 추가 저장 로직은 생략
    };

    const onSpeechPartialResults = (e) => {
      const text = (e.value && e.value[0]) || "";
      console.log("Voice onSpeechPartialResults (중간/실시간):", text);

      // 1. 실시간으로 STT 결과 목록 업데이트
      setSttResults((prev) => {
        const id = currentResultId;
        if (id === null) return prev;

        const index = prev.findIndex((item) => item.id === id);
        const timestamp = new Date().toLocaleTimeString("ko-KR");

        if (index !== -1) {
          // 이미 존재하는 항목이면 텍스트만 덮어쓰기 (실시간 업데이트)
          return prev.map((item, i) =>
            i === index ? { ...item, text: text, timestamp: timestamp } : item
          );
        } else {
          // 새로운 발화의 첫 번째 중간 결과인 경우, 새 항목 생성
          const newResult = {
            id: id,
            text: text,
            timestamp: timestamp,
          };
          return [...prev, newResult];
        }
      });

      // 2. 음성이 감지되면 묵음 타이머 리셋
      resetSilenceTimer();
    };

    const onSpeechError = (e) => {
      console.error("Voice onSpeechError:", e);
      setRecognizing(false);
      setIsSpeaking(false);
      setCurrentResultId(null);

      // 에러 시에도 재시작 시도
      setTimeout(() => {
        startListening();
      }, 1000);
    };

    // 이벤트 리스너 바인딩
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.removeAllListeners();
      Voice.destroy().catch(() => {});
    };
  }, [currentResultId]); // currentResultId가 변경될 때마다 이벤트 핸들러가 갱신되어 최신 ID를 참조

  // 통화 종료
  const handleEndCall = async () => {
    console.log("===== 통화 종료 =====");
    console.log("총 입력된 텍스트 수:", sttResults.length);
    sttResults.forEach((result, index) => {
      console.log(`${index + 1}. [${result.timestamp}] ${result.text}`);
    });
    onEndCall();
  };

  // Mock: 텍스트 추가 (실제 STT 대신)
  const addMockResult = () => {
    if (!mockInputText.trim()) return;

    const timestamp = new Date().toLocaleTimeString("ko-KR");
    const newResult = {
      id: Date.now(),
      text: mockInputText.trim(),
      timestamp: timestamp,
    };

    setSttResults((prev) => [...prev, newResult]);
    console.log("✓ Mock 텍스트 추가:", mockInputText);
    setMockInputText("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.callingContainer}>
        {/* 헤더: 친구 정보 및 닫기 버튼 */}
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

        {/* STT 상태 표시 (실시간으로 목록의 마지막 항목을 보여줌) */}
        <View style={styles.currentRecognitionContainer}>
          {recognizing ? (
            <>
              <Text style={styles.currentRecognitionLabel}>🎤 청취 중...</Text>
              <Text style={styles.transcriptDisplay}>
                {realtimeTranscript || "음성을 인식 중입니다..."}
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

        {/* Mock 입력 (테스트용) */}
        <View style={styles.mockInputContainer}>
          <Text style={styles.mockInputLabel}>테스트용 Mock 입력:</Text>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TextInput
              style={styles.mockInput}
              placeholder="음성 인식 테스트..."
              placeholderTextColor="#ccc"
              value={mockInputText}
              onChangeText={setMockInputText}
            />
            <TouchableOpacity onPress={addMockResult} style={styles.addButton}>
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* STT 결과 목록 */}
        <ScrollView
          style={styles.sttResultsContainer}
          // [수정] useRef 사용
          ref={scrollViewRef}
          // 새로운 텍스트가 추가될 때마다 자동으로 스크롤
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          <Text style={styles.sttResultsTitle}>
            인식 목록 ({sttResults.length}개)
          </Text>
          {sttResults.length === 0 ? (
            <Text style={styles.emptyText}>아직 인식된 음성이 없습니다.</Text>
          ) : (
            sttResults.map((result, index) => (
              <View key={result.id} style={styles.sttResultItem}>
                <Text style={styles.sttResultTime}>
                  {index + 1}. [{result.timestamp}]
                </Text>
                <Text
                  style={[
                    styles.sttResultText,
                    // 현재 업데이트 중인 항목은 색상을 다르게 표시
                    result.id === currentResultId && {
                      color: "#007AFF",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {result.text}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* 통화 종료 버튼 */}
        <View style={styles.callingActions}>
          <TouchableOpacity onPress={handleEndCall} style={styles.endCallBtn}>
            <Text style={styles.endCallText}>통화 종료</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
