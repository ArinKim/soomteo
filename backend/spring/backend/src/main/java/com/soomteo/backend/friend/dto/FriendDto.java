package com.soomteo.backend.friend.dto;

import com.soomteo.backend.friend.entity.FriendEntity;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendDto {

    private Long id;
    private String name;
    private String statusMessage;
    private String profileImageUrl;
    private Long characterTypeId;
    private String prompt;

    // 안부 스케줄 관련 필드
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer count;

    // 엔티티 → DTO 변환
    public static FriendDto from(FriendEntity friend) {
        if (friend == null) return null;

        return FriendDto.builder()
                .id(friend.getId())
                .name(friend.getName())
                .statusMessage(friend.getStatusMessage())
                .profileImageUrl(friend.getProfileImageUrl())
                .characterTypeId(friend.getCharacterTypeId())
                .prompt(friend.getPrompt())
                .startDate(friend.getStartDate())
                .endDate(friend.getEndDate())
                .startTime(friend.getStartTime())
                .endTime(friend.getEndTime())
                .count(friend.getCount())
                .build();
    }
}
