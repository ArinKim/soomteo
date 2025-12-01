package com.soomteo.backend.chat.repository;

import com.soomteo.backend.chat.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {

    // 채팅 목록 가져오기
    List<ChatMessageEntity> findByUserIdAndFriendIdAndChannelTypeOrderByCreatedAtAsc(Long userId, Long friendId, String channelType);

    // 최신 50개 채팅 내용 가져오기
    List<ChatMessageEntity> findTop50ByUserIdAndFriendIdAndChannelTypeOrderByCreatedAtDesc(Long userId, Long friendId, String channelType);
}
