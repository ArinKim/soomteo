package com.soomteo.backend.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 채팅 기록 아이디 (PK)

    @Column(name = "user_id", nullable = false)
    private Long userId; // 사용자 아이디

    @Column(name = "friend_id", nullable = false)
    private Long friendId; // AI 친구 아이디

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // 채팅 내용

    @Column(name = "created_at", nullable = false)
    private java.time.LocalDateTime createdAt; // 채팅 시간

    @Column(name = "channel_type", nullable = false)
    private String channelType;   // CHAT / CALL -> 채팅 혹은 전화

    @Column(name = "message_type", nullable = false)
    private String messageType;   // USER / AI
}