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
import { PermissionsAndroid, Alert } from "react-native";
// styles 파일은 제공되지 않아 import만 유지합니다.
import { styles } from "./styles";
import Voice from "@react-native-voice/voice";

export default function CallingScreen({ friend, onEndCall }) {
  const [sttResults, setSttResults] = useState([]);
  const [mockInputText, setMockInputText] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  // 현재 실시간으로 업데이트 중인 STT 항목의 ID를 추적
  const [currentResultId, setCurrentResultId] = useState(null);
  // 참조로 ID를 보관하면 이벤트 핸들러에서 최신 값을 안정적으로 참조할 수 있습니다.
  const currentResultIdRef = useRef(null);
  // 중복 start 호출을 방지하기 위한 상태(Ref)
  const startingRef = useRef(false);
  const listeningRef = useRef(false);
  // 연속 No-match 억제용 카운터 및 리셋 타이머
  const noMatchCountRef = useRef(0);
  const noMatchResetTimerRef = useRef(null);
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
    }, 2000);
  };

  // Android 마이크 권한 요청 (iOS는 Info.plist 설정 필요)
  const requestMicrophonePermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "마이크 권한 요청",
            message: "음성 인식을 위해 마이크 권한이 필요합니다.",
            buttonNeutral: "나중에",
            buttonNegative: "취소",
            buttonPositive: "허용",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn("마이크 권한 요청 중 오류:", err);
        return false;
      }
    }

    // iOS의 경우 시뮬레이터/실기기 설정에서 권한을 관리합니다.
    return true;
  };

  // STT 시작
  const startListening = async () => {
    // 이미 시작 중이거나 청취 중이면 중복 호출을 막습니다.
    if (startingRef.current || listeningRef.current) {
      console.log(
        "startListening: 이미 시작 중이거나 청취 중입니다. 호출 무시"
      );
      return;
    }

    startingRef.current = true;
    try {
      console.log("Voice start 시도...");
      const ok = await requestMicrophonePermission();
      if (!ok) {
        console.warn("마이크 권한이 거부되어 STT를 시작할 수 없습니다.");
        Alert.alert(
          "권한 필요",
          "마이크 권한을 허용해야 음성 인식이 가능합니다."
        );
        startingRef.current = false;
        return;
      }
      // 안드로이드에서는 'ko-KR' 언어 코드를 사용합니다.
      await Voice.start("ko-KR");
      listeningRef.current = true;
      setRecognizing(true);
    } catch (err) {
      console.error("STT 시작 에러:", err);
      // 안드로이드 에뮬레이터에서 STT 실패 시 로그 확인
      if (Platform.OS === "android" && err.message?.includes("network")) {
        console.warn(
          "❗ Android STT: 네트워크 연결 또는 Google Play 서비스 상태를 확인하세요."
        );
      }
      // 에러 발생 시 재시도하되 중복 재귀를 피함
      setTimeout(() => {
        if (!startingRef.current && !listeningRef.current) startListening();
      }, 1000);
    } finally {
      startingRef.current = false;
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
      const ok = await requestMicrophonePermission();
      if (ok) {
        await startListening();
      } else {
        console.warn("마이크 권한 없음: STT 시작을 건너뜁니다.");
      }
    };

    initializeSTT();

    return () => {
      console.log("📱 CallingScreen 언마운트 - STT 중지");
      stopListening();
    };
  }, []);

  // 이벤트 핸들러는 마운트 시 한 번만 바인딩하고, 참조(ref)를 통해 최신 currentResultId를 사용합니다.
  useEffect(() => {
    const onSpeechStart = (e) => {
      console.log("Voice onSpeechStart", e);
      // 이미 리스닝 플래그가 있으면 중복 이벤트로 간주하고 무시
      if (listeningRef.current) {
        console.log("onSpeechStart: 이미 listening 상태, 무시");
        return;
      }
      setRecognizing(true);
      setIsSpeaking(true);
      const id = Date.now();
      currentResultIdRef.current = id;
      setCurrentResultId(id);
    };

    const onSpeechEnd = (e) => {
      console.log("Voice onSpeechEnd", e);
      setRecognizing(false);
      setIsSpeaking(false);
      // currentResultId는 최종 결과(onSpeechResults)에서 해제합니다.

      // 인식 서비스가 멈춘 상태로 보이므로 listeningRef만 false로 전환
      listeningRef.current = false;

      // 안전장치: 만약 onSpeechResults가 오지 않는다면 일정 시간 후 세그먼트 종료 처리
      setTimeout(() => {
        if (currentResultIdRef.current !== null) {
          // 최종 결과가 오지 않았을 때 세그먼트를 비어있는 결과로 마감하지 않고 그냥 초기화
          currentResultIdRef.current = null;
          setCurrentResultId(null);
        }
      }, 1200);

      // 재시작은 에러 및 busy 상황을 고려해 onSpeechError/other 로직에서 처리합니다.
    };

    const onSpeechResults = (e) => {
      const finalText = (e && e.value && e.value[0]) || "";
      console.log("Voice onSpeechResults (최종):", finalText);

      if (!finalText.trim()) {
        // 빈 최종 결과는 무시
        return;
      }

      // 최종 결과를 현재 세그먼트에 반영
      setSttResults((prev) => {
        let id = currentResultIdRef.current;
        const timestamp = new Date().toLocaleTimeString("ko-KR");

        if (!id) {
          id = Date.now();
        }

        const index = prev.findIndex((item) => item.id === id);
        if (index !== -1) {
          return prev.map((item, i) =>
            i === index
              ? { ...item, text: finalText, timestamp: timestamp }
              : item
          );
        } else {
          const newResult = { id: id, text: finalText, timestamp: timestamp };
          return [...prev, newResult];
        }
      });

      // 이번 세그먼트 완료 처리
      currentResultIdRef.current = null;
      setCurrentResultId(null);
    };

    const onSpeechPartialResults = (e) => {
      const text = (e.value && e.value[0]) || "";
      console.log("Voice onSpeechPartialResults (중간/실시간):", text);

      // 빈 문자열(인식 없음)은 목록을 생성하지 않고 묵음 타이머만 리셋
      if (!text.trim()) {
        resetSilenceTimer();
        return;
      }

      // 실시간으로 STT 결과 목록 업데이트 (ref 기반)
      setSttResults((prev) => {
        let id = currentResultIdRef.current;
        const timestamp = new Date().toLocaleTimeString("ko-KR");

        if (id === null) {
          // 아직 ID가 없으면 새로 생성
          id = Date.now();
          currentResultIdRef.current = id;
          setCurrentResultId(id);
        }

        const index = prev.findIndex((item) => item.id === id);
        if (index !== -1) {
          return prev.map((item, i) =>
            i === index ? { ...item, text: text, timestamp: timestamp } : item
          );
        } else {
          const newResult = { id: id, text: text, timestamp: timestamp };
          return [...prev, newResult];
        }
      });

      resetSilenceTimer();
    };

    const onSpeechError = (e) => {
      try {
        // 상세한 에러 객체를 문자열로 로깅하여 디버깅에 도움을 줍니다.
        console.error("Voice onSpeechError:", JSON.stringify(e));
      } catch (err) {
        console.error("Voice onSpeechError (toString):", e);
      }

      setRecognizing(false);
      setIsSpeaking(false);
      currentResultIdRef.current = null;
      setCurrentResultId(null);

      // 에러 코드 파싱
      const code = (e && e.error && e.error.code) || (e && e.code) || null;
      let delay = 1000;

      if (code === "8") {
        // RecognitionService busy
        delay = 2500;
        // reset no-match counter
        noMatchCountRef.current = 0;
      } else if (code === "7") {
        // No match - 너무 자주 재시작하지 않도록 억제
        noMatchCountRef.current = (noMatchCountRef.current || 0) + 1;
        // 연속 5회 이상 발생하면 대기 시간을 늘리고 카운터를 리셋하는 쿨다운을 둔다
        if (noMatchCountRef.current >= 5) {
          delay = 3000;
          // 기존 타이머가 있으면 제거
          if (noMatchResetTimerRef.current)
            clearTimeout(noMatchResetTimerRef.current);
          noMatchResetTimerRef.current = setTimeout(() => {
            noMatchCountRef.current = 0;
            noMatchResetTimerRef.current = null;
          }, 7000);
        } else {
          // 짧게 재시도
          delay = 1000;
        }
      } else if (code === "11") {
        // Didn't understand
        delay = 1200;
        noMatchCountRef.current = 0;
      } else {
        // 알 수 없는 에러의 경우 기본 대기
        delay = 1000;
        noMatchCountRef.current = 0;
      }

      listeningRef.current = false;
      startingRef.current = false;

      setTimeout(() => {
        if (!startingRef.current && !listeningRef.current) {
          startListening();
        }
      }, delay);
    };

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.removeAllListeners();
      Voice.destroy().catch(() => {});
      // No-match 리셋 타이머 정리
      if (noMatchResetTimerRef.current) {
        clearTimeout(noMatchResetTimerRef.current);
        noMatchResetTimerRef.current = null;
      }
    };
  }, []);

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
