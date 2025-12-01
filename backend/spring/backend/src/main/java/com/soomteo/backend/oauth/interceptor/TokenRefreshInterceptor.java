package com.soomteo.backend.oauth.interceptor;

import com.soomteo.backend.oauth.service.KakaoOAuthService;
import com.soomteo.backend.user.entity.UsersDetail;
import com.soomteo.backend.user.service.UserDetailService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class TokenRefreshInterceptor implements HandlerInterceptor {

    private final KakaoOAuthService kakaoOAuthService;
    private final UserDetailService userDetailService;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        // 액세스 토큰 확인
        String accessToken = getCookieValue(request, "kakao_access_token");

        if (accessToken != null) {
            // 토큰 유효성 검사
            try {
                kakaoOAuthService.getUserInfo(accessToken);
                return true; // 유효하면 계속 진행

            } catch (Exception e) {
                // 토큰 만료 시 자동 갱신
                System.out.println("⚠️ 액세스 토큰 만료. 자동 갱신 시작...");

                String userId = getCookieValue(request, "user_id");
                if (userId != null) {
                    UsersDetail usersDetail = userDetailService.findById(Long.parseLong(userId));

                    if (usersDetail != null && usersDetail.getRefreshToken() != null) {
                        try {
                            var newTokens = kakaoOAuthService.refreshAccessToken(usersDetail.getRefreshToken());

                            // ✅ 새 리프레시 토큰이 있으면 DB 업데이트
                            if (newTokens.getRefreshToken() != null) {
                                usersDetail.updateRefreshToken(newTokens.getRefreshToken(), newTokens.getRefreshTokenExpiresIn());
                                userDetailService.save(usersDetail);
                            }

                            // 새 액세스 토큰 쿠키에 저장
                            Cookie cookie = new Cookie("kakao_access_token", newTokens.getAccessToken());
                            cookie.setPath("/");
                            cookie.setMaxAge(newTokens.getExpiresIn());
                            response.addCookie(cookie);

                            System.out.println("✅ 토큰 자동 갱신 성공");

                            return true;
                        } catch (Exception refreshError) {
                            System.err.println("❌ 토큰 갱신 실패");
                        }
                    }
                }

                // 갱신 실패 시 로그인 페이지로
                response.sendRedirect("/api/v1/auth/kakao/login");
                return false;
            }
        }

        return true;
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