package com.soomteo.backend.oauth.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 모바일 앱에서 전달하는 인가 코드(authorization code)를 받기 위한 DTO
 * 모바일 앱은 브라우저 또는 AuthSession으로 Kakao 인증을 수행한 뒤
 * redirect로 받은 code 값을 이 API로 전달하면 서버가 토큰 교환 후 로그인 처리합니다.
 */
@Getter
@NoArgsConstructor
public class MobileCodeRequest {
    private String code;
    // OAuth authorization code을 발급받을 때 사용한 redirect URI
    // mobile 앱(예: expo-auth-session)에서 authorization request가 사용한 redirectUri를
    // 서버에서 토큰 교환 시 동일하게 사용해야 하는 경우가 있어 이 필드를 전달할 수 있습니다.
    private String redirectUri;
}
