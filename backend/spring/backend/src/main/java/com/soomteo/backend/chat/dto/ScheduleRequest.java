package com.soomteo.backend.chat.dto;

import lombok.Data;

@Data
public class ScheduleRequest {
    private String roomId;
    private String startTime;   // "HH:mm"
    private String endTime;     // "HH:mm"
    private int countPerDay;
    private int minIntervalHours;
}
