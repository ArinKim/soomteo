//package com.soomteo.backend.chat.service;
//
//import com.soomteo.backend.chat.dto.ChatMessage;
//import com.soomteo.backend.friend.entity.FriendEntity;
//import com.soomteo.backend.friend.service.FriendService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.HttpEntity;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.MediaType;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//
//import java.util.ArrayList;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//
//@Service
//@RequiredArgsConstructor
//public class ChatAiService {
//
//    private final ChatHistoryService chatHistoryService;
//    private final FriendService friendService;
//
//    // 간단히 new 로 생성 (Bean 으로 빼고 싶으면 @Bean 으로 따로 정의해도 됨)
//    private final RestTemplate restTemplate = new RestTemplate();
//
//    @Value("${upstage.api-key}")
//    private String upstageApiKey;
//
//    public ChatMessage sendToUpstage(String roomId, String userId, String content) {
//
//        Long friendId = Long.valueOf(roomId);
//        FriendEntity friend = friendService.getFriendById(friendId);
//
//        String characterPrompt =
//                (friend != null && friend.getPrompt() != null && !friend.getPrompt().isBlank())
//                        ? friend.getPrompt()
//                        : "사용자의 친한 또래 친구처럼 반말로 편하게 대화해줘.";
//
//        // 최근 대화 N개 불러오기 (맥락 유지용)
//        List<ChatMessage> history = chatHistoryService.findRecentMessages(roomId, 20);
//
//        // Upstage 포맷으로 messages 만들기
//        List<Map<String, Object>> upstageMessages = new ArrayList<>();
//
//        // 시스템 프롬프트
//        Map<String, Object> systemMsg = new HashMap<>();
//        systemMsg.put("role", "system");
//        systemMsg.put("content",
//                String.join("\n",
//                        characterPrompt,
//                        "너는 사용자의 친한 또래 친구처럼 편하게 카카오톡/문자를 주고받는 역할이야.",
//                        "",
//                        "- 말투는 반말, 너무 예의바른 존댓말은 쓰지 마. (예: '~요', '~님' 대신 '~야', '~해', '~했어?' 등)",
//                        "- '상담', 'AI', '모델', '분석' 같은 단어는 쓰지 말고, 그냥 친구처럼 자연스럽게 이야기해.",
//                        "- 한 번에 1~2문장 정도로 짧게 답장해. 너무 길게 쓰지 마.",
//                        "- 질문은 많이 하지 말고, 필요하면 1개만 붙여서 자연스럽게 이어가.",
//                        "- 괄호 ( ) 를 사용해서 부가설명, 속삭임, 내적 독백 같은 말을 붙이지 마.",
//                        "- 메시지는 실제 카카오톡처럼 자연스러운 하나의 말풍선만 출력해.",
//                        "- '( )', '[ ]', '※', '/', '*' 같은 설명투 포맷 금지.",
//                        "- 괄호 ( ), 대괄호 [ ], 따옴표로 감싼 예시는 쓰지 마.",
//                        "- `>`, `*`, 숫자 목록 등 마크다운/설명 형식은 절대 사용하지 마.",
//                        "- 여러 문단으로 나누지 말고, 실제 톡처럼 한 덩어리로만 말해.",
//                        "- 이모지는 사용하지 마",
//                        "- 출력은 말풍선에 들어갈 채팅 내용만 보내. (메타설명, 부가문구 X)",
//                        "- 절대 두 개 이상의 톤을 섞어서 쓰지 말고, 한 톤으로만 딱 말하기.",
//                        "- 괄호 안에 감정, 독백, 속마음을 표현하는 형식은 완전히 금지.",
//                        "- 출력은 하나의 문장 또는 두 문장으로 끝내기.",
//                        "- 무조건 채팅하는 느낌으로 답장을 보내줘. (말풍선으로 표현하면) 이런 건 같이 작성할 필요 없어."
//                )
//        );
////        systemMsg.put(characterPrompt);
//
//        upstageMessages.add(systemMsg);
//
//        for (ChatMessage m : history) {
//            String role = (m.getType() == ChatMessage.MessageType.USER) ? "user" : "assistant";
//
//            Map<String, Object> msg = new HashMap<>();
//            msg.put("role", role);
//            msg.put("content", m.getContent());
//
//            upstageMessages.add(msg);
//        }
//
//        // 이번에 새로 들어온 사용자 메시지도 마지막에 추가
//        Map<String, Object> latestUser = new HashMap<>();
//        latestUser.put("role", "user");
//        latestUser.put("content", content);
//        upstageMessages.add(latestUser);
//
//        // Upstage SOLAR chat completions API 호출 준비
//        String url = "https://api.upstage.ai/v1/solar/chat/completions";
//
//        Map<String, Object> body = new HashMap<>();
//        body.put("model", "solar-pro2");     // 어떤 모델 쓸지
//        body.put("messages", upstageMessages);
//        body.put("stream", false);
//        body.put("temperature", 0.7);
//
//        HttpHeaders headers = new HttpHeaders();
//        headers.setContentType(MediaType.APPLICATION_JSON);
//        headers.setBearerAuth(upstageApiKey);
//
//        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
//
//        Map<String, Object> response =
//                restTemplate.postForObject(url, entity, Map.class);
//
//        // 응답에서 assistant 답변(content) 꺼내기
//        String assistantReply = "지금은 내가 답장을 잘 못하겠어 ㅠ 잠깐 뒤에 다시 얘기하자!!"; // 답장 생성 실패시 이 멘트 사용
//
//        if (response != null) {
//            Object choicesObj = response.get("choices");
//            if (choicesObj instanceof List<?> choicesList && !choicesList.isEmpty()) {
//                Object first = choicesList.get(0);
//                if (first instanceof Map<?, ?> choiceMap) {
//                    Object msgObj = choiceMap.get("message");
//                    if (msgObj instanceof Map<?, ?> msgMap) {
//                        Object contentObj = msgMap.get("content");
//                        if (contentObj instanceof String) {
//                            assistantReply = (String) contentObj;
//                        }
//                    }
//                }
//            }
//        }
//
//        assistantReply = sanitizeReply(assistantReply);
//
//        // AI 메시지 DTO 만들어서 반환 (저장/브로드캐스트는 ChatService에서)
//        return ChatMessage.builder()
//                .roomId(roomId)
//                .senderId("AI")
//                .content(assistantReply)
//                .type(ChatMessage.MessageType.AI)
//                .timestamp(System.currentTimeMillis())
//                .build();
//    }
//
//    // 프롬프트로 다 사라지지 않는 답장 문제 해결 위함
//    private String sanitizeReply(String raw) {
//        if (raw == null) return "";
//                String text = raw;
//                // 0) <think> ... </think> 전체 블록 제거 (줄바꿈 포함)
//                text = text.replaceAll("(?is)<think>.*?</think>", "");
//                text = text.replaceAll("(?is)</think>", "").replaceAll("(?is)<think>", "");
//
//                // 1) 줄 단위로 나눠서, 메타/예시 느낌 나는 줄은 버리기
//                String[] lines = text.split("\\r?\\n");
//                StringBuilder sb = new StringBuilder();
//                String lastKeptLine = null;
//
//                for (String line : lines) {
//                    String trimmed = line.trim();
//                    if (trimmed.isEmpty()) continue;
//
//                    // 'AI', '인공지능', '모델', '시스템' 같은 메타 설명 줄 제거
//                    if (trimmed.contains("AI") || trimmed.contains("인공지능")
//                            || trimmed.contains("모델") || trimmed.contains("시스템")
//                            || trimmed.startsWith(">")) {
//                        continue;
//                    }
//
//                    // 한 줄 전체가 괄호로 둘러싸인 부가 설명이면 제거: ( ... )
//                    if (trimmed.startsWith("(") && trimmed.endsWith(")")) continue;
//
//                    if (lastKeptLine != null && lastKeptLine.equals(trimmed)) continue;
//
//                    if (!sb.isEmpty()) {
//                        sb.append(" "); // 줄바꿈 대신 공백으로 이어붙여 톡 한 덩어리 느낌
//                    }
//                    sb.append(trimmed);
//                    lastKeptLine = trimmed;
//                }
//
//                text = sb.toString().trim();
//
//                // 2) 문장 내부에 끼어있는 긴 괄호 설명 제거: "말이야. (사실 나는 ...)" -> "말이야."
//                // 문장 단위 중복 제거
//                String[] sentences = text.split("(?<=[.!?？!…])\\s+");
//                java.util.LinkedHashSet<String> uniq = new java.util.LinkedHashSet<>();
//                for (String s : sentences) {
//                    String t = s.trim();
//                    if (t.isEmpty()) continue;
//                    uniq.add(t);
//                }
//                text = String.join(" ", uniq);
//
//                // 2) 문장 내부 괄호 제거
//                text = text.replaceAll("\\([^\\)]{3,}\\)", "").trim();
//
//                // 3) 너무 길면 앞부분만 남겨서 채팅 한 버블 느낌으로 제한
//                int MAX_LEN = 120;  // 필요하면 숫자 조절
//                if (text.length() > MAX_LEN) {
//                    text = text.substring(0, MAX_LEN).trim();
//                    if (!text.endsWith("다") && !text.endsWith("요")
//                            && !text.endsWith("?") && !text.endsWith("!")) {
//                        text = text + "…";
//                    }
//                }
//
//                return text;
//    }
//}
package com.soomteo.backend.chat.service;

