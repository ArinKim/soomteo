package com.soomteo.backend.chat.service;

import com.soomteo.backend.chat.dto.ChatMessage;
import com.soomteo.backend.chat.entity.ChatMessageEntity;
import com.soomteo.backend.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.ZoneId;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatHistoryService {

    private final ChatMessageRepository chatMessageRepository;

    // TODO: 로그인 붙으면 SecurityContext에서 현재 유저 id 가져오기
    private static final Long TEST_USER_ID = 1L;  // 임시용
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    public void saveMessage(ChatMessage message) {
        if (message == null || message.getRoomId() == null) return;

        Long friendId = Long.valueOf(message.getRoomId());

//        Long userId;
        Long userId = TEST_USER_ID;
        String msgType;
        if (message.getType() == ChatMessage.MessageType.USER) {
            // 유저가 보낸 메세지
//            userId = Long.valueOf(message.getSenderId());  // ex) "1"
            msgType = "USER";
        } else {
            // AI 메세지는 userId를 현재 사용자(테스트)로 고정
//            userId = TEST_USER_ID;
            msgType = "AI";
        }

        java.time.LocalDateTime createdAt =
                java.time.Instant.ofEpochMilli(message.getTimestamp())
                        .atZone(ZONE)
                        .toLocalDateTime();

        ChatMessageEntity entity = ChatMessageEntity.builder()
                .userId(userId)
                .friendId(friendId)
                .content(message.getContent())
                .createdAt(createdAt)
                .channelType("CHAT")                     // 지금은 채팅만 사용
                .messageType(msgType)                    // USER / AI
                .build();

        chatMessageRepository.save(entity);
    }

    public List<ChatMessage> findRecentMessages(String roomId, int limit) {
        Long friendId = Long.valueOf(roomId);
        Long userId = TEST_USER_ID;  // 임시: 현재 유저 id

        List<ChatMessageEntity> latestDesc =
                chatMessageRepository
                        .findTop50ByUserIdAndFriendIdAndChannelTypeOrderByCreatedAtDesc(
                                userId, friendId, "CHAT"
                        );

        if (latestDesc.isEmpty()) return Collections.emptyList();

        latestDesc.sort(Comparator.comparing(ChatMessageEntity::getCreatedAt));

        if (latestDesc.size() > limit) {
            latestDesc = latestDesc.subList(latestDesc.size() - limit, latestDesc.size());
        }

        return latestDesc.stream()
                .map(this::toDto)
                .toList();
    }

    public List<ChatMessage> findAllByRoomId(String roomId) {
        Long friendId = Long.valueOf(roomId);
        Long userId = TEST_USER_ID;  // 임시

        return chatMessageRepository
                .findByUserIdAndFriendIdAndChannelTypeOrderByCreatedAtAsc(userId, friendId, "CHAT")
                .stream()
                .map(this::toDto)
                .toList();
    }

    private ChatMessage toDto(ChatMessageEntity e) {

        ChatMessage.MessageType dtoType =
                "USER".equalsIgnoreCase(e.getMessageType())
                        ? ChatMessage.MessageType.USER
                        : ChatMessage.MessageType.AI;

        long ts = e.getCreatedAt()
                .atZone(ZONE)
                .toInstant()
                .toEpochMilli();

        return ChatMessage.builder()
                .roomId(String.valueOf(e.getFriendId()))
                .senderId(dtoType == ChatMessage.MessageType.USER
                        ? String.valueOf(e.getUserId())
                        : "AI")
                .content(e.getContent())
                .type(dtoType)     // ★ 반드시 이 필드로 내려가야 함
                .timestamp(ts)
                .build();
    }

}
