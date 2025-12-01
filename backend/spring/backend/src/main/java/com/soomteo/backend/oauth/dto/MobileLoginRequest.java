package com.soomteo.backend.oauth.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MobileLoginRequest {
    private String accessToken;
    private String refreshToken;
    private Integer refreshTokenExpiresIn;
}
