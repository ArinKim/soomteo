//package com.soomteo.backend.chat;
//
//import com.fasterxml.jackson.core.JsonProcessingException;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.fasterxml.jackson.databind.JsonNode;
//
//import org.springframework.data.redis.core.RedisTemplate;
//import org.springframework.web.bind.annotation.*;
//
//import java.time.*;
//import java.util.*;
//import java.util.stream.Collectors;
//
///**
// * AI 캐릭터(엄마/친구 등)를 관리하는 컨트롤러.
// * - 캐릭터 생성 및 조회
// * - 캐릭터에 설정된 스케줄(기간/시간/텀/횟수) 기반으로
// *   chat:schedule:{characterId} 를 세팅해줌.
// */
//@RestController
//@RequestMapping("/api")
//public class CharacterController {
//
//    private final RedisTemplate<String, String> redisTemplate;
//    private final ScheduledChatService scheduledChatService;
//
//    // ObjectMapper는 그냥 new 해서 사용 (스프링 빈 주입 X)
//    private final ObjectMapper objectMapper = new ObjectMapper();
//
//    public CharacterController(RedisTemplate<String, String> redisTemplate,
//                               ScheduledChatService scheduledChatService) {
//        this.redisTemplate = redisTemplate;
//        this.scheduledChatService = scheduledChatService;
//    }
//
//    // ---------- Redis Key Helper ----------
//
//    private String characterKey(String characterId) {
//        return "chat:character:" + characterId;
//    }
//
//    private String scheduleKey(String roomId) {
//        return "chat:schedule:" + roomId;
//    }
//
//    // ---------- DTO (요청/응답 공용 사용) ----------
//
//    /**
//     * 캐릭터 설정 + 스케줄 설정을 한 번에 담는 DTO.
//     * 요청(@RequestBody)과 응답 둘 다 이걸로 사용.
//     */
//    public static class CharacterConfig {
//        public String characterId;       // 방 id, WebSocket roomId 로도 사용할 값
//        public String displayName;       // 화면에 보이는 이름 (예: "따뜻한 엄마")
//        public String personality;       // 성격/말투 설명
//        public String voiceType;         // 목소리 타입 (TTS용, 지금은 문자열로만 보관)
//        public String profileImageUrl;   // 프로필 이미지 URL (지금은 옵션)
//
//        // 스케줄 관련
//        public String periodStartDate;   // "yyyy-MM-dd" (예: "2025-12-01")
//        public String periodEndDate;     // "yyyy-MM-dd" (예: "2025-12-14")
//        public String startTime;         // "HH:mm" (예: "07:00")
//        public String endTime;           // "HH:mm" (예: "21:00")
//        public int countPerDay;          // 하루 몇 번
//        public int minIntervalHours;     // 최소 간격(시간 단위)
//    }
//
//    // ---------- 1) 캐릭터 생성/수정 & 스케줄 세팅 ----------
//
//    /**
//     * 캐릭터 생성 또는 수정
//     * POST /api/characters
//     *
//     * body 예시:
//     * {
//     *   "characterId": "mom",
//     *   "displayName": "따뜻한 엄마",
//     *   "personality": "잔소리도 하지만 다정하게 챙겨주는 엄마 같은 말투",
//     *   "voiceType": "FEMALE_SOFT",
//     *   "profileImageUrl": "https://example.com/mom.png",
//     *   "periodStartDate": "2025-12-01",
//     *   "periodEndDate": "2025-12-14",
//     *   "startTime": "07:00",
//     *   "endTime": "21:00",
//     *   "countPerDay": 3,
//     *   "minIntervalHours": 3
//     * }
//     */
//    @PostMapping("/characters")
//    public CharacterConfig createOrUpdateCharacter(@RequestBody CharacterConfig req)
//            throws JsonProcessingException {
//
//        if (req.characterId == null || req.characterId.isBlank()) {
//            throw new IllegalArgumentException("characterId는 필수입니다.");
//        }
//
//        // 1) 캐릭터 설정 자체를 Redis에 저장 (chat:character:{id})
//        String charKey = characterKey(req.characterId);
//        String charJson = objectMapper.writeValueAsString(req);
//        redisTemplate.opsForValue().set(charKey, charJson);
//
//        // 2) 스케줄 정보로 오늘 기준 랜덤 시간 생성 후 chat:schedule:{id} 저장
//        setupScheduleForCharacter(req);
//
//        return req; // 방금 저장한 설정을 그대로 응답
//    }
//
//    /**
//     * CharacterConfig 를 기반으로 chat:schedule:{characterId} 세팅
//     * (= 기존 ChatController.setSchedule 에서 하던 일을 캐릭터 기준으로 옮김)
//     */
//    private void setupScheduleForCharacter(CharacterConfig cfg) throws JsonProcessingException {
//
//        // ---- 시간 범위/간격 검사 ----
//        LocalTime start = LocalTime.parse(cfg.startTime);
//        LocalTime end   = LocalTime.parse(cfg.endTime);
//
//        int minIntervalMinutes = cfg.minIntervalHours * 60;
//        long totalMinutes = Duration.between(start, end).toMinutes();
//
//        if (totalMinutes < (long) minIntervalMinutes * (cfg.countPerDay - 1)) {
//            // 프론트에서 에러 처리할 수 있도록, 예외 대신 로그만 찍고 스케줄 비우는 선택지도 있음
//            System.out.println("[CharacterController] time_range_too_short: characterId=" + cfg.characterId);
//            // 여기서는 일단 스케줄만 비우고 리턴
//            clearSchedule(cfg.characterId);
//            return;
//        }
//
//        // ---- 기간(날짜) 파싱 ----
//        LocalDate periodStart = null;
//        LocalDate periodEnd   = null;
//        if (cfg.periodStartDate != null && !cfg.periodStartDate.isEmpty()) {
//            periodStart = LocalDate.parse(cfg.periodStartDate);
//        }
//        if (cfg.periodEndDate != null && !cfg.periodEndDate.isEmpty()) {
//            periodEnd = LocalDate.parse(cfg.periodEndDate);
//        }
//
//        ZoneId zone = ZoneId.of("Asia/Seoul");
//        LocalDate today = LocalDate.now(zone);
//
//        boolean withinPeriod = true;
//        if (periodStart != null && today.isBefore(periodStart)) {
//            withinPeriod = false;
//        }
//        if (periodEnd != null && today.isAfter(periodEnd)) {
//            withinPeriod = false;
//        }
//
//        List<LocalDateTime> times = new ArrayList<>();
//        if (withinPeriod) {
//            times = scheduledChatService.generateRandomTimes(
//                    today,
//                    start,
//                    end,
//                    cfg.countPerDay,
//                    Duration.ofMinutes(minIntervalMinutes)
//            );
//            System.out.println("[CharacterController] characterId=" + cfg.characterId +
//                    " 오늘 스케줄: " + times);
//        }
//
//        // ---- 스케줄 JSON 구성 (ScheduledChatService 가 읽는 포맷) ----
//        com.fasterxml.jackson.databind.node.ObjectNode node = objectMapper.createObjectNode();
//        node.put("roomId", cfg.characterId);
//        node.put("startTime", cfg.startTime);
//        node.put("endTime", cfg.endTime);
//        node.put("countPerDay", cfg.countPerDay);
//        node.put("minIntervalMinutes", minIntervalMinutes);
//
//        if (periodStart != null) {
//            node.put("periodStartDate", periodStart.toString());
//        } else if (cfg.periodStartDate != null) {
//            node.put("periodStartDate", cfg.periodStartDate);
//        } else {
//            node.put("periodStartDate", "");
//        }
//
//        if (periodEnd != null) {
//            node.put("periodEndDate", periodEnd.toString());
//        } else if (cfg.periodEndDate != null) {
//            node.put("periodEndDate", cfg.periodEndDate);
//        } else {
//            node.put("periodEndDate", "");
//        }
//
//        if (withinPeriod) {
//            node.put("lastGeneratedDate", today.toString());
//            com.fasterxml.jackson.databind.node.ArrayNode arr = node.putArray("scheduledTimes");
//            for (LocalDateTime t : times) {
//                arr.add(t.toString());
//            }
//        } else {
//            node.put("lastGeneratedDate", "");
//            node.putArray("scheduledTimes");
//        }
//
//        String schedKey = scheduleKey(cfg.characterId);
//        redisTemplate.opsForValue().set(schedKey, objectMapper.writeValueAsString(node));
//    }
//
//    private void clearSchedule(String characterId) {
//        String schedKey = scheduleKey(characterId);
//        redisTemplate.delete(schedKey);
//    }
//
//    // ---------- 2) 캐릭터 목록 조회 ----------
//
//    /**
//     * 모든 캐릭터 리스트 조회
//     * GET /api/characters
//     */
//    @GetMapping("/characters")
//    public List<CharacterConfig> getAllCharacters() throws JsonProcessingException {
//        Set<String> keys = redisTemplate.keys("chat:character:*");
//        if (keys == null || keys.isEmpty()) {
//            return Collections.emptyList();
//        }
//
//        List<CharacterConfig> result = new ArrayList<>();
//        for (String key : keys) {
//            String json = redisTemplate.opsForValue().get(key);
//            if (json == null) continue;
//            CharacterConfig cfg = objectMapper.readValue(json, CharacterConfig.class);
//            result.add(cfg);
//        }
//
//        // 정렬 (원하면 characterId 기준으로)
//        result.sort(Comparator.comparing(cfg -> cfg.characterId));
//        return result;
//    }
//
//    // ---------- 3) 특정 캐릭터 조회 ----------
//
//    /**
//     * 특정 캐릭터 조회
//     * GET /api/characters/{characterId}
//     */
//    @GetMapping("/characters/{characterId}")
//    public CharacterConfig getCharacter(@PathVariable String characterId)
//            throws JsonProcessingException {
//        String key = characterKey(characterId);
//        String json = redisTemplate.opsForValue().get(key);
//        if (json == null) {
//            throw new IllegalArgumentException("해당 characterId의 캐릭터가 없습니다: " + characterId);
//        }
//        return objectMapper.readValue(json, CharacterConfig.class);
//    }
//}
package com.soomteo.backend.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.*;

