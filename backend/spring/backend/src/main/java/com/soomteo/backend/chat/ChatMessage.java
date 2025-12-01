package com.soomteo.backend.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    private String roomId;      // 방 ID
    private String senderId;    // 보낸 사람 ID
    private String senderName;  // 보낸 사람 이름
    private String content;     // 메시지 내용
    private long   timestamp;   // 보낸 시각 (ms)
}