import com.soomteo.backend.chat.dto.ChatMessage;
import com.soomteo.backend.friend.entity.FriendEntity;
import com.soomteo.backend.friend.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatAiService {

    private final ChatHistoryService chatHistoryService;
    private final FriendService friendService;

    // 간단히 new 로 생성 (Bean 으로 빼고 싶으면 @Bean 으로 따로 정의해도 됨)
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * FastAPI ai-server 주소
     * - 로컬 Mac에서 ai-server를 8000 포트로 띄우고
     * - dev-spring은 Docker 컨테이너에서 돌아가니까 host.docker.internal 로 접근
     *
     * application.yml (또는 application-dev.yml)에
     *   ai:
     *     server:
     *       base-url: http://host.docker.internal:8000
     * 이런 식으로 덮어쓸 수 있음.
     */
    @Value("${ai.server.base-url:http://host.docker.internal:8000}")
    private String aiServerBaseUrl;

    /**
     * 기존 메서드 이름 그대로 유지 (ChatService에서 호출 중)
     * 실제로는 Upstage 직접 호출이 아니라 → ai-server의 /chat/text에 요청 보냄.
     */
    public ChatMessage sendToUpstage(String roomId, String userId, String content) {

        // roomId → friendId 로 사용 (기존 코드 유지, 나중에 persona 매핑할 때 쓰면 됨)
        Long friendId = Long.valueOf(roomId);
        FriendEntity friend = friendService.getFriendById(friendId);

        // TODO: friend 정보 보고 persona_key 매핑하고 싶으면 여기서 결정
        // 예시:
        // String personaKey = "chat_friend_youth";
        // if (friend != null && friend.getRelationType() == RelationType.MOTHER) personaKey = "chat_mom";
        String personaKey = null; // 일단 FastAPI 쪽 기본값(chat_mom) 쓰게 둠

        // -------- ai-server 요청 구성 --------
        String url = aiServerBaseUrl + "/chat/text";

        Map<String, Object> body = new HashMap<>();
        body.put("user_id", userId);
        body.put("message", content);
        body.put("persona_key", personaKey);  // null이면 FastAPI에서 기본값 사용

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        // 기본 fallback 메시지
        ChatMessage fallback = ChatMessage.builder()
                .roomId(roomId)
                .senderId("AI")
                .content("지금은 내가 답장을 잘 못하겠어 ㅠ 잠깐 뒤에 다시 얘기하자!!")
                .type(ChatMessage.MessageType.AI)
                .timestamp(System.currentTimeMillis())
                .build();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response =
                    restTemplate.postForObject(url, entity, Map.class);

            if (response != null) {
                Object botResponseObj = response.get("bot_response");
                String botResponse = (botResponseObj instanceof String)
                        ? (String) botResponseObj
                        : fallback.getContent();

                // 필요하면 emotion, crisis_level, safety_event 등도 꺼낼 수 있음
                // Object emotion = response.get("emotion");
                // Object crisisLevel = response.get("crisis_level");
                // TODO: 나중에 ChatMessage에 감정/위기 정보까지 저장하고 싶으면 확장

                // 🔹 괄호 안 메타 설명, [ ] 등 제거
                botResponse = cleanBotResponse(botResponse);
                if (botResponse.isEmpty()) {
                    botResponse = fallback.getContent();
                }

                return ChatMessage.builder()
                        .roomId(roomId)
                        .senderId("AI")
                        .content(botResponse)
                        .type(ChatMessage.MessageType.AI)
                        .timestamp(System.currentTimeMillis())
                        .build();
            }

        } catch (Exception e) {
            // ai-server 죽어 있거나 네트워크 에러일 때 여기로 옴
            e.printStackTrace();
        }

        // 에러났을 때는 fallback 메시지로 반환
        return fallback;
    }

    private String cleanBotResponse(String raw) {
        if (raw == null) return "";

        String text = raw.trim();

        // 1) ( ... ) 형태 메타 문구 전체 제거
        //    괄호 안에 글자가 2자 이상이면 제거된다.
        text = text.replaceAll("\\([^)]{2,}\\)", "").trim();

        // 2) [] 형태 메타 문구 제거
        text = text.replaceAll("\\[[^]]{2,}\\]", "").trim();

        // 3) 특수문자 기반 메타 포맷 제거
        text = text.replaceAll("※.*$", "").trim();
        text = text.replaceAll("—.*$", "").trim();   // 대시 형태 설명 제거
        text = text.replaceAll("\\*.*$", "").trim(); // 리스트 설명 제거

        // 4) 앞뒤 공백 정리
        text = text.replaceAll("\\s{2,}", " ").trim();

        return text;
    }

}
