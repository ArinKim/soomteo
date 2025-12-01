package com.soomteo.backend.user.service;

import com.soomteo.backend.oauth.dto.KakaoUserInfoResponse;
import com.soomteo.backend.user.entity.UsersDetail;
import com.soomteo.backend.user.repository.UserDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailService {
    private final UserDetailRepository userDetailRepository;

    /**
     * 카카오 로그인: 회원가입 또는 로그인 처리
     */
    @Transactional
    public UsersDetail loginOrRegister(KakaoUserInfoResponse kakaoUser, String refreshToken, Integer refreshTokenExpiresIn) {
        Long kakaoId = kakaoUser.getId();

        return userDetailRepository.findByKakaoId(kakaoId)
                .map(usersDetail -> {
                    // 기존 회원: 정보 업데이트
                    updateUserInfo(usersDetail, kakaoUser);
                    usersDetail.updateLastLogin();
                    usersDetail.updateRefreshToken(refreshToken, refreshTokenExpiresIn);  // 리프레시 토큰 저장


                    System.out.println("기존 회원 로그인: " + usersDetail.getNickname());
                    return userDetailRepository.save(usersDetail);
                })
                .orElseGet(() -> {
                    // 신규 회원: 회원가입
                    UsersDetail newUsersDetail = createUser(kakaoUser, refreshToken, refreshTokenExpiresIn);

                    // Do not auto-create or link Member from Kakao login.
                    // We intentionally leave the usersDetail.user null so client can perform general signup
                    // (ensures Kakao flow goes through the same registration UI and linking step).

                    System.out.println("신규 회원 가입: " + newUsersDetail.getNickname());
                    return userDetailRepository.save(newUsersDetail);
                });
    }

    /**
     * 리프레시 토큰 포함하여 사용자 생성
     */
    private UsersDetail createUser(KakaoUserInfoResponse kakaoUser, String refreshToken, Integer refreshTokenExpiresIn) {
        KakaoUserInfoResponse.KakaoAccount account = kakaoUser.getKakaoAccount();
        KakaoUserInfoResponse.Profile profile = account != null ? account.getProfile() : null;

        UsersDetail usersDetail = UsersDetail.builder()
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
        usersDetail.updateRefreshToken(refreshToken, refreshTokenExpiresIn);

        return usersDetail;
    }

    /**
     * 기존 사용자 정보 업데이트
     */
    private void updateUserInfo(UsersDetail usersDetail, KakaoUserInfoResponse kakaoUser) {
        KakaoUserInfoResponse.KakaoAccount account = kakaoUser.getKakaoAccount();
        KakaoUserInfoResponse.Profile profile = account != null ? account.getProfile() : null;

        usersDetail.updateInfo(
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

    public UsersDetail findByKakaoId(Long kakaoId) {
        return userDetailRepository.findByKakaoId(kakaoId).orElse(null);
    }

    public UsersDetail findById(Long id) {
        return userDetailRepository.findById(id).orElse(null);
    }

    @Transactional
    public UsersDetail save(UsersDetail usersDetail) {
        return userDetailRepository.save(usersDetail);
    }
}