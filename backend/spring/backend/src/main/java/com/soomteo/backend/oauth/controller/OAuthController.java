    package com.soomteo.backend.oauth.controller;

    import com.soomteo.backend.oauth.dto.MobileLoginRequest;
    import com.soomteo.backend.oauth.dto.KakaoTokenResponse;
    import com.soomteo.backend.oauth.dto.KakaoUserInfoResponse;
    import com.soomteo.backend.oauth.service.KakaoOAuthService;
    import com.soomteo.backend.user.entity.UsersDetail;
    import com.soomteo.backend.user.service.UserDetailService;
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
    import org.springframework.web.bind.annotation.RequestBody;
    import com.soomteo.backend.oauth.dto.MobileCodeRequest;

    @Controller
    @RequiredArgsConstructor
    public class OAuthController {

        private final KakaoOAuthService kakaoOAuthService;
        private final UserDetailService userDetailService;

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
            UsersDetail usersDetail = userDetailService.findByKakaoId(kakaoUser.getId());

            System.out.println("\n=== DB 조회 결과 ===");
            if (usersDetail != null) {
                System.out.println("사용자 ID = " + usersDetail.getId());
                System.out.println("카카오 ID = " + usersDetail.getKakaoId());
                System.out.println("닉네임 = " + usersDetail.getNickname());
                System.out.println("이메일 = " + usersDetail.getEmail());
                System.out.println("가입 시각 = " + usersDetail.getCreatedAt());
                System.out.println("마지막 로그인 = " + usersDetail.getLastLoginAt());
            } else {
                System.out.println("사용자 정보가 DB에 없습니다. 회원가입 단계로 유도합니다.");
            }

            // 4. 액세스 토큰을 쿠키에 저장
            Cookie accessTokenCookie = new Cookie("kakao_access_token", tokenResponse.getAccessToken());
            accessTokenCookie.setHttpOnly(false);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(tokenResponse.getExpiresIn());
            response.addCookie(accessTokenCookie);

            // 5. 사용자 ID를 쿠키에 저장 (세션 관리용) — DB에 존재할 때만
            if (usersDetail != null) {
                Cookie userIdCookie = new Cookie("user_id", String.valueOf(usersDetail.getId()));
                userIdCookie.setHttpOnly(false);
                userIdCookie.setPath("/");
                userIdCookie.setMaxAge(tokenResponse.getExpiresIn());
                response.addCookie(userIdCookie);
            }

            // 6. Model에 사용자 정보 담기
            if (usersDetail != null) {
                model.addAttribute("userId", usersDetail.getId());
                model.addAttribute("kakaoId", usersDetail.getKakaoId());
                model.addAttribute("nickname", usersDetail.getNickname());
                model.addAttribute("email", getValueOrDefault(usersDetail.getEmail(), "미제공"));
                model.addAttribute("profileImage", usersDetail.getProfileImageUrl());
                model.addAttribute("ageRange", getValueOrDefault(usersDetail.getAgeRange(), "미제공"));
                model.addAttribute("gender", getValueOrDefault(usersDetail.getGender(), "미제공"));
            } else {
                model.addAttribute("kakaoId", kakaoUser.getId());
                model.addAttribute("nickname", (kakaoUser.getKakaoAccount() != null && kakaoUser.getKakaoAccount().getProfile() != null) ? kakaoUser.getKakaoAccount().getProfile().getNickname() : "");
                model.addAttribute("email", (kakaoUser.getKakaoAccount() != null) ? kakaoUser.getKakaoAccount().getEmail() : "");
            }

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
            UsersDetail usersDetail = userDetailService.findById(Long.parseLong(userId));

            if (usersDetail == null) {
                System.out.println("⚠️ 사용자를 찾을 수 없습니다. 로그인 페이지로 리다이렉트");
                return "redirect:/api/v1/auth/kakao/login";
            }

            // Model에 사용자 정보 담기
            model.addAttribute("userId", usersDetail.getId());
            model.addAttribute("kakaoId", usersDetail.getKakaoId());
            model.addAttribute("nickname", usersDetail.getNickname());
            model.addAttribute("email", getValueOrDefault(usersDetail.getEmail(), "미제공"));
            model.addAttribute("profileImage", usersDetail.getProfileImageUrl());
            model.addAttribute("ageRange", getValueOrDefault(usersDetail.getAgeRange(), "미제공"));
            model.addAttribute("gender", getValueOrDefault(usersDetail.getGender(), "미제공"));

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

                UsersDetail usersDetail = userDetailService.findById(Long.parseLong(userId));
                if (usersDetail == null || usersDetail.getRefreshToken() == null) {
                    return "리프레시 토큰이 없습니다. 다시 로그인하세요.";
                }

                // 토큰 갱신 요청
                KakaoTokenResponse newTokens = kakaoOAuthService.refreshAccessToken(usersDetail.getRefreshToken());

                // DB에 새로운 리프레시 토큰 저장 (갱신된 경우)
                if (newTokens.getRefreshToken() != null) {
                    usersDetail.updateRefreshToken(newTokens.getRefreshToken(), newTokens.getRefreshTokenExpiresIn());
                    userDetailService.save(usersDetail);
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

        /**
         * 모바일 클라이언트에서 전달받은 액세스 토큰을 사용하여 서버에서 로그인/회원가입 처리
         * (모바일 앱이 직접 카카오 SDK로 액세스 토큰을 얻어 서버로 전달하는 경우 사용)
         */
        @PostMapping("/api/v1/auth/kakao/mobile")
        @ResponseBody
        public Object kakaoMobileLogin(@RequestBody MobileLoginRequest req, HttpServletResponse response) {
            try {
                String accessToken = req.getAccessToken();
                String refreshToken = req.getRefreshToken();
                Integer refreshTokenExpiresIn = req.getRefreshTokenExpiresIn();

                if (accessToken == null || accessToken.isEmpty()) {
                    return "accessToken is required";
                }

                // 1. 사용자 정보 조회
                KakaoUserInfoResponse kakaoUser = kakaoOAuthService.getUserInfo(accessToken);

                // 2. 확인: DB에 이미 usersDetail(카카오 프로필)이 있는지 확인
                UsersDetail usersDetail = userDetailService.findByKakaoId(kakaoUser.getId());

                // 3. 응답용 JSON 구성 및 쿠키 설정(옵션)
                Cookie accessTokenCookie = new Cookie("kakao_access_token", accessToken);
                accessTokenCookie.setHttpOnly(false);
                accessTokenCookie.setPath("/");
                // do not set maxAge here because token lifetime may not be known on server side
                response.addCookie(accessTokenCookie);

                if (usersDetail != null) {
                    Cookie userIdCookie = new Cookie("user_id", String.valueOf(usersDetail.getId()));
                    userIdCookie.setHttpOnly(false);
                    userIdCookie.setPath("/");
                    response.addCookie(userIdCookie);
                }

                java.util.Map<String, Object> result = new java.util.HashMap<>();
                if (usersDetail != null && usersDetail.getUser() != null) {
                    // A persisted usersDetail that already linked to user -> login result
                    result.put("needsSignup", false);
                    result.put("userId", usersDetail.getId());
                    result.put("memberId", usersDetail.getUser().getId());
                    result.put("kakaoId", usersDetail.getKakaoId());
                    result.put("nickname", usersDetail.getNickname());
                    result.put("email", getValueOrDefault(usersDetail.getEmail(), "미제공"));
                    result.put("profileImage", usersDetail.getProfileImageUrl());
                } else if (usersDetail != null) {
                    // persisted usersDetail but not linked yet -> ask client to complete signup
                    result.put("needsSignup", true);
                    result.put("userDetailId", usersDetail.getId());
                    result.put("kakaoId", usersDetail.getKakaoId());
                    result.put("nickname", usersDetail.getNickname());
                    result.put("email", getValueOrDefault(usersDetail.getEmail(), ""));
                    result.put("profileImage", usersDetail.getProfileImageUrl());
                } else {
                    // no usersDetail in DB -> return kakao payload and require signup
                    result.put("needsSignup", true);
                    result.put("kakaoId", kakaoUser.getId());
                    result.put("nickname", kakaoUser.getKakaoAccount() != null && kakaoUser.getKakaoAccount().getProfile() != null ? kakaoUser.getKakaoAccount().getProfile().getNickname() : null);
                    result.put("email", kakaoUser.getKakaoAccount() != null ? kakaoUser.getKakaoAccount().getEmail() : null);
                    result.put("profileImage", kakaoUser.getKakaoAccount() != null && kakaoUser.getKakaoAccount().getProfile() != null ? kakaoUser.getKakaoAccount().getProfile().getProfileImageUrl() : null);
                }

                return result;

            } catch (Exception e) {
                System.err.println("모바일 로그인 실패: " + e.getMessage());
                return "모바일 로그인 실패: " + e.getMessage();
            }
        }

        /**
         * 모바일 클라이언트에서 전달하는 인가 코드(code)를 받아 서버에서 액세스 토큰으로 교환하고 로그인 처리 후 JSON으로 반환합니다.
         * 이 방식은 모바일 앱이 브라우저 또는 AuthSession으로 Kakao 인증을 수행하여 code를 받고, 서버에 code를 전달하여 안전하게 토큰을 교환할 때 사용합니다.
         */
        @PostMapping("/api/v1/auth/kakao/mobile/code")
        @ResponseBody
        public Object kakaoMobileLoginWithCode(@RequestBody MobileCodeRequest req, HttpServletResponse response) {
            try {
                String code = req.getCode();

                if (code == null || code.isEmpty()) {
                    return "code is required";
                }

                    // 서버에서 인가 코드를 토큰으로 교환
                    String usedRedirectUri = req.getRedirectUri() != null && !req.getRedirectUri().isEmpty()
                        ? req.getRedirectUri()
                        : this.kakaoRedirectUri;

                    KakaoTokenResponse tokenResponse = kakaoOAuthService.getAccessToken(code, usedRedirectUri);

                // 사용자 정보 조회
                KakaoUserInfoResponse kakaoUser = kakaoOAuthService.getUserInfo(tokenResponse.getAccessToken());

                // DB에 회원가입 또는 로그인 처리
                UsersDetail usersDetail = userDetailService.findByKakaoId(kakaoUser.getId());

                // 응답 구성
                java.util.Map<String, Object> result = new java.util.HashMap<>();
                result.put("userId", usersDetail.getId());
                // Force the client to proceed through the general signup flow.
                result.put("needsSignup", true);
                result.put("userDetailId", usersDetail.getId());
                result.put("kakaoId", usersDetail.getKakaoId());
                result.put("nickname", usersDetail.getNickname());
                result.put("email", getValueOrDefault(usersDetail.getEmail(), ""));
                result.put("kakaoId", usersDetail.getKakaoId());
                result.put("nickname", usersDetail.getNickname());
                result.put("email", getValueOrDefault(usersDetail.getEmail(), "미제공"));
                result.put("profileImage", usersDetail.getProfileImageUrl());

                // (선택) 쿠키 저장
                Cookie accessTokenCookie = new Cookie("kakao_access_token", tokenResponse.getAccessToken());
                accessTokenCookie.setHttpOnly(false);
                accessTokenCookie.setPath("/");
                accessTokenCookie.setMaxAge(tokenResponse.getExpiresIn());
                response.addCookie(accessTokenCookie);

                Cookie userIdCookie = new Cookie("user_id", String.valueOf(usersDetail.getId()));
                userIdCookie.setHttpOnly(false);
                userIdCookie.setPath("/");
                userIdCookie.setMaxAge(tokenResponse.getExpiresIn());
                response.addCookie(userIdCookie);

                return result;

            } catch (Exception e) {
                System.err.println("모바일 코드 로그인 실패: " + e.getMessage());
                return "모바일 코드 로그인 실패: " + e.getMessage();
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