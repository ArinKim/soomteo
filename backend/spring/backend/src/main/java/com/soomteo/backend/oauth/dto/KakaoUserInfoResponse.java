package com.soomteo.backend.oauth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class KakaoUserInfoResponse {

    private Long id;  // 회원번호

    @JsonProperty("connected_at")
    private LocalDateTime connectedAt;  // 서비스 연결 시각

    @JsonProperty("kakao_account")
    private KakaoAccount kakaoAccount;  // 카카오계정 정보

    @JsonProperty("properties")
    private Properties properties;  // 사용자 프로퍼티

    @Getter
    @NoArgsConstructor
    public static class KakaoAccount {

        @JsonProperty("profile_needs_agreement")
        private Boolean profileNeedsAgreement;

        private Profile profile;  // 프로필 정보

        @JsonProperty("email_needs_agreement")
        private Boolean emailNeedsAgreement;

        @JsonProperty("is_email_valid")
        private Boolean isEmailValid;

        @JsonProperty("is_email_verified")
        private Boolean isEmailVerified;

        private String email;  // 이메일

        @JsonProperty("name_needs_agreement")
        private Boolean nameNeedsAgreement;

        private String name;  // 이름

        @JsonProperty("age_range_needs_agreement")
        private Boolean ageRangeNeedsAgreement;

        @JsonProperty("age_range")
        private String ageRange;  // 연령대

        @JsonProperty("birthday_needs_agreement")
        private Boolean birthdayNeedsAgreement;

        private String birthday;  // 생일 (MMDD)

        @JsonProperty("birthyear_needs_agreement")
        private Boolean birthyearNeedsAgreement;

        private String birthyear;  // 출생 연도 (YYYY)

        @JsonProperty("gender_needs_agreement")
        private Boolean genderNeedsAgreement;

        private String gender;  // 성별

        @JsonProperty("phone_number_needs_agreement")
        private Boolean phoneNumberNeedsAgreement;

        @JsonProperty("phone_number")
        private String phoneNumber;  // 전화번호
    }

    @Getter
    @NoArgsConstructor
    public static class Profile {

        private String nickname;  // 닉네임

        @JsonProperty("thumbnail_image_url")
        private String thumbnailImageUrl;  // 프로필 미리보기 이미지 (110px)

        @JsonProperty("profile_image_url")
        private String profileImageUrl;  // 프로필 사진 (640px)

        @JsonProperty("is_default_image")
        private Boolean isDefaultImage;  // 기본 프로필 사진 여부

        @JsonProperty("is_default_nickname")
        private Boolean isDefaultNickname;  // 기본 닉네임 여부
    }

    @Getter
    @NoArgsConstructor
    public static class Properties {
        private String nickname;

        @JsonProperty("profile_image")
        private String profileImage;

        @JsonProperty("thumbnail_image")
        private String thumbnailImage;
    }
}