/**
 * AI 캐릭터(엄마/친구 등)를 관리하는 컨트롤러.
 * - (userId, characterId) 단위로 캐릭터 & 스케줄 저장
 * - 캐릭터 목록/조회
 */
@RestController
@RequestMapping("/api")
public class CharacterController {

    private final RedisTemplate<String, String> redisTemplate;
    private final ScheduledChatService scheduledChatService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CharacterController(RedisTemplate<String, String> redisTemplate,
                               ScheduledChatService scheduledChatService) {
        this.redisTemplate = redisTemplate;
        this.scheduledChatService = scheduledChatService;
    }

    // ---------- Redis Key Helper ----------

    private String characterKey(String userId, String characterId) {
        return "chat:character:" + userId + ":" + characterId;
    }

    private String scheduleKey(String roomId) {
        // roomId = "{userId}:{characterId}"
        return "chat:schedule:" + roomId;
    }

    // ---------- DTO ----------

    /**
     * 캐릭터 설정 + 스케줄 설정을 한 번에 담는 DTO.
     * userId 기준으로 캐릭터가 구분됨.
     */
    public static class CharacterConfig {
        public String userId;           // 로그인 유저 ID (예: 카카오 userId)
        public String characterId;      // 캐릭터 ID
        public String displayName;      // 화면에 보이는 이름
        public String personality;      // 성격/말투 설명
        public String voiceType;        // 목소리 타입 (지금은 텍스트만)
        public String profileImageUrl;  // 프로필 이미지 URL (선택)

