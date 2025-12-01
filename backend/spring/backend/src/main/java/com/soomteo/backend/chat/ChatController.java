package com.soomteo.backend.chat;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

import java.util.*;
import java.util.stream.Collectors;

@RestController
public class ChatController {

    private final RedisTemplate<String, String> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    public ChatController(RedisTemplate<String, String> redisTemplate,
                          SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    private String roomKey(String roomId) {
        // roomId = "{userId}:{characterId}" 형태
        return "chat:room:" + roomId;
    }

    private String scheduleKey(String roomId) {
        // 스케줄 키도 roomId 기준: chat:schedule:{userId}:{characterId}
        return "chat:schedule:" + roomId;
    }

    /**
     * STOMP 메시지 수신 (클라이언트 → 서버)
     * /pub/chat/{roomId} 로 들어온 payload(JSON string)를 그대로 Redis에 저장하고
     * /sub/chat/{roomId} 로 브로드캐스트
     */
    @MessageMapping("/chat/{roomId}")
    public void handleChat(@DestinationVariable String roomId, String payload) {
        String key = roomKey(roomId);

        // Redis에 push
        redisTemplate.opsForList().rightPush(key, payload);
        // 최근 200개만 유지
        redisTemplate.opsForList().trim(key, -200, -1);

        // 구독 중인 클라이언트들에게 전송
        messagingTemplate.convertAndSend("/sub/chat/" + roomId, payload);
    }

    /**
     * 특정 방의 히스토리 조회
     * GET /api/chat/{roomId}/messages
     * → ["{\"roomId\":\"userA:mom\", ...}", ...] 형식의 String 리스트
     */
    @GetMapping("/api/chat/{roomId}/messages")
    public List<String> getHistory(@PathVariable String roomId) {
        String key = roomKey(roomId);
        List<String> history = redisTemplate.opsForList().range(key, 0, -1);
        return history != null ? history : Collections.emptyList();
    }

    /**
     * (디버그용) test 방 히스토리
     */
    @GetMapping("/api/chat/test/messages")
    public List<String> getTestHistory() {
        return getHistory("test");
    }

    /**
     * (디버그용) 현재 Redis에 존재하는 모든 채팅방 목록 조회
     * GET /api/chat/rooms
     * → ["userA:mom","userA:friend1","userB:mom",...]
     */
    @GetMapping("/api/chat/rooms")
    public Set<String> getAllRooms() {
        Set<String> keys = redisTemplate.keys("chat:room:*");
        if (keys == null) {
            return Collections.emptySet();
        }
        return keys.stream()
                .map(k -> k.substring("chat:room:".length()))
                .collect(Collectors.toSet());
    }

    /**
     * 오늘 스케줄 JSON 조회 (디버그용)
     * GET /api/chat/{roomId}/schedule
     * → chat:schedule:{roomId} 에 저장된 JSON 문자열을 그대로 반환
     */
    @GetMapping("/api/chat/{roomId}/schedule")
    public String getSchedule(@PathVariable String roomId) {
        String key = scheduleKey(roomId);
        String json = redisTemplate.opsForValue().get(key);
        if (json == null) {
            return "{}";
        }
        return json;
    }

    /**
     * STT(음성 인식) 결과를 텍스트로 받아서,
     * 기존 채팅 메시지처럼 Redis에 저장하고 WebSocket으로 뿌려주는 엔드포인트.
     *
     * 예:
     * POST /api/chat/voice
     * {
     *   "roomId": "testUser:mom",
     *   "senderName": "나",
     *   "content": "오늘 진짜 피곤해"
     * }
     */
    public static class VoiceMessageRequest {
        public String roomId;
        public String senderName;
        public String content;
    }

    @PostMapping("/api/chat/voice")
    public String postVoiceMessage(@RequestBody VoiceMessageRequest req) throws JsonProcessingException {
        if (req.roomId == null || req.roomId.isBlank()) {
            throw new IllegalArgumentException("roomId는 필수입니다.");
        }
        if (req.content == null || req.content.isBlank()) {
            throw new IllegalArgumentException("content(STT 결과 텍스트)는 필수입니다.");
        }

        String senderName =
                (req.senderName == null || req.senderName.isBlank())
                        ? "나"
                        : req.senderName;

        // 1) 기존 채팅 메시지와 동일한 JSON 구조 만들기
        Map<String, Object> payloadObj = new HashMap<>();
        payloadObj.put("roomId", req.roomId);
        payloadObj.put("senderId", "user");       // 음성 입력도 유저가 보낸 걸로
        payloadObj.put("senderName", senderName);
        payloadObj.put("content", req.content);
        payloadObj.put("inputType", "voice");     // 선택: STT로 온 것 표시용

        String payload = objectMapper.writeValueAsString(payloadObj);

        // 2) Redis에 저장 (기존 handleChat 과 동일)
        String key = roomKey(req.roomId);
        redisTemplate.opsForList().rightPush(key, payload);
        redisTemplate.opsForList().trim(key, -200, -1);

        // 3) WebSocket으로 방송 → /sub/chat/{roomId} 구독 중인 클라이언트에서 바로 보임
        messagingTemplate.convertAndSend("/sub/chat/" + req.roomId, payload);

        System.out.println("[ChatController] STT 메시지 수신 room=" + req.roomId + " content=" + req.content);

        return "ok";
    }

}
