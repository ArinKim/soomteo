package com.soomteo.backend.oauth.controller;

import com.soomteo.backend.oauth.dto.IdTokenPayload;
import com.soomteo.backend.oauth.dto.KakaoTokenResponse;
import com.soomteo.backend.oauth.service.KakaoOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
public class OAuthController {

    private final KakaoOAuthService kakaoOAuthService;

    @Value("${kakao.javascript-key}")
    private String kakaoJavascriptKey;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @GetMapping("/api/v1/auth/kakao/callback")
    @ResponseBody
    public String kakaoCallback(@RequestParam("code") String code) {
        System.out.println("카카오 인가코드 = " + code);

        // 1. 토큰 요청
        KakaoTokenResponse tokenResponse = kakaoOAuthService.getAccessToken(code);

        System.out.println("=== 토큰 정보 ===");
        System.out.println("액세스 토큰 = " + tokenResponse.getAccessToken());
        System.out.println("토큰 타입 = " + tokenResponse.getTokenType());
        System.out.println("만료 시간 = " + tokenResponse.getExpiresIn() + "초");
        System.out.println("리프레시 토큰 = " + tokenResponse.getRefreshToken());
        System.out.println("스코프 = " + tokenResponse.getScope());

        // 2. ID 토큰 처리 (OpenID Connect 활성화 시에만 존재)
        StringBuilder result = new StringBuilder();
        result.append("토큰 발급 성공!\n\n");
        result.append("액세스 토큰: ").append(tokenResponse.getAccessToken()).append("\n");
        result.append("만료 시간: ").append(tokenResponse.getExpiresIn()).append("초\n\n");

        if (tokenResponse.getIdToken() != null) {
            System.out.println("\n=== ID 토큰 정보 ===");
            System.out.println("ID 토큰 (암호화됨) = " + tokenResponse.getIdToken());

            // ID 토큰 디코딩
            IdTokenPayload idTokenPayload = kakaoOAuthService.decodeIdToken(tokenResponse.getIdToken());

            System.out.println("\n=== ID 토큰 페이로드 ===");
            System.out.println("발급자(iss) = " + idTokenPayload.getIss());
            System.out.println("앱 키(aud) = " + idTokenPayload.getAud());
            System.out.println("사용자 ID(sub) = " + idTokenPayload.getSub());
            System.out.println("닉네임 = " + idTokenPayload.getNickname());
            System.out.println("프로필 이미지 = " + idTokenPayload.getPicture());
            System.out.println("이메일 = " + idTokenPayload.getEmail());

            result.append("=== ID 토큰 정보 ===\n");
            result.append("사용자 ID: ").append(idTokenPayload.getSub()).append("\n");
            result.append("닉네임: ").append(idTokenPayload.getNickname()).append("\n");
            result.append("이메일: ").append(idTokenPayload.getEmail()).append("\n");
            result.append("프로필 이미지: ").append(idTokenPayload.getPicture()).append("\n");
        } else {
            System.out.println("\nID 토큰이 없습니다. OpenID Connect를 활성화하세요.");
            result.append("\nID 토큰 없음 (OpenID Connect 비활성화 상태)\n");
        }

        return result.toString();
    }

    @GetMapping("/api/v1/auth/kakao/login")
    public String kakaoLogin(Model model) {
        model.addAttribute("kakaoJavascriptKey", kakaoJavascriptKey);
        model.addAttribute("kakaoRedirectUri", kakaoRedirectUri);
        return "oauth";
    }
}