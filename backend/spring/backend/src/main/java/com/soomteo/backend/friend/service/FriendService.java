package com.soomteo.backend.friend.service;

import com.soomteo.backend.chat.service.ScheduledChatService;
import com.soomteo.backend.friend.dto.FriendDto;
import com.soomteo.backend.friend.entity.FriendEntity;
import com.soomteo.backend.friend.repository.FriendRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRepository friendRepository;
    private final ScheduledChatService scheduledChatService;

    /**
     * 특정 유저의 친구 목록 조회
     */
    public List<FriendDto> getFriendsByUserId(Long userId) {
        List<FriendEntity> list = friendRepository.findByUserIdOrderByIdAsc(userId);
        return list.stream()
                .map(FriendDto::from)
                .toList();
    }

    /**
     * 친구 생성 + 스케줄 등록
     */
    public FriendDto createFriend(Long userId, FriendDto dto) {

        FriendEntity entity = FriendEntity.builder()
                .userId(userId)
                .characterTypeId(dto.getCharacterTypeId())
                .name(dto.getName())
                .profileImageUrl(dto.getProfileImageUrl())
                .statusMessage(dto.getStatusMessage())
                .prompt(dto.getPrompt())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .count(dto.getCount())
                .build();

        FriendEntity saved = friendRepository.save(entity);

        // userId, friendId 순서 주의!
        scheduledChatService.upsertScheduleForFriend(
                saved.getUserId(),
                saved.getId(),
                saved.getStartDate(),
                saved.getEndDate(),
                saved.getStartTime(),
                saved.getEndTime(),
                saved.getCount()
        );

        return FriendDto.from(saved);
    }

    /**
     * 친구 수정 + 스케줄 갱신
     */
    public FriendDto updateFriend(Long friendId, FriendDto dto) {
        FriendEntity friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("friend not found: " + friendId));

        friend.setName(dto.getName());
        friend.setProfileImageUrl(dto.getProfileImageUrl());
        friend.setStatusMessage(dto.getStatusMessage());
        friend.setPrompt(dto.getPrompt());
        friend.setCharacterTypeId(dto.getCharacterTypeId());
        friend.setStartDate(dto.getStartDate());
        friend.setEndDate(dto.getEndDate());
        friend.setStartTime(dto.getStartTime());
        friend.setEndTime(dto.getEndTime());
        friend.setCount(dto.getCount());

        FriendEntity saved = friendRepository.save(friend);

        scheduledChatService.upsertScheduleForFriend(
                saved.getUserId(),
                saved.getId(),
                saved.getStartDate(),
                saved.getEndDate(),
                saved.getStartTime(),
                saved.getEndTime(),
                saved.getCount()
        );

        return FriendDto.from(saved);
    }

    /**
     * 친구 삭제 + 해당 친구 스케줄 삭제
     */
    public void deleteFriend(Long friendId) {
        friendRepository.deleteById(friendId);
        scheduledChatService.deleteScheduleForFriend(friendId);
    }

    /**
     * AI 채팅에서 프롬프트용으로 쓰는 친구 조회
     */
    public FriendEntity getFriendById(Long friendId) {
        return friendRepository.findById(friendId).orElse(null);
    }
}
