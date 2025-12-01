import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
    API_BASE_URL,
    WS_BASE_URL,
    STOMP_SUB_PREFIX,
    STOMP_PUB_PREFIX,
} from "./constants";

export function useChat(roomId, userId) {
    const clientRef = useRef(null);
    const subscriptionRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);

    console.log("🔍 useChat 호출:", { roomId, userId });

    // 히스토리 불러오기
    useEffect(() => {
        if (!roomId) {
            setMessages([]);
            setConnected(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                const url = `${API_BASE_URL}/api/chat/history/${roomId}`;
                console.log("[useChat] 📜 history url:", url);

                const res = await fetch(url);
                const text = await res.text();
                console.log("[useChat] 📜 history:", res.status, text);

                if (!res.ok) throw new Error(`history fetch failed: ${res.status}`);

                const data = text ? JSON.parse(text) : [];
                setMessages((prev) => {
                    if (!prev || prev.length === 0) return data;
                    const keyOf = (m) => `${m.timestamp}-${m.senderId}-${m.content}`;
                    const existingKeys = new Set(prev.map(keyOf));
                    const merged = [...prev];
                    for (const m of data) {
                        const key = keyOf(m);
                        if (!existingKeys.has(key)) merged.push(m);
                    }
                    merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                    return merged;
                });
            } catch (e) {
                console.warn("[useChat] ❌ history error:", e);
                setMessages([]);
            }
        };

        fetchHistory();
    }, [roomId]);

    // STOMP 연결
    useEffect(() => {
        if (!roomId || !userId) {
            console.log("[STOMP] ⚠️ roomId/userId 없음");
            setConnected(false);
            return;
        }

        console.log("========================================");
        console.log("[STOMP] 🚀🚀🚀 연결 시작");
        console.log("roomId:", roomId);
        console.log("userId:", userId);
        console.log("WS_BASE_URL:", WS_BASE_URL);
        console.log("========================================");

        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }
        if (clientRef.current) {
            try {
                clientRef.current.deactivate();
            } catch (e) {}
            clientRef.current = null;
        }

        let rawFrameCount = 0;

            const client = new Client({
            // brokerURL: WS_BASE_URL,  // 제거
            webSocketFactory: () => new SockJS(WS_BASE_URL), // WS_BASE_URL 예: "http://10.0.2.2:8080/ws-stomp"
            reconnectDelay: 5000,
            debug: (str) => console.log("[STOMP DEBUG]", str),
            
            debug: (str) => {
                console.log("[STOMP DEBUG]", str);
            },
            
            onConnect: (frame) => {
                console.log("========================================");
                console.log("[STOMP] ✅✅✅ onConnect 호출됨!");
                console.log("========================================");
                setConnected(true);

                if (subscriptionRef.current) {
                    subscriptionRef.current.unsubscribe();
                }

                const destination = `${STOMP_SUB_PREFIX}/chat/room/${roomId}`;
                console.log("[STOMP] 📡 구독:", destination);

                const sub = client.subscribe(destination, (frame) => {
                    try {
                        const body = JSON.parse(frame.body);
                        console.log("[STOMP] 📨 메시지:", body);

                        setMessages((prev) => {
                            const keyOf = (m) => `${m.timestamp}-${m.senderId}-${m.content}`;
                            const incomingKey = keyOf(body);
                            if (prev.some((m) => keyOf(m) === incomingKey)) return prev;
                            return [...prev, body];
                        });
                    } catch (e) {
                        console.warn("[STOMP] ❌ 파싱 에러:", e);
                    }
                });

                subscriptionRef.current = sub;
                console.log("[STOMP] ✅ 구독 완료");
            },
            
            onStompError: (frame) => {
                console.error("========================================");
                console.error("[STOMP ERROR] ❌❌❌");
                console.error("headers:", frame.headers);
                console.error("body:", frame.body);
                console.error("========================================");
                setConnected(false);
            },
            
            onWebSocketError: (event) => {
                console.error("[WS ERROR] ❌", event);
                setConnected(false);
            },
            
            onDisconnect: () => {
                console.log("[STOMP] 🔌 onDisconnect");
                setConnected(false);
            },
        });

        console.log("[STOMP] 🎬 client.activate() 호출");
        client.activate();
        clientRef.current = client;

        return () => {
            console.log("[STOMP] 🧹 cleanup");
            setConnected(false);
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
            if (clientRef.current) {
                try {
                    clientRef.current.deactivate();
                } catch (e) {}
                clientRef.current = null;
            }
        };
    }, [roomId, userId]);

    const sendMessage = (content) => {
        const trimmed = (content || "").trim();
        if (!trimmed) return;

        const msg = {
            roomId,
            senderId: userId,
            content: trimmed,
            type: "USER",
            timestamp: Date.now(),
        };

        console.log("[sendMessage] 📤", msg);
        setMessages((prev) => [...prev, msg]);

        if (!clientRef.current || !clientRef.current.connected) {
            console.warn("[sendMessage] ⚠️ STOMP 미연결");
            return;
        }

        clientRef.current.publish({
            destination: `${STOMP_PUB_PREFIX}/chat.send`,
            body: JSON.stringify(msg),
        });
    };

    const normalizeType = (m) => {
        if (!m) return "";
        const t = m.type ?? m.messageType;
        if (typeof t === "string") return t.toUpperCase();
        if (typeof t === "object" && t?.name) return t.name.toUpperCase();
        return "";
    };

    const uiMessages = messages.map((m) => {
        const upper = normalizeType(m);
        return {
            ts: m.timestamp ?? Date.now(),
            text: m.content ?? "",
            from: upper === "USER" ? "me" : "friend",
        };
    });

    return { messages, uiMessages, sendMessage, connected };
}