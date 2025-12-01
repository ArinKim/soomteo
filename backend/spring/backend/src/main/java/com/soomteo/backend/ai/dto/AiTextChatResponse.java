package com.soomteo.backend.ai.dto;

import lombok.Data;

import java.util.Map;

@Data
public class AiTextChatResponse {

    private String bot_response;
    private String emotion;
    private String crisis_level;
    private String persona;
    private String channel;
    private int turn_index;
    private Map<String, Object> safety_event;
}
