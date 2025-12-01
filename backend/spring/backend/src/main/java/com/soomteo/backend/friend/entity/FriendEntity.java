package com.soomteo.backend.friend.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "character_type_id", nullable = false)
    private Long characterTypeId;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "status_message")
    private String statusMessage;

    @Column(name = "prompt")
    private String prompt;
}
