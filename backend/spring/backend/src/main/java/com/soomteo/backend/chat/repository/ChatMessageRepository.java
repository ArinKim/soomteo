package com.soomteo.backend.chat.repository;

import com.soomteo.backend.chat.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {

    List<ChatMessageEntity> findByRoomIdOrderByTimestampAsc(String roomId);

    List<ChatMessageEntity> findTop50ByRoomIdOrderByTimestampDesc(String roomId);
}
