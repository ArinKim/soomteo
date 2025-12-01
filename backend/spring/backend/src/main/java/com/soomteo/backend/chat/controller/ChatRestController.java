// src/main/java/com/soomteo/backend/chat/controller/ChatRestController.java
package com.soomteo.backend.chat.controller;

import com.soomteo.backend.chat.dto.ChatMessage;
import com.soomteo.backend.chat.service.ChatHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatHistoryService chatHistoryService;

    @GetMapping("/history/{roomId}")
    public List<ChatMessage> getHistory(@PathVariable String roomId) {
        System.out.println("roomId = " + roomId);
        return chatHistoryService.findAllByRoomId(roomId);
    }
}
