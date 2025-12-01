//package com.soomteo.backend.config;
//
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.web.reactive.function.client.WebClient;
//
//@Configuration
//public class AiServerWebClientConfig {
//
//    @Bean
//    public WebClient aiServerWebClient(WebClient.Builder builder) {
//        // 로컬에서 FastAPI 띄운 주소 (포트 8000)
//        return builder
//                .baseUrl("http://localhost:8000")
//                .build();
//    }
//}
