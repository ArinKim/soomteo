package com.soomteo.backend.oauth.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class IdTokenPayload {

    private String iss;  // 발급자 (https://kauth.kakao.com)

    private String aud;  // 앱 키

    private String sub;  // 사용자 회원번호

    private Long iat;  // 발급 시각

    private Long exp;  // 만료 시각

    @JsonProperty("auth_time")
    private Long authTime;  // 인증 완료 시각

    private String nonce;  // nonce 값 (있는 경우)

    private String nickname;  // 닉네임

    private String picture;  // 프로필 이미지 URL

    private String email;  // 이메일
}