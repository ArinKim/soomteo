export const PERSONALITY_OPTIONS = ["엄마", "친척", "아는 삼촌/이모", "또래 친구"];
export const AVATAR_COLORS = ["#F2C94C", "#60A5FA", "#34D399", "#F472B6", "#A78BFA", "#0EA5E9"];

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

