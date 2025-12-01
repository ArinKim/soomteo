package com.soomteo.backend.user.entity;

import jakarta.persistence.*;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "usersDetail")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsersDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long kakaoId;  // 카카오 회원번호 (고유 식별자)

    @Column(nullable = false)
    private String nickname;  // 닉네임

    @Column
    private String email;  // 이메일 (선택)

    @Column
    private String profileImageUrl;  // 프로필 이미지 URL

    @Column
    private String thumbnailImageUrl;  // 썸네일 이미지 URL

    @Setter
    @OneToOne
    @JoinColumn(name = "user_id")
    private Member user; // reference to the main `users` table (app user)

    @Column
    private String ageRange;  // 연령대

    @Column
    private String gender;  // 성별

    @Column
    private String birthday;  // 생일 (MMDD)

    @Column
    private String birthyear;  // 출생연도 (YYYY)

    @Column(length = 500)
    private String refreshToken;

    @Column
    private LocalDateTime refreshTokenExpiresAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;  // 가입 시각

    @Column(nullable = false)
    private LocalDateTime updatedAt;  // 정보 업데이트 시각

    @Column
    private LocalDateTime lastLoginAt;  // 마지막 로그인 시각

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        lastLoginAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 정보 업데이트 메서드
    public void updateInfo(String nickname, String email, String profileImageUrl,
                           String thumbnailImageUrl, String ageRange, String gender,
                           String birthday, String birthyear) {
        if (nickname != null) this.nickname = nickname;
        if (email != null) this.email = email;
        if (profileImageUrl != null) this.profileImageUrl = profileImageUrl;
        if (thumbnailImageUrl != null) this.thumbnailImageUrl = thumbnailImageUrl;
        if (ageRange != null) this.ageRange = ageRange;
        if (gender != null) this.gender = gender;
        if (birthday != null) this.birthday = birthday;
        if (birthyear != null) this.birthyear = birthyear;
        // when email is updated we won't auto-create a Member; linking happens in service/controller
    }

    // 로그인 시각 업데이트
    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    // 리프레시 토큰 업데이트
    public void updateRefreshToken(String refreshToken, Integer expiresIn) {
        this.refreshToken = refreshToken;
        if (expiresIn != null) {
            this.refreshTokenExpiresAt = LocalDateTime.now().plusSeconds(expiresIn);
        }
    }
}