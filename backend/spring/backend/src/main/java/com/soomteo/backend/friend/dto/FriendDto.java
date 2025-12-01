package com.soomteo.backend.friend.dto;

import com.soomteo.backend.friend.entity.FriendEntity;
import lombok.*;

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

    // 엔티티 → DTO 변환
    public static FriendDto from(FriendEntity friend) {
        return FriendDto.builder()
                .id(friend.getId())
                .name(friend.getName())
                .statusMessage(friend.getStatusMessage())
                .profileImageUrl(friend.getProfileImageUrl())
                .characterTypeId(friend.getCharacterTypeId())
                .prompt(friend.getPrompt())
                .build();
    }
}