        // 스케줄 관련
        public String periodStartDate;  // "yyyy-MM-dd"
        public String periodEndDate;    // "yyyy-MM-dd"
        public String startTime;        // "HH:mm"
        public String endTime;          // "HH:mm"
        public int countPerDay;         // 하루 몇 번
        public int minIntervalHours;    // 최소 간격(시간 단위)
    }

    // ---------- 1) 캐릭터 생성/수정 & 스케줄 세팅 ----------

    /**
     * 캐릭터 생성 또는 수정
     * POST /api/characters
     *
     * body 예시:
     * {
     *   "userId": "kakao_12345",
     *   "characterId": "mom",
     *   "displayName": "따뜻한 엄마",
     *   "personality": "잔소리도 하지만 다정하게 챙겨주는 엄마 같은 말투",
     *   "voiceType": "FEMALE_SOFT",
     *   "profileImageUrl": "",
     *   "periodStartDate": "2025-12-01",
     *   "periodEndDate": "2025-12-14",
     *   "startTime": "07:00",
     *   "endTime": "21:00",
     *   "countPerDay": 3,
     *   "minIntervalHours": 3
     * }
     */
    @PostMapping("/characters")
    public CharacterConfig createOrUpdateCharacter(@RequestBody CharacterConfig req)
            throws JsonProcessingException {

        if (req.userId == null || req.userId.isBlank()) {
            throw new IllegalArgumentException("userId는 필수입니다.");
        }
        if (req.characterId == null || req.characterId.isBlank()) {
            throw new IllegalArgumentException("characterId는 필수입니다.");
        }

        // 1) 캐릭터 설정 자체를 Redis에 저장 (chat:character:{userId}:{characterId})
        String charKey = characterKey(req.userId, req.characterId);
        String charJson = objectMapper.writeValueAsString(req);
        redisTemplate.opsForValue().set(charKey, charJson);

        // 2) 스케줄 정보로 오늘 기준 랜덤 시간 생성 후 chat:schedule:{roomId} 저장
        setupScheduleForCharacter(req);

        return req; // 방금 저장한 설정을 그대로 응답
    }

