package com.soomteo.backend.friend.repository;

import com.soomteo.backend.friend.entity.FriendEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FriendRepository extends JpaRepository<FriendEntity, Long> {

    // 특정 유저의 친구(AI 캐릭터) 목록
    List<FriendEntity> findByUserIdOrderByIdAsc(Long userId);

    // user_id 컬럼 기준으로 친구 목록 조회
    List<FriendEntity> findByUserId(Long userId);
}
