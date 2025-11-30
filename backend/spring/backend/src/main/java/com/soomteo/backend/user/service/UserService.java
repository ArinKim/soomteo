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
     */
    @Transactional
    public User loginOrRegister(KakaoUserInfoResponse kakaoUser, String refreshToken, Integer refreshTokenExpiresIn) {
        Long kakaoId = kakaoUser.getId();

        return userRepository.findByKakaoId(kakaoId)
                .map(user -> {
                    // 기존 회원: 정보 업데이트
                    updateUserInfo(user, kakaoUser);
                    user.updateLastLogin();
                    user.updateRefreshToken(refreshToken, refreshTokenExpiresIn);  // 리프레시 토큰 저장

                    System.out.println("기존 회원 로그인: " + user.getNickname());
                    return userRepository.save(user);
                })
                .orElseGet(() -> {
                    // 신규 회원: 회원가입
                    User newUser = createUser(kakaoUser, refreshToken, refreshTokenExpiresIn);

                    System.out.println("신규 회원 가입: " + newUser.getNickname());
                    return userRepository.save(newUser);
                });
    }

    /**
     * 리프레시 토큰 포함하여 사용자 생성
     */
    private User createUser(KakaoUserInfoResponse kakaoUser, String refreshToken, Integer refreshTokenExpiresIn) {
        KakaoUserInfoResponse.KakaoAccount account = kakaoUser.getKakaoAccount();
        KakaoUserInfoResponse.Profile profile = account != null ? account.getProfile() : null;

        User user = User.builder()
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

        // 리프레시 토큰 설정
        user.updateRefreshToken(refreshToken, refreshTokenExpiresIn);

        return user;
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

    public User findByKakaoId(Long kakaoId) {
        return userRepository.findByKakaoId(kakaoId).orElse(null);
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }
}