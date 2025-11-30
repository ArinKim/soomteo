package com.soomteo.backend.oauth.controller;

import com.soomteo.backend.oauth.dto.IdTokenPayload;
import com.soomteo.backend.oauth.dto.KakaoTokenResponse;
import com.soomteo.backend.oauth.dto.KakaoUserInfoResponse;
import com.soomteo.backend.oauth.service.KakaoOAuthService;
import com.soomteo.backend.user.entity.User;
import com.soomteo.backend.user.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
public class OAuthController {

    private final KakaoOAuthService kakaoOAuthService;
    private final UserService userService;

    @Value("${kakao.javascript-key}")
    private String kakaoJavascriptKey;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @GetMapping("/api/v1/auth/kakao/callback")
    public String kakaoCallback(@RequestParam("code") String code,
                                HttpServletResponse response,
                                Model model) {
        System.out.println("=== 카카오 로그인 시작 ===");
        System.out.println("인가코드 = " + code);

        // 1. 토큰 요청
        KakaoTokenResponse tokenResponse = kakaoOAuthService.getAccessToken(code);

        System.out.println("\n=== 토큰 정보 ===");
        System.out.println("액세스 토큰 = " + tokenResponse.getAccessToken());
        System.out.println("만료 시간 = " + tokenResponse.getExpiresIn() + "초");

        System.out.println("리프레시 토큰 = " + tokenResponse.getRefreshToken());
        System.out.println("만료 시간 = " + tokenResponse.getRefreshTokenExpiresIn() + "초");

        // 2. 사용자 정보 조회
        KakaoUserInfoResponse kakaoUser = kakaoOAuthService.getUserInfo(tokenResponse.getAccessToken());

        System.out.println("\n=== 카카오 사용자 정보 ===");
        System.out.println("회원번호 = " + kakaoUser.getId());

        if (kakaoUser.getKakaoAccount() != null && kakaoUser.getKakaoAccount().getProfile() != null) {
            System.out.println("닉네임 = " + kakaoUser.getKakaoAccount().getProfile().getNickname());
        }

        // 3. DB에 회원가입 또는 로그인 처리
        User user = userService.loginOrRegister(
                kakaoUser,
                tokenResponse.getRefreshToken(),
                tokenResponse.getRefreshTokenExpiresIn()
        );

        System.out.println("\n=== DB 저장 완료 ===");
        System.out.println("사용자 ID = " + user.getId());
        System.out.println("카카오 ID = " + user.getKakaoId());
        System.out.println("닉네임 = " + user.getNickname());
        System.out.println("이메일 = " + user.getEmail());
        System.out.println("가입 시각 = " + user.getCreatedAt());
        System.out.println("마지막 로그인 = " + user.getLastLoginAt());

        // 4. 액세스 토큰을 쿠키에 저장
        Cookie accessTokenCookie = new Cookie("kakao_access_token", tokenResponse.getAccessToken());
        accessTokenCookie.setHttpOnly(false);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(tokenResponse.getExpiresIn());
        response.addCookie(accessTokenCookie);

        // 5. 사용자 ID를 쿠키에 저장 (세션 관리용)
        Cookie userIdCookie = new Cookie("user_id", String.valueOf(user.getId()));
        userIdCookie.setHttpOnly(false);
        userIdCookie.setPath("/");
        userIdCookie.setMaxAge(tokenResponse.getExpiresIn());
        response.addCookie(userIdCookie);

        // 6. Model에 사용자 정보 담기
        model.addAttribute("userId", user.getId());
        model.addAttribute("kakaoId", user.getKakaoId());
        model.addAttribute("nickname", user.getNickname());
        model.addAttribute("email", getValueOrDefault(user.getEmail(), "미제공"));
        model.addAttribute("profileImage", user.getProfileImageUrl());
        model.addAttribute("ageRange", getValueOrDefault(user.getAgeRange(), "미제공"));
        model.addAttribute("gender", getValueOrDefault(user.getGender(), "미제공"));

        System.out.println("\n✅ 로그인 완료! 메인 페이지로 이동");

        return "main";
    }

