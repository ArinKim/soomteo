export const PERSONALITY_OPTIONS = [
  "엄마",
  "아빠",
  "딸",
  "아들",
  "친척 (남)",
  "친척 (여)",
  "친구 (10~20대, 여)",
  "친구 (30~50대, 여)",
  "친구 (60대 이상, 여)",
];

// 페르소나별 음성 모델과 어투 프롬프트 매핑
export const PERSONA_CONFIG = {
  엄마: {
    target: "청소년",
    voice: "ko-KR-Chirp3-HD-Vindemiatrix",
    prompt: "Use a kind, soothing voice with the empathy of a caring parent.",
    pitch: 0.0,
    rate: 1.0,
  },
  아빠: {
    target: "청소년",
    voice: "ko-KR-Chirp3-HD-Algenib",
    prompt: "Use a kind, soothing voice with the empathy of a caring parent.",
    pitch: 0.0,
    rate: 1.0,
  },
  딸: {
    target: "노년",
    voice: "ko-KR-Standard-A",
    prompt:
      "Use a gentle, compassionate tone, as if you are an adult child devoted to supporting and understanding an aging parent.",
    pitch: 0.0,
    rate: 0.95,
  },
  아들: {
    target: "노년",
    voice: "ko-KR-Chirp3-HD-Alnilam",
    prompt:
      "Use a gentle, compassionate tone, as if you are an adult child devoted to supporting and understanding an aging parent.",
    pitch: 0.0,
    rate: 0.95,
  },
  "친척 (남)": {
    target: "공통",
    voice: "ko-KR-Standard-C",
    prompt:
      "Speak in a warm, kind, and understanding tone, like a gentle relative whose words feel comforting to listeners of all ages—from teenagers to older adults.",
    pitch: 0.0,
    rate: 1.0,
  },
  "친척 (여)": {
    target: "공통",
    voice: "ko-KR-Wavenet-B",
    prompt:
      "Speak in a warm, kind, and understanding tone, like a gentle relative whose words feel comforting to listeners of all ages—from teenagers to older adults.",
    pitch: 2.0,
    rate: 1.1,
  },
  "친구 (10~20대, 여)": {
    target: "청소년",
    voice: "ko-KR-Standard-A",
    prompt:
      "Speak like a friend in their teens or twenties—comfortable, light, and naturally empathetic, without sounding overly polite or forced.",
    pitch: 4.0, // 높은 톤 (10~20대 특유의 밝은 목소리)
    rate: 1.1, // 빠른 속도 (젊은 층의 활기찬 말투)
  },
  "친구 (30~50대, 여)": {
    target: "공통",
    voice: "ko-KR-Chirp3-HD-Sulafat",
    prompt:
      "Speak like an ordinary friend in their 30s to 50s—comfortable, natural, and empathetic, without sounding forced or overly business-like.",
    pitch: 0.0,
    rate: 1.0,
  },
  "친구 (60대 이상, 여)": {
    target: "노년",
    voice: "ko-KR-Standard-B",
    prompt:
      "Speak like an ordinary friend in their 60s or older—slightly slower, natural, and easy to understand.",
    pitch: -2.0, // 낮은 톤 (나이 있는 목소리)
    rate: 0.85,
  },
};

export const AVATAR_COLORS = [
  "#F2C94C",
  "#60A5FA",
  "#34D399",
  "#F472B6",
  "#A78BFA",
  "#0EA5E9",
];

import { Platform } from "react-native";

// - 시뮬레이터에서만 돌리면: "localhost"
// - 실기(폰)에서 돌리면: 맥의 IP (예: "192.168.0.5")
const LOCAL_PC_IP = "localhost"; // 필요하면 192.168.x.x 로 변경

const DEV_HOST =
    Platform.OS === "android"
        ? LOCAL_PC_IP
        : LOCAL_PC_IP;

export const API_BASE_URL = `http://${DEV_HOST}:8080`;
export const WS_BASE_URL  = `ws://${DEV_HOST}:8080/ws-stomp`;

export const STOMP_SUB_PREFIX = "/sub";
export const STOMP_PUB_PREFIX = "/pub";

