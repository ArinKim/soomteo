package com.soomteo.backend.chat.entity;

import jakarta.persistence.*;
import lombok.*;

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
    private Long id; // 채팅 기록 아이디

    private String roomId; // 채팅방 아이디
    private String senderId; // 보낸 사람 아이디

    @Column(columnDefinition = "TEXT")
    private String content; // 채팅 내용

    private String type;      // "USER", "ASSIST", "SYSTEM"
    private Long timestamp;
}