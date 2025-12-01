package com.soomteo.backend.config;

import com.soomteo.backend.oauth.interceptor.TokenRefreshInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final TokenRefreshInterceptor tokenRefreshInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tokenRefreshInterceptor)
                .addPathPatterns("/api/v1/auth/main") // 메인 페이지만
                .excludePathPatterns("/api/v1/auth/kakao/login", "/api/v1/auth/kakao/callback");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://192.168.0.100:19006", "http://localhost:19006")
                .allowedMethods("*");
    }
}