    /**
     * CharacterConfig 를 기반으로 chat:schedule:{roomId} 세팅
     * roomId = "{userId}:{characterId}"
     */
    private void setupScheduleForCharacter(CharacterConfig cfg) throws JsonProcessingException {

        LocalTime start = LocalTime.parse(
                (cfg.startTime == null || cfg.startTime.isEmpty()) ? "07:00" : cfg.startTime
        );
        LocalTime end   = LocalTime.parse(
                (cfg.endTime == null || cfg.endTime.isEmpty()) ? "21:00" : cfg.endTime
        );

        int minIntervalMinutes = cfg.minIntervalHours * 60;
        long totalMinutes = Duration.between(start, end).toMinutes();

        if (cfg.countPerDay <= 0 || cfg.minIntervalHours <= 0) {
            System.out.println("[CharacterController] countPerDay 또는 minIntervalHours 가 0 이하여서 스케줄을 비웁니다.");
            clearSchedule(cfg.userId + ":" + cfg.characterId);
            return;
        }

        if (totalMinutes < (long) minIntervalMinutes * (cfg.countPerDay - 1)) {
            System.out.println("[CharacterController] time_range_too_short: userId=" +
                    cfg.userId + ", characterId=" + cfg.characterId);
            clearSchedule(cfg.userId + ":" + cfg.characterId);
            return;
        }

        // 기간(날짜) 파싱
        LocalDate periodStart = null;
        LocalDate periodEnd   = null;

        if (cfg.periodStartDate != null && !cfg.periodStartDate.isEmpty()) {
            periodStart = LocalDate.parse(cfg.periodStartDate);
        }
        if (cfg.periodEndDate != null && !cfg.periodEndDate.isEmpty()) {
            periodEnd = LocalDate.parse(cfg.periodEndDate);
        }

        ZoneId zone = ZoneId.of("Asia/Seoul");
        LocalDate today = LocalDate.now(zone);

        boolean withinPeriod = true;
        if (periodStart != null && today.isBefore(periodStart)) {
            withinPeriod = false;
        }
        if (periodEnd != null && today.isAfter(periodEnd)) {
            withinPeriod = false;
        }

        String roomId = cfg.userId + ":" + cfg.characterId;

        List<LocalDateTime> times = new ArrayList<>();
        if (withinPeriod) {
            times = scheduledChatService.generateRandomTimes(
                    today,
                    start,
                    end,
                    cfg.countPerDay,
                    Duration.ofMinutes(minIntervalMinutes)
            );
            System.out.println("[CharacterController] roomId=" + roomId +
                    " 오늘 스케줄: " + times);
        }

        // 스케줄 JSON 구성
        com.fasterxml.jackson.databind.node.ObjectNode node = objectMapper.createObjectNode();
        node.put("roomId", roomId);
        node.put("startTime", start.toString());
        node.put("endTime", end.toString());
        node.put("countPerDay", cfg.countPerDay);
        node.put("minIntervalMinutes", minIntervalMinutes);

        if (periodStart != null) {
            node.put("periodStartDate", periodStart.toString());
        } else if (cfg.periodStartDate != null) {
            node.put("periodStartDate", cfg.periodStartDate);
        } else {
            node.put("periodStartDate", "");
        }

        if (periodEnd != null) {
            node.put("periodEndDate", periodEnd.toString());
        } else if (cfg.periodEndDate != null) {
            node.put("periodEndDate", cfg.periodEndDate);
        } else {
            node.put("periodEndDate", "");
        }

        if (withinPeriod) {
            node.put("lastGeneratedDate", today.toString());
            com.fasterxml.jackson.databind.node.ArrayNode arr = node.putArray("scheduledTimes");
            for (LocalDateTime t : times) {
                arr.add(t.toString());
            }
        } else {
            node.put("lastGeneratedDate", "");
            node.putArray("scheduledTimes");
        }

        String schedKey = scheduleKey(roomId);
        redisTemplate.opsForValue().set(schedKey, objectMapper.writeValueAsString(node));
    }

