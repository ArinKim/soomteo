package com.soomteo.backend.friend.repository;

import com.soomteo.backend.friend.entity.FriendEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FriendRepository extends JpaRepository<FriendEntity, Long> {

    // 특정 유저의 친구 목록 (id 오름차순)
    List<FriendEntity> findByUserIdOrderByIdAsc(Long userId);
}
