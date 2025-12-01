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
     *
     *   ai:
     *     server:
     *       base-url: http://host.docker.internal:8000
     *
     * 이런 식으로 덮어쓸 수 있음.
     */
    @Value("${ai.server.base-url:http://host.docker.internal:8000}")
    private String aiServerBaseUrl;

    /**
     * 기존 메서드 이름 그대로 유지 (ChatService에서 호출 중)
     * 실제로는 Upstage 직접 호출이 아니라 → ai-server의 /chat/text에 요청 보냄.
     */
    public ChatMessage sendToUpstage(String roomId, String userId, String content) {

        // roomId → friend.id 로 사용 (기존 로직 그대로 유지)
        Long friendId = Long.valueOf(roomId);
        FriendEntity friend = friendService.getFriendById(friendId);

        // 친구의 character_type_id 기준으로 persona_key 결정
        String personaKey = resolvePersonaKey(friend);

        // -------- ai-server 요청 구성 --------
        String url = aiServerBaseUrl + "/chat/text";

        Map<String, Object> body = new HashMap<>();
        body.put("user_id", userId);
        body.put("message", content);
        body.put("persona_key", personaKey);  // FastAPI에서 해당 persona 사용

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        System.out.println(personaKey);

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

                // 🔹 괄호/대괄호, '※' 같은 부가 설명 제거
                botResponse = cleanBotResponse(botResponse);
                if (botResponse.isEmpty()) {
                    botResponse = fallback.getContent();
                }

                // 필요하면 emotion, crisis_level, safety_event 등도 꺼낼 수 있음
                // Object emotion = response.get("emotion");
                // Object crisisLevel = response.get("crisis_level");

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

    /**
     * character_type_id → FastAPI persona_key 매핑
     *
     * character_type 테이블 더미 데이터 기준:
     *  1: 친구 / FEMALE   → chat_friend_youth
     *  2: 친구 / MALE     → chat_friend_youth
     *  3: 부모님 / FEMALE → chat_mom
     *  4: 부모님 / MALE   → chat_dad
     *  5: 자식 / FEMALE   → chat_daughter
     *  6: 자식 / MALE     → chat_son
     *  7: 친척 / FEMALE   → chat_relative_female
     *  8: 친척 / MALE     → chat_relative_male
     */
    private String resolvePersonaKey(FriendEntity friend) {
        // 기본값: 또래 친구
        String defaultPersona = "chat_friend_youth";

        if (friend == null) {
            return defaultPersona;
        }

        Long characterTypeId = null;

        // 1) FriendEntity 에 getCharacterTypeId() 가 있는 경우
        try {
            characterTypeId = (Long) friend.getClass()
                    .getMethod("getCharacterTypeId")
                    .invoke(friend);
        } catch (Exception ignored) {
        }

        // 2) 없으면 getCharacterType().getId() 시도 (ManyToOne 매핑 가정)
        if (characterTypeId == null) {
            try {
                Object characterType = friend.getClass()
                        .getMethod("getCharacterType")
                        .invoke(friend);
                if (characterType != null) {
                    characterTypeId = (Long) characterType.getClass()
                            .getMethod("getId")
                            .invoke(characterType);
                }
            } catch (Exception ignored) {
            }
        }

        if (characterTypeId == null) {
            return defaultPersona;
        }

        int id = characterTypeId.intValue();

        switch (id) {
            case 1: // 친구 FEMALE
            case 2: // 친구 MALE
                return "chat_friend_youth";

            case 3: // 부모님 FEMALE
                return "chat_mom";

            case 4: // 부모님 MALE
                return "chat_dad";

            case 5: // 자식 FEMALE
                return "chat_daughter";

            case 6: // 자식 MALE
                return "chat_son";

            case 7: // 친척 FEMALE
                return "chat_relative_female";

            case 8: // 친척 MALE
                return "chat_relative_male";

            default:
                return defaultPersona;
        }
    }

    /**
     * AI 응답에서 (위기 수준: ...), [설명], '※ ...' 같은
     * 메타/부가 설명을 잘라내고 채팅 버블에 들어갈 문장만 남긴다.
     */
    private String cleanBotResponse(String raw) {
        if (raw == null) return "";

        String text = raw.trim();

        // 1) 줄 단위로 먼저 "※ ..." 같은 부가 설명을 잘라낸다.
        String[] lines = text.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            // '※', '*', '-' 로 시작하는 부가 설명 줄 제거
            if (trimmed.startsWith("※") || trimmed.startsWith("*") || trimmed.startsWith("-")) {
                continue;
            }
            if (!sb.isEmpty()) {
                sb.append(" ");
            }
            sb.append(trimmed);
        }
        text = sb.toString().trim();

        // 2) 문장 안에 있는 ( ... ) / [ ... ] 메타 설명 제거
        //    예: "너 옆에 있을게 (위기 수준: caution)" → "너 옆에 있을게"
        text = text.replaceAll("\\([^)]{2,}\\)", "");
        text = text.replaceAll("\\[[^]]{2,}\\]", "");

        // 3) 남은 것 중에서 '※' 이후 텍스트, '—' 이후 텍스트 잘라내기
        text = text.replaceAll("※.*$", "");
        text = text.replaceAll("—.*$", "");

        // 4) 공백 정리
        text = text.replaceAll("\\s{2,}", " ").trim();

        return text;
    }

}
