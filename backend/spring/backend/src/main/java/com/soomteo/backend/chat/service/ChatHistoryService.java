package com.soomteo.backend.chat.service;

import com.soomteo.backend.chat.dto.ChatMessage;
import com.soomteo.backend.chat.entity.ChatMessageEntity;
import com.soomteo.backend.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatHistoryService {

    private final ChatMessageRepository chatMessageRepository;

    public void saveMessage(ChatMessage message) {
        if (message == null || message.getRoomId() == null) return;

        ChatMessageEntity entity = ChatMessageEntity.builder()
                .roomId(message.getRoomId())
                .senderId(message.getSenderId())
                .content(message.getContent())
                .type(message.getType().name())
                .timestamp(message.getTimestamp())
                .build();

        chatMessageRepository.save(entity);
    }

    public List<ChatMessage> findRecentMessages(String roomId, int limit) {
        List<ChatMessageEntity> latestDesc =
                chatMessageRepository.findTop50ByRoomIdOrderByTimestampDesc(roomId);

        if (latestDesc.isEmpty()) return Collections.emptyList();

        latestDesc.sort(Comparator.comparingLong(ChatMessageEntity::getTimestamp));

        if (latestDesc.size() > limit) {
            latestDesc = latestDesc.subList(latestDesc.size() - limit, latestDesc.size());
        }

        return latestDesc.stream()
                .map(this::toDto)
                .toList();
    }

    public List<ChatMessage> findAllByRoomId(String roomId) {
        return chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private ChatMessage toDto(ChatMessageEntity e) {
        return ChatMessage.builder()
                .roomId(e.getRoomId())
                .senderId(e.getSenderId())
                .content(e.getContent())
                .type(ChatMessage.MessageType.valueOf(e.getType()))
                .timestamp(e.getTimestamp())
                .build();
    }
}
