package com.soomteo.backend.user.repository;

import com.soomteo.backend.user.entity.UsersDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserDetailRepository extends JpaRepository<UsersDetail, Long> {

    // 카카오 ID로 사용자 찾기
    Optional<UsersDetail> findByKakaoId(Long kakaoId);

    // 카카오 ID 존재 여부 확인
    boolean existsByKakaoId(Long kakaoId);
}