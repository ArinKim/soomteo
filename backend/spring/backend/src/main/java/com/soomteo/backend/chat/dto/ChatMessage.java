package com.soomteo.backend.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    public enum MessageType {
        USER, AI, ASSIST, SYSTEM
    }

    private String roomId;      // 채팅방 id
    private String senderId;    // 보낸 사람 -> ai 모델별 아이디
    private String content;     // 내용
    private MessageType type;   // USER / ASSIST / SYSTEM
    private Long timestamp;
}
