package com.soomteo.backend.oauth.controller;

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

        // 토큰 요청
        KakaoTokenResponse tokenResponse = kakaoOAuthService.getAccessToken(code);

        System.out.println("액세스 토큰 = " + tokenResponse.getAccessToken());
        System.out.println("토큰 타입 = " + tokenResponse.getTokenType());
        System.out.println("만료 시간 = " + tokenResponse.getExpiresIn() + "초");
        System.out.println("리프레시 토큰 = " + tokenResponse.getRefreshToken());
        System.out.println("스코프 = " + tokenResponse.getScope());

        return "토큰 발급 성공!\n" +
                "액세스 토큰: " + tokenResponse.getAccessToken() + "\n" +
                "만료 시간: " + tokenResponse.getExpiresIn() + "초";
    }

    @GetMapping("/api/v1/auth/kakao/login")
    public String kakaoLogin(Model model) {
        model.addAttribute("kakaoJavascriptKey", kakaoJavascriptKey);
        model.addAttribute("kakaoRedirectUri", kakaoRedirectUri);
        return "oauth";
    }

}