    private void clearSchedule(String roomId) {
        String schedKey = scheduleKey(roomId);
        redisTemplate.delete(schedKey);
    }

    // ---------- 2) 캐릭터 목록 조회 ----------

    /**
     * 특정 유저의 모든 캐릭터 리스트 조회
     * GET /api/characters?userId={userId}
     */
    @GetMapping("/characters")
    public List<CharacterConfig> getCharactersForUser(
            @RequestParam(name = "userId", required = false) String userId)
            throws JsonProcessingException {

        Set<String> keys;
        if (userId != null && !userId.isBlank()) {
            keys = redisTemplate.keys("chat:character:" + userId + ":*");
        } else {
            // 디버그용: 전체 유저 캐릭터
            keys = redisTemplate.keys("chat:character:*");
        }

        if (keys == null || keys.isEmpty()) {
            return Collections.emptyList();
        }

        List<CharacterConfig> result = new ArrayList<>();
        for (String key : keys) {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null) continue;
            CharacterConfig cfg = objectMapper.readValue(json, CharacterConfig.class);
            // userId 파라미터가 있으면 필터링
            if (userId != null && !userId.isBlank() && !userId.equals(cfg.userId)) {
                continue;
            }
            result.add(cfg);
        }

        result.sort(Comparator.comparing(cfg -> cfg.characterId));
        return result;
    }

    // ---------- 3) 특정 캐릭터 조회 ----------

    /**
     * 특정 유저의 특정 캐릭터 조회
     * GET /api/characters/{userId}/{characterId}
     */
    @GetMapping("/characters/{userId}/{characterId}")
    public CharacterConfig getCharacter(@PathVariable String userId,
                                        @PathVariable String characterId)
            throws JsonProcessingException {
        String key = characterKey(userId, characterId);
        String json = redisTemplate.opsForValue().get(key);
        if (json == null) {
            throw new IllegalArgumentException("해당 (userId, characterId)의 캐릭터가 없습니다: " +
                    userId + ", " + characterId);
        }
        return objectMapper.readValue(json, CharacterConfig.class);
    }
}
