package com.soomteo.backend.oauth.service;

import com.soomteo.backend.oauth.dto.IdTokenPayload;
import com.soomteo.backend.oauth.dto.KakaoTokenResponse;
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
        String url = "https://kauth.kakao.com/oauth/token";

        // 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.add("charset", "utf-8");

        // 바디 설정 (필수 파라미터)
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);
        params.add("client_secret", clientSecret);

        // 요청 보내기
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
     * ID 토큰 디코딩 (페이로드 추출)
     * ID 토큰은 JWT 형식: header.payload.signature
     */
    public IdTokenPayload decodeIdToken(String idToken) {
        try {
            String[] parts = idToken.split("\\.");

            if (parts.length != 3) {
                throw new IllegalArgumentException("유효하지 않은 ID 토큰 형식");
            }

            // 페이로드 부분 (두 번째 부분) 디코딩
            String payload = parts[1];
            byte[] decodedBytes = Base64.getUrlDecoder().decode(payload);
            String decodedPayload = new String(decodedBytes);

            // JSON을 객체로 변환
            return objectMapper.readValue(decodedPayload, IdTokenPayload.class);

        } catch (Exception e) {
            System.err.println("ID 토큰 디코딩 실패: " + e.getMessage());
            throw new RuntimeException("ID 토큰 디코딩 실패", e);
        }
    }
}