package com.soomteo.backend.ai.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiTextChatRequest {

    private String user_id;
    private String message;
    private String persona_key;
}
