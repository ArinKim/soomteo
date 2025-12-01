package com.soomteo.backend.chat.controller;

import com.soomteo.backend.chat.dto.ChatMessage;
import com.soomteo.backend.chat.service.ChatService;
import com.soomteo.backend.chat.service.ChatAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatAiService chatAiService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void handleChat(ChatMessage message) {
        chatService.handleUserMessage(message); // 들어오는 메시지 처리
    }

}
