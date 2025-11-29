package com.soomteo.backend.user.repository;

import com.soomteo.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // 카카오 ID로 사용자 찾기
    Optional<User> findByKakaoId(Long kakaoId);

    // 카카오 ID 존재 여부 확인
    boolean existsByKakaoId(Long kakaoId);
}