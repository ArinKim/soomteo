import { useEffect, useRef, useState } from "react";
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

    // 1) 방이 바뀔 때 서버에서 기존 히스토리 불러오기
    useEffect(() => {
        if (!roomId) {
            setMessages([]);
            setConnected(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                const url = `${API_BASE_URL}/api/chat/history/${roomId}`;
                console.log("[useChat] history url:", url);

                const res = await fetch(url);
                const text = await res.text();
                console.log("[useChat] history raw:", res.status, text);

                if (!res.ok) {
                    throw new Error(`history fetch failed: ${res.status}`);
                }

                const data = text ? JSON.parse(text) : [];

                // 🔥 여기만 수정
                setMessages((prev) => {
                    // 1) 아직 아무 메시지도 없다면 → 그냥 히스토리로 초기화
                    if (!prev || prev.length === 0) {
                        return data;
                    }

                    // 2) 이미 로컬(혹은 STOMP)로 쌓인 메시지가 있다면 → 히스토리와 merge
                    const keyOf = (m) =>
                        `${m.timestamp}-${m.senderId}-${m.content}`;

                    const existingKeys = new Set(prev.map(keyOf));
                    const merged = [...prev];

                    for (const m of data) {
                        const key = keyOf(m);
                        if (!existingKeys.has(key)) {
                            merged.push(m);
                        }
                    }

                    // 시간 순으로 정렬 (선택)
                    merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                    return merged;
                });
            } catch (e) {
                console.warn("[useChat] history load error:", e);
                setMessages((prev) => prev ?? []);
            }
        };

        fetchHistory();
    }, [roomId]);


    // 2) STOMP 연결 & 구독
    useEffect(() => {
        if (!roomId) {
            setConnected(false);
            return;
        }

        // 이전 구독/클라이언트 정리
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }
        if (clientRef.current) {
            try {
                clientRef.current.deactivate();
            } catch (e) {
                console.warn("[STOMP] deactivate error:", e);
            }
            clientRef.current = null;
        }

        const client = new Client({
            webSocketFactory: () => new WebSocket(WS_BASE_URL),
            reconnectDelay: 5000,
            debug: (str) => console.log("[STOMP DEBUG]", str),
            onConnect: () => {
                console.log("[STOMP] connected");
                setConnected(true);

                if (subscriptionRef.current) {
                    subscriptionRef.current.unsubscribe();
                }

                const sub = client.subscribe(
                    `${STOMP_SUB_PREFIX}/chat/room/${roomId}`,
                    (frame) => {
                        try {
                            const body = JSON.parse(frame.body);
                            console.log("[STOMP] received:", body);

                            setMessages((prev) => {
                                const keyOf = (m) =>
                                    `${m.timestamp}-${m.senderId}-${m.content}`;
                                const incomingKey = keyOf(body);

                                if (prev.some((m) => keyOf(m) === incomingKey)) {
                                    // 이미 있는 메시지면 추가하지 않음
                                    return prev;
                                }
                                return [...prev, body];
                            });
                        } catch (e) {
                            console.warn("[STOMP] invalid message:", e);
                        }
                    }
                );


                subscriptionRef.current = sub;
            },
            onStompError: (frame) => {
                console.error("[STOMP ERROR]", frame.headers["message"], frame.body);
            },
            onWebSocketError: (event) => {
                console.error("[WS ERROR]", event.message || event);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            setConnected(false);

            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
            if (clientRef.current) {
                try {
                    clientRef.current.deactivate();
                } catch (e) {
                    console.warn("[STOMP] deactivate error:", e);
                }
                clientRef.current = null;
            }
        };
    }, [roomId]);

    const sendMessage = (content) => {
        const trimmed = (content || "").trim();
        if (!trimmed) return;

        // 1) 먼저 로컬 UI에 추가 (optimistic)
        const msg = {
            roomId,
            senderId: userId,
            content: trimmed,
            type: "USER",
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, msg]);

        // 2) STOMP 연결 상태에 따라 서버로 전송
        if (!clientRef.current) {
            console.warn("[sendMessage] no STOMP client");
            return;
        }

        if (!clientRef.current.connected) {
            console.warn("[sendMessage] STOMP not connected yet. Only local UI updated.");
            return;
        }

        console.log("[sendMessage] publish:", msg);

        clientRef.current.publish({
            destination: `${STOMP_PUB_PREFIX}/chat.send`,
            body: JSON.stringify(msg),
        });
    };

    const uiMessages = messages.map((m) => ({
        ts: m.timestamp ?? Date.now(),
        text: m.content ?? "",
        from: m.senderId === userId ? "me" : "friend",
    }));

    return { messages, uiMessages, sendMessage, connected };
}
