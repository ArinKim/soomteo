package com.soomteo.backend.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SignUpRequest {
    private String email;
    private String name;
    private Integer age;
    private String gender;
    private String guardianPhone;
    private String profileImageUrl;
    private String password;
    private Long kakaoId;
    private String thumbnailImageUrl;

    // if coming from Kakao flow, can include userDetailId to link
    private Long userDetailId;
}
