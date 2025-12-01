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

    /**
     * 특정 유저의 친구 목록 조회
     * GET /api/friends/{userId}
     */
    @GetMapping("/{userId}")
    public List<FriendDto> getFriendsByUser(@PathVariable Long userId) {
        return friendService.getFriendsByUserId(userId);
    }

    /**
     * 친구 생성
     * POST /api/friends/{userId}
     */
    @PostMapping("/{userId}")
    public FriendDto createFriend(
            @PathVariable Long userId,
            @RequestBody FriendDto friendDto
    ) {
        return friendService.createFriend(userId, friendDto);
    }

    /**
     * 친구 수정
     * PUT /api/friends/{friendId}
     */
    @PutMapping("/{friendId}")
    public FriendDto updateFriend(
            @PathVariable Long friendId,
            @RequestBody FriendDto friendDto
    ) {
        return friendService.updateFriend(friendId, friendDto);
    }

    /**
     * 친구 삭제
     * DELETE /api/friends/{friendId}
     */
    @DeleteMapping("/{friendId}")
    public void deleteFriend(@PathVariable Long friendId) {
        friendService.deleteFriend(friendId);
    }
}
