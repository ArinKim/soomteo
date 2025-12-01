//package com.soomteo.backend.ai;
//
//import com.soomteo.backend.ai.dto.AiTextChatRequest;
//import com.soomteo.backend.ai.dto.AiTextChatResponse;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import org.springframework.web.reactive.function.client.WebClient;
//import reactor.core.publisher.Mono;
//
//@Service
//@RequiredArgsConstructor
//public class AiChatClient {
//
//    private final WebClient aiServerWebClient;
//
//    /**
//     * 텍스트 채팅 한 턴을 AI 서버에 요청
//     */
//    public AiTextChatResponse chatText(String userId, String message, String personaKey) {
//        AiTextChatRequest request = AiTextChatRequest.builder()
//                .user_id(userId)
//                .message(message)
//                .persona_key(personaKey)
//                .build();
//
//        return aiServerWebClient.post()
//                .uri("/chat/text")
//                .bodyValue(request)
//                .retrieve()
//                .bodyToMono(AiTextChatResponse.class)
//                .block(); // 간단히 동기 블록. 필요하면 비동기로 바꿀 수 있음
//    }
//}
