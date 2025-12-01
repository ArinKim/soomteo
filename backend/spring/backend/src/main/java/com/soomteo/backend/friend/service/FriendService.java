package com.soomteo.backend.friend.service;

import com.soomteo.backend.friend.dto.FriendDto;
import com.soomteo.backend.friend.entity.FriendEntity;
import com.soomteo.backend.friend.repository.FriendRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRepository friendRepository;

    // TODO. 로그인 붙기 전까지는 userId = 1 고정
    private static final Long TEST_USER_ID = 1L;

    public List<FriendDto> getFriendsByUserId(Long userId) {

        List<FriendEntity> list = friendRepository.findByUserIdOrderByIdAsc(userId);

        return list.stream()
                .map(f -> FriendDto.builder()
                        .id(f.getId())
                        .name(f.getName())
                        .statusMessage(f.getStatusMessage())    // ★ status() 아님
                        .profileImageUrl(f.getProfileImageUrl())
                        .characterTypeId(f.getCharacterTypeId())
                        .prompt(f.getPrompt())
                        .build()
                )
                .toList();   // 이제 정확히 FriendDto 로 추론됨
    }

    public List<FriendDto> getMyFriends() {
        List<FriendEntity> list = friendRepository.findByUserIdOrderByIdAsc(TEST_USER_ID);

        return list.stream()
                .map(f -> FriendDto.builder()
                        .id(f.getId())
                        .name(f.getName())
                        .statusMessage(f.getStatusMessage())
                        .profileImageUrl(f.getProfileImageUrl())
                        .characterTypeId(f.getCharacterTypeId())
                        .prompt(f.getPrompt())
                        .build()
                )
                .collect(Collectors.toList());
    }

    public FriendEntity getFriendById(Long friendId) {
        return friendRepository.findById(friendId)
                .orElse(null);
    }
}
