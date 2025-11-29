package com.soomteo.backend.user.service;

import com.soomteo.backend.oauth.dto.KakaoUserInfoResponse;
import com.soomteo.backend.user.entity.User;
import com.soomteo.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * 카카오 로그인: 회원가입 또는 로그인 처리
     * @param kakaoUser 카카오 사용자 정보
     * @return 저장된 User 엔티티
     */
    @Transactional
    public User loginOrRegister(KakaoUserInfoResponse kakaoUser) {
        Long kakaoId = kakaoUser.getId();

        // 1. 카카오 ID로 기존 회원 조회
        return userRepository.findByKakaoId(kakaoId)
                .map(user -> {
                    // 2-1. 기존 회원: 정보 업데이트 및 로그인 시각 갱신
                    updateUserInfo(user, kakaoUser);
                    user.updateLastLogin();

                    System.out.println("✅ 기존 회원 로그인: " + user.getNickname());
                    return userRepository.save(user);
                })
                .orElseGet(() -> {
                    // 2-2. 신규 회원: 회원가입
                    User newUser = createUser(kakaoUser);

                    System.out.println("🆕 신규 회원 가입: " + newUser.getNickname());
                    return userRepository.save(newUser);
                });
    }

    /**
     * 카카오 사용자 정보로 User 엔티티 생성
     */
    private User createUser(KakaoUserInfoResponse kakaoUser) {
        KakaoUserInfoResponse.KakaoAccount account = kakaoUser.getKakaoAccount();
        KakaoUserInfoResponse.Profile profile = account != null ? account.getProfile() : null;

        return User.builder()
                .kakaoId(kakaoUser.getId())
                .nickname(profile != null && profile.getNickname() != null
                        ? profile.getNickname()
                        : "카카오사용자" + kakaoUser.getId())
                .email(account != null ? account.getEmail() : null)
                .profileImageUrl(profile != null ? profile.getProfileImageUrl() : null)
                .thumbnailImageUrl(profile != null ? profile.getThumbnailImageUrl() : null)
                .ageRange(account != null ? account.getAgeRange() : null)
                .gender(account != null ? account.getGender() : null)
                .birthday(account != null ? account.getBirthday() : null)
                .birthyear(account != null ? account.getBirthyear() : null)
                .build();
    }

    /**
     * 기존 사용자 정보 업데이트
     */
    private void updateUserInfo(User user, KakaoUserInfoResponse kakaoUser) {
        KakaoUserInfoResponse.KakaoAccount account = kakaoUser.getKakaoAccount();
        KakaoUserInfoResponse.Profile profile = account != null ? account.getProfile() : null;

        user.updateInfo(
                profile != null ? profile.getNickname() : null,
                account != null ? account.getEmail() : null,
                profile != null ? profile.getProfileImageUrl() : null,
                profile != null ? profile.getThumbnailImageUrl() : null,
                account != null ? account.getAgeRange() : null,
                account != null ? account.getGender() : null,
                account != null ? account.getBirthday() : null,
                account != null ? account.getBirthyear() : null
        );
    }

    /**
     * 카카오 ID로 사용자 조회
     */
    public User findByKakaoId(Long kakaoId) {
        return userRepository.findByKakaoId(kakaoId)
                .orElse(null);
    }

    /**
     * ID로 사용자 조회
     */
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElse(null);
    }
}