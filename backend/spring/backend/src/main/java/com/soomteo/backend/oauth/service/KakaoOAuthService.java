package com.soomteo.backend.oauth.service;

import com.soomteo.backend.oauth.dto.IdTokenPayload;
import com.soomteo.backend.oauth.dto.KakaoLogoutResponse;
import com.soomteo.backend.oauth.dto.KakaoTokenResponse;
import com.soomteo.backend.oauth.dto.KakaoUserInfoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class KakaoOAuthService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${kakao.client-id}")
    private String clientId;

    @Value("${kakao.client-secret}")
    private String clientSecret;

    @Value("${kakao.redirect-uri}")
    private String redirectUri;

    /**
     * 인가 코드로 액세스 토큰 요청
     */
    public KakaoTokenResponse getAccessToken(String code) {
        // 기존 기본 redirectUri를 사용하는 기존 동작 유지
        return getAccessToken(code, this.redirectUri);
    }

    /**
     * 인가 코드로 액세스 토큰 요청 (redirectUri를 명시적으로 전달할 수 있음)
     */
    public KakaoTokenResponse getAccessToken(String code, String usedRedirectUri) {
        String url = "https://kauth.kakao.com/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.add("charset", "utf-8");

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("redirect_uri", usedRedirectUri);
        params.add("code", code);
        params.add("client_secret", clientSecret);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<KakaoTokenResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    KakaoTokenResponse.class
            );

            return response.getBody();

        } catch (Exception e) {
            System.err.println("카카오 토큰 요청 실패: " + e.getMessage());
            throw new RuntimeException("카카오 토큰 요청 실패", e);
        }
    }

    /**
     * 리프레시 토큰으로 액세스 토큰 갱신
     */
    public KakaoTokenResponse refreshAccessToken(String refreshToken) {
        String url = "https://kauth.kakao.com/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.add("charset", "utf-8");

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("client_id", clientId);
        params.add("refresh_token", refreshToken);
        params.add("client_secret", clientSecret);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            System.out.println("토큰 갱신 시도 !! : " + refreshToken);
            ResponseEntity<KakaoTokenResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    KakaoTokenResponse.class
            );

            System.out.println("토큰 갱신 성공! 액세스 : " + response.getBody().getAccessToken() + " 리프레시 : " + response.getBody().getRefreshToken());
            return response.getBody();

        } catch (Exception e) {
            System.err.println("토큰 갱신 실패: " + e.getMessage());
            throw new RuntimeException("토큰 갱신 실패", e);
        }
    }

    /**
     * ID 토큰 디코딩
     */
    public IdTokenPayload decodeIdToken(String idToken) {
        try {
            String[] parts = idToken.split("\\.");

            if (parts.length != 3) {
                throw new IllegalArgumentException("유효하지 않은 ID 토큰 형식");
            }

            String payload = parts[1];
            byte[] decodedBytes = Base64.getUrlDecoder().decode(payload);
            String decodedPayload = new String(decodedBytes);

            return objectMapper.readValue(decodedPayload, IdTokenPayload.class);

        } catch (Exception e) {
            System.err.println("ID 토큰 디코딩 실패: " + e.getMessage());
            throw new RuntimeException("ID 토큰 디코딩 실패", e);
        }
    }

    /**
     * 사용자 정보 조회
     */
    public KakaoUserInfoResponse getUserInfo(String accessToken) {
        String url = "https://kapi.kakao.com/v2/user/me";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Bearer " + accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<KakaoUserInfoResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    request,
                    KakaoUserInfoResponse.class
            );

            return response.getBody();

        } catch (Exception e) {
            System.err.println("카카오 사용자 정보 조회 실패: " + e.getMessage());
            throw new RuntimeException("카카오 사용자 정보 조회 실패", e);
        }
    }

    /**
     * 카카오 로그아웃
     */
    public Long logout(String accessToken) {
        String url = "https://kapi.kakao.com/v1/user/logout";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Bearer " + accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<KakaoLogoutResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    KakaoLogoutResponse.class
            );

            KakaoLogoutResponse logoutResponse = response.getBody();
            return logoutResponse != null ? logoutResponse.getId() : null;

        } catch (Exception e) {
            System.err.println("카카오 로그아웃 실패: " + e.getMessage());
            throw new RuntimeException("카카오 로그아웃 실패", e);
        }
    }
}