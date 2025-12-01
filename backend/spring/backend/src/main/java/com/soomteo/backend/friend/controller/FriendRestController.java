package com.soomteo.backend.friend.controller;

import com.soomteo.backend.friend.dto.FriendDto;
import com.soomteo.backend.friend.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendRestController {

    private final FriendService friendService;

    // /api/friends/1 이런 식으로 호출
    @GetMapping("/{userId}")
    public List<FriendDto> getFriendsByUser(@PathVariable Long userId) {
        return friendService.getFriendsByUserId(userId);
    }

    // 선택사항: 기존 /api/friends 도 테스트용으로 남기고 싶으면 이렇게 둬도 됨
    @GetMapping
    public List<FriendDto> getMyFriends() {
        return friendService.getFriendsByUserId(1L);   // 테스트용 userId=1 고정
    }
}
