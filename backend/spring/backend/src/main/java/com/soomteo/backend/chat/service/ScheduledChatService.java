package com.soomteo.backend.chat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.soomteo.backend.chat.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledChatService {

    private final RedisTemplate<String, String> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    // 🔥 자동 안부 메시지도 DB에 저장하려고 추가
    private final ChatHistoryService chatHistoryService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Random random = new Random();

    /** 채팅방 메시지 리스트 키 (선택 사항, 안 쓰면 제거해도 됨) */
    private String roomKey(String roomId) {
        // roomId = friendId (실제 채팅방 id)
        return "chat:room:" + roomId;
    }

    /** 스케줄 key: chat:schedule:{userId}:{friendId} */
    private String scheduleKey(Long userId, Long friendId) {
        return "chat:schedule:" + userId + ":" + friendId;
    }

    /** 스케줄 key 에 들어있는 roomId (userId:friendId 형태)를 다시 사용할 때 */
    private String scheduleKeyFromRoomId(String roomId) {
        return "chat:schedule:" + roomId;
    }

    /* =========================
       1. 스케줄 생성/수정/삭제 API
       ========================= */

    /**
     * 친구(캐릭터) 하나에 대한 안부 메시지 스케줄 생성/갱신
     *
     * @param userId    유저 ID
     * @param friendId  친구(캐릭터) ID
     * @param startDate 기간 시작일 (null 이면 제한 없음)
     * @param endDate   기간 종료일 (null 이면 제한 없음)
     * @param startTime 하루 중 시작 시간
     * @param endTime   하루 중 끝 시간
     * @param count     하루 전송 횟수
     */
    public void upsertScheduleForFriend(
            Long userId,
            Long friendId,
            LocalDate startDate,
            LocalDate endDate,
            LocalTime startTime,
            LocalTime endTime,
            Integer count
    ) {
        // count가 없거나 0 이하면 스케줄을 삭제하는 것으로 처리
        if (count == null || count <= 0) {
            deleteScheduleForFriend(friendId);
            return;
        }

        // 기본값 설정
        LocalTime effectiveStart = (startTime != null) ? startTime : LocalTime.of(7, 0);
        LocalTime effectiveEnd   = (endTime != null)   ? endTime   : LocalTime.of(21, 0);
        int countPerDay          = count;
        int minIntervalMinutes   = 1;   // 두 안부 메시지 사이 최소 간격 (분)

        // Redis 에 저장할 JSON 구조
        ObjectNode node = objectMapper.createObjectNode();

        // roomId 는 "userId:friendId" 로 저장 (스케줄 식별용)
        String scheduleRoomId = userId + ":" + friendId;
        node.put("roomId", scheduleRoomId);

        // 기간
        node.put("periodStartDate", startDate != null ? startDate.toString() : "");
        node.put("periodEndDate",   endDate != null ? endDate.toString() : "");

        // 하루 중 시간 설정 (HH:mm:ss 형태)
        node.put("startTime", effectiveStart.toString());
        node.put("endTime",   effectiveEnd.toString());

        // 하루 횟수 & 최소 간격
        node.put("countPerDay", countPerDay);
        node.put("minIntervalMinutes", minIntervalMinutes);

        // 오늘 랜덤 시간을 생성했는지 체크용
        node.put("lastGeneratedDate", "");
        node.putArray("scheduledTimes");   // 오늘 남은 전송 시간들

        String key = scheduleKey(userId, friendId);
        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(node));
            log.info("[ScheduledChatService] upsert schedule: userId={}, friendId={}, key={}", userId, friendId, key);
        } catch (Exception e) {
            log.error("[ScheduledChatService] upsertScheduleForFriend 저장 실패, key={}", key, e);
        }
    }

    /**
     * friendId 기준으로 스케줄 삭제
     * (userId 를 모르기 때문에 와일드카드 keys 로 찾아서 제거)
     */
    public void deleteScheduleForFriend(Long friendId) {
        try {
            Set<String> keys = redisTemplate.keys("chat:schedule:*:" + friendId);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("[ScheduledChatService] delete schedule for friendId={}, keys={}", friendId, keys);
            }
        } catch (Exception e) {
            log.error("[ScheduledChatService] deleteScheduleForFriend 실패, friendId={}", friendId, e);
        }
    }

    /* =========================
       2. 랜덤 시간 생성 유틸
       ========================= */

    /**
     * 오늘 날짜 기준 랜덤 시간 N개 생성
     */
    public List<LocalDateTime> generateRandomTimes(LocalDate date,
                                                   LocalTime start,
                                                   LocalTime end,
                                                   int count,
                                                   Duration minGap) {
        long startSec = start.toSecondOfDay();
        long endSec   = end.toSecondOfDay();
        long gapSec   = minGap.getSeconds();

        if (count <= 0) {
            return Collections.emptyList();
        }

//        // 가능한 총 시간 범위가 최소 간격 * (count - 1) 보다 짧으면 예외
//        if (endSec - startSec < gapSec * (count - 1L)) {
//            throw new IllegalArgumentException("time range too short for given count & minGap");
//        }

        List<Long> secondsList = new ArrayList<>();
        long tMin = startSec;
        long tMax = endSec - gapSec * (count - 1L);

        // 첫 번째 시간
        long t = tMin + (long) (random.nextDouble() * (tMax - tMin));
        secondsList.add(t);

        // 나머지 시간들 순차적으로 생성 (최소 간격 유지)
        for (int i = 1; i < count; i++) {
            tMin = secondsList.get(i - 1) + gapSec;
            tMax = endSec - gapSec * (count - 1L - i);
            long tt = tMin + (long) (random.nextDouble() * (tMax - tMin));
            secondsList.add(tt);
        }

        return secondsList.stream()
                .sorted()
                .map(sec -> LocalDateTime.of(date, LocalTime.ofSecondOfDay(sec)))
                .collect(Collectors.toList());
    }

    /* =========================
       3. 매 분마다 스케줄링 실행
       ========================= */

    /**
     * 1분마다 모든 스케줄 확인해서 "보낼 시간이 된" 메시지를 발송
     * - 스케줄 키: chat:schedule:{userId}:{friendId}
     * - roomId(스케줄 json 내부): "{userId}:{friendId}"
     * - 실제 채팅 roomId: friendId (문자열)
     */
    @Scheduled(fixedRate = 60_000L)
    public void tick() {
        ZoneId zone = ZoneId.of("Asia/Seoul");
        LocalDateTime now = LocalDateTime.now(zone);
        LocalDate today = now.toLocalDate();

        Set<String> keys;
        try {
            keys = redisTemplate.keys("chat:schedule:*");
        } catch (Exception e) {
            log.error("[ScheduledChatService] redis keys() 실패", e);
            return;
        }

        if (keys == null || keys.isEmpty()) {
            return;
        }

        for (String key : keys) {
            try {
                String json = redisTemplate.opsForValue().get(key);
                if (json == null) continue;

                JsonNode node = objectMapper.readTree(json);

                String scheduleRoomId = node.path("roomId").asText(null);  // "userId:friendId"
                if (scheduleRoomId == null || scheduleRoomId.isEmpty()) {
                    continue;
                }

                String startStr = node.path("startTime").asText("07:00:00");
                String endStr   = node.path("endTime").asText("21:00:00");
                int countPerDay = node.path("countPerDay").asInt(0);
                int minIntervalMinutes = node.path("minIntervalMinutes").asInt(30);

                if (countPerDay <= 0 || minIntervalMinutes <= 0) {
                    continue;
                }

                LocalTime start = LocalTime.parse(startStr);
                LocalTime end   = LocalTime.parse(endStr);

                // 기간 체크
                String periodStartStr = node.path("periodStartDate").asText("");
                String periodEndStr   = node.path("periodEndDate").asText("");

                boolean withinPeriod = true;
                if (!periodStartStr.isEmpty()) {
                    LocalDate periodStart = LocalDate.parse(periodStartStr);
                    if (today.isBefore(periodStart)) {
                        withinPeriod = false;
                    }
                }
                if (!periodEndStr.isEmpty()) {
                    LocalDate periodEnd = LocalDate.parse(periodEndStr);
                    if (today.isAfter(periodEnd)) {
                        withinPeriod = false;
                    }
                }

                ObjectNode obj = (ObjectNode) node;

                if (!withinPeriod) {
                    // 기간 밖이면 scheduledTimes 비우고 저장만
                    obj.put("lastGeneratedDate", "");
                    obj.putArray("scheduledTimes");
                    redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(obj));
                    continue;
                }

                // 날짜가 바뀌었으면 오늘 기준으로 랜덤 시간 다시 생성
                String lastDate = node.path("lastGeneratedDate").asText("");
                if (!today.toString().equals(lastDate)) {
                    List<LocalDateTime> newTimes = generateRandomTimes(
                            today, start, end, countPerDay, Duration.ofMinutes(minIntervalMinutes)
                    );
                    obj.put("lastGeneratedDate", today.toString());
                    ArrayNode arr = obj.putArray("scheduledTimes");
                    for (LocalDateTime t : newTimes) {
                        arr.add(t.toString());
                    }
                    redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(obj));
                    log.info("[ScheduledChatService] room={} 오늘 스케줄 재생성: {}", scheduleRoomId, newTimes);
                }

                // 현재 scheduledTimes 읽기
                List<LocalDateTime> times = new ArrayList<>();
                for (JsonNode tNode : obj.withArray("scheduledTimes")) {
                    times.add(LocalDateTime.parse(tNode.asText()));
                }

                if (times.isEmpty()) {
                    redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(obj));
                    continue;
                }

                // 지금 시각이 지난 것들만 골라서 메시지 보내기
                List<LocalDateTime> remain = new ArrayList<>();
                for (LocalDateTime t : times) {
                    if (!t.isAfter(now)) {
                        sendScheduledMessage(scheduleRoomId);
                    } else {
                        remain.add(t);
                    }
                }

                // 남은 시간만 다시 저장
                ArrayNode arr = obj.putArray("scheduledTimes");
                for (LocalDateTime tt : remain) {
                    arr.add(tt.toString());
                }

                redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(obj));

            } catch (Exception e) {
                log.error("[ScheduledChatService] error while processing key={}", key, e);
            }
        }
    }

    /* =========================
       4. 실제 자동 메시지 전송
       ========================= */

    /**
     * scheduleRoomId = "{userId}:{friendId}"
     * 실제 채팅방 roomId 는 friendId (문자열)
     *  - DB(chat_message) 에도 저장
     *  - STOMP 로도 브로드캐스트
     */
    private void sendScheduledMessage(String scheduleRoomId) {
        try {
            String[] parts = scheduleRoomId.split(":");
            if (parts.length != 2) {
                log.warn("[ScheduledChatService] 잘못된 roomId 포맷: {}", scheduleRoomId);
                return;
            }

            String userIdStr   = parts[0];   // 지금은 안 쓰지만 나중에 쓰려고 남겨둠
            String friendIdStr = parts[1];

            // 우리 기존 구조에서 roomId = friendId
            String roomId = friendIdStr;

            String content = "오늘 하루는 어땠어? 😊";  // TODO: 캐릭터/프롬프트 기반 커스터마이징

            // 1) ChatMessage DTO 생성
            ChatMessage msg = ChatMessage.builder()
                    .roomId(roomId)
                    .senderId("AI")
                    .content(content)
                    .type(ChatMessage.MessageType.AI)
                    .timestamp(System.currentTimeMillis())
                    .build();

            // 2) DB 저장 (chat_message 테이블)
            chatHistoryService.saveMessage(msg);

            // 3) WebSocket 브로드캐스트
            String dest = "/sub/chat/room/" + roomId;
            messagingTemplate.convertAndSend(dest, msg);

            log.info("[ScheduledChatService] 자동 메시지 전송 : scheduleRoom={}, chatRoom={}, content={}",
                    scheduleRoomId, roomId, content);

        } catch (Exception e) {
            log.error("[ScheduledChatService] sendScheduledMessage 실패, roomId={}", scheduleRoomId, e);
        }
    }
}
