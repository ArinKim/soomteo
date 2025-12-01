package com.soomteo.backend.friend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "friend")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK: users.id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // FK: character_type.id
    @Column(name = "character_type_id", nullable = false)
    private Long characterTypeId;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "status_message")
    private String statusMessage;

    // AI 캐릭터 프롬프트
    @Column(name = "prompt", columnDefinition = "TEXT")
    private String prompt;

    // 안부 메시지 기간/시간/횟수
    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "count")
    private Integer count;
}
