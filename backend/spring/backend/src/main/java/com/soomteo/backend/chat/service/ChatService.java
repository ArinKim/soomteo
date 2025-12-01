package com.soomteo.backend.chat.service;

import com.soomteo.backend.chat.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatHistoryService chatHistoryService;
    private final ChatAiService chatAiService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void handleUserMessage(ChatMessage message) {

        // 1) 유저 메시지 세팅
        message.setType(ChatMessage.MessageType.USER);

        if (message.getTimestamp() == null) {
            message.setTimestamp(System.currentTimeMillis());
        }

        // 2) 유저 메시지 DB 저장
        chatHistoryService.saveMessage(message);

        // 3) 유저 메시지 먼저 브로드캐스트
        String dest = "/sub/chat/room/" + message.getRoomId();
        messagingTemplate.convertAndSend(dest, message);

        // 4) ai-server(FAST API) 호출해서 AI 답장 생성
        ChatMessage aiReply;
        try {
            aiReply = chatAiService.sendToUpstage(
                    message.getRoomId(),
                    message.getSenderId(),
                    message.getContent()
            );
        } catch (Exception e) {
            // ai-server 호출 실패해도 서비스 안 죽게 방어
            e.printStackTrace();
            aiReply = ChatMessage.builder()
                    .roomId(message.getRoomId())
                    .senderId("AI")
                    .content("지금은 내가 답장을 잘 못하겠어 ㅠ 잠깐 뒤에 다시 얘기하자!!")
                    .type(ChatMessage.MessageType.AI)
                    .timestamp(System.currentTimeMillis())
                    .build();
        }

        // 5) AI 답장 DB에 저장
        chatHistoryService.saveMessage(aiReply);

        // 6) AI 답장 브로드캐스트
        messagingTemplate.convertAndSend(dest, aiReply);
    }
}