    @GetMapping("/api/v1/auth/kakao/login")
    public String kakaoLogin(Model model) {
        model.addAttribute("kakaoJavascriptKey", kakaoJavascriptKey);
        model.addAttribute("kakaoRedirectUri", kakaoRedirectUri);
        return "login";
    }

    @GetMapping("/api/v1/auth/main")
    public String main(HttpServletRequest request, Model model) {
        // 쿠키에서 user_id 확인
        String userId = getCookieValue(request, "user_id");

        if (userId == null) {
            System.out.println("⚠️ 사용자 ID가 없습니다. 로그인 페이지로 리다이렉트");
            return "redirect:/api/v1/auth/kakao/login";
        }

        // DB에서 사용자 정보 조회
        User user = userService.findById(Long.parseLong(userId));

        if (user == null) {
            System.out.println("⚠️ 사용자를 찾을 수 없습니다. 로그인 페이지로 리다이렉트");
            return "redirect:/api/v1/auth/kakao/login";
        }

        // Model에 사용자 정보 담기
        model.addAttribute("userId", user.getId());
        model.addAttribute("kakaoId", user.getKakaoId());
        model.addAttribute("nickname", user.getNickname());
        model.addAttribute("email", getValueOrDefault(user.getEmail(), "미제공"));
        model.addAttribute("profileImage", user.getProfileImageUrl());
        model.addAttribute("ageRange", getValueOrDefault(user.getAgeRange(), "미제공"));
        model.addAttribute("gender", getValueOrDefault(user.getGender(), "미제공"));

        System.out.println("✅ 사용자 정보 확인 완료. 메인 페이지 표시");
        return "main";
    }

    /**
     * 토큰 갱신 API
     */
    @PostMapping("/api/v1/auth/token/refresh")
    @ResponseBody
    public String refreshToken(HttpServletRequest request, HttpServletResponse response) {
        try {
            String userId = getCookieValue(request, "user_id");
            if (userId == null) {
                return "사용자 ID가 없습니다.";
            }

            User user = userService.findById(Long.parseLong(userId));
            if (user == null || user.getRefreshToken() == null) {
                return "리프레시 토큰이 없습니다. 다시 로그인하세요.";
            }

            // 토큰 갱신 요청
            KakaoTokenResponse newTokens = kakaoOAuthService.refreshAccessToken(user.getRefreshToken());

            // DB에 새로운 리프레시 토큰 저장 (갱신된 경우)
            if (newTokens.getRefreshToken() != null) {
                user.updateRefreshToken(newTokens.getRefreshToken(), newTokens.getRefreshTokenExpiresIn());
                userService.save(user);
            }

            // 새로운 액세스 토큰을 쿠키에 저장
            Cookie accessTokenCookie = new Cookie("kakao_access_token", newTokens.getAccessToken());
            accessTokenCookie.setHttpOnly(false);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(newTokens.getExpiresIn());
            response.addCookie(accessTokenCookie);

            return "토큰 갱신 성공! 액세스 : " + newTokens.getAccessToken() + " 리프레시 : " + newTokens.getRefreshToken();
        } catch (Exception e) {
            return "토큰 갱신 실패: " + e.getMessage();
        }
    }

    @PostMapping("/api/v1/auth/kakao/logout")
    @ResponseBody
    public String logout(@RequestParam("accessToken") String accessToken,
                         HttpServletResponse response) {
        try {
            // 1. 카카오 로그아웃 API 호출
            Long kakaoId = kakaoOAuthService.logout(accessToken);

            System.out.println("로그아웃 성공: 카카오 ID = " + kakaoId);

            // 2. 쿠키 삭제
            Cookie accessTokenCookie = new Cookie("kakao_access_token", null);
            accessTokenCookie.setHttpOnly(false);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(0);
            response.addCookie(accessTokenCookie);

            Cookie userIdCookie = new Cookie("user_id", null);
            userIdCookie.setHttpOnly(false);
            userIdCookie.setPath("/");
            userIdCookie.setMaxAge(0);
            response.addCookie(userIdCookie);

            return "로그아웃 성공!";

        } catch (Exception e) {
            System.err.println("로그아웃 실패: " + e.getMessage());
            return "로그아웃 실패: " + e.getMessage();
        }
    }

    private String getValueOrDefault(String value, String defaultValue) {
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (name.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}