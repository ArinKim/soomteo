//package com.soomteo.backend.chat;
//
//import com.fasterxml.jackson.databind.JsonNode;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.fasterxml.jackson.databind.node.ObjectNode;
//import com.fasterxml.jackson.databind.node.ArrayNode;
//import org.springframework.data.redis.core.RedisTemplate;
//import org.springframework.messaging.simp.SimpMessagingTemplate;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Service;
//
//import java.time.*;
//import java.util.*;
//import java.util.stream.Collectors;
//
//@Service
//public class ScheduledChatService {
//
//    private final RedisTemplate<String, String> redisTemplate;
//    private final SimpMessagingTemplate messagingTemplate;
//    private final ObjectMapper objectMapper = new ObjectMapper();
//    private final Random random = new Random();
//
//    public ScheduledChatService(RedisTemplate<String, String> redisTemplate,
//                                SimpMessagingTemplate messagingTemplate) {
//        this.redisTemplate = redisTemplate;
//        this.messagingTemplate = messagingTemplate;
//    }
//
//    private String roomKey(String roomId) { return "chat:room:" + roomId; }
//    private String scheduleKey(String roomId) { return "chat:schedule:" + roomId; }
//
//    /** 오늘 날짜 기준 랜덤 시간 N개 생성 */
//    public List<LocalDateTime> generateRandomTimes(LocalDate date,
//                                                   LocalTime start,
//                                                   LocalTime end,
//                                                   int count,
//                                                   Duration minGap) {
//        long startSec = start.toSecondOfDay();
//        long endSec   = end.toSecondOfDay();
//        long gapSec   = minGap.getSeconds();
//
//        if (endSec - startSec < gapSec * (count - 1L)) {
//            throw new IllegalArgumentException("time range too short");
//        }
//
//        List<Long> secondsList = new ArrayList<>();
//        long tMin = startSec;
//        long tMax = endSec - gapSec * (count - 1L);
//
//        // 첫 번째 시간
//        long t = tMin + (long) (random.nextDouble() * (tMax - tMin));
//        secondsList.add(t);
//
//        for (int i = 1; i < count; i++) {
//            tMin = secondsList.get(i - 1) + gapSec;
//            tMax = endSec - gapSec * (count - 1L - i);
//            long tt = tMin + (long) (random.nextDouble() * (tMax - tMin));
//            secondsList.add(tt);
//        }
//
//        return secondsList.stream()
//                .sorted()
//                .map(sec -> LocalDateTime.of(date, LocalTime.ofSecondOfDay(sec)))
//                .collect(Collectors.toList());
//    }
//
//    /** 1분마다 모든 방의 스케줄을 확인해서 "보낼 시간이 된" 메시지를 발송 */
//    @Scheduled(fixedRate = 60_000L)
//    public void tick() {
//        ZoneId zone = ZoneId.of("Asia/Seoul");
//        LocalDateTime now = LocalDateTime.now(zone);
//        LocalDate today = now.toLocalDate();
//
//        Set<String> keys = redisTemplate.keys("chat:schedule:*");
//        if (keys == null) return;
//
//        for (String key : keys) {
//            try {
//                String json = redisTemplate.opsForValue().get(key);
//                if (json == null) continue;
//
//                JsonNode node = objectMapper.readTree(json);
//                String roomId = node.get("roomId").asText();
//                String startStr = node.get("startTime").asText();
//                String endStr = node.get("endTime").asText();
//                int countPerDay = node.get("countPerDay").asInt();
//                int minIntervalMinutes = node.get("minIntervalMinutes").asInt();
//
//                LocalTime start = LocalTime.parse(startStr);
//                LocalTime end   = LocalTime.parse(endStr);
//
//                // ★ 추가: 기간(날짜) 정보
//                LocalDate periodStart = null;
//                LocalDate periodEnd   = null;
//                if (node.hasNonNull("periodStartDate")) {
//                    String s = node.get("periodStartDate").asText("");
//                    if (!s.isEmpty()) periodStart = LocalDate.parse(s);
//                }
//                if (node.hasNonNull("periodEndDate")) {
//                    String s = node.get("periodEndDate").asText("");
//                    if (!s.isEmpty()) periodEnd = LocalDate.parse(s);
//                }
//
//                // 1) 오늘이 기간 전이면: 아직 아무 것도 안 보냄 (스케줄도 비워둠)
//                if (periodStart != null && today.isBefore(periodStart)) {
//                    // 필요하다면 scheduledTimes 비우기
//                    ObjectNode obj = (ObjectNode) node;
//                    obj.put("lastGeneratedDate", "");
//                    obj.putArray("scheduledTimes");
//                    redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(obj));
//                    continue;
//                }
//
//                // 2) 오늘이 기간 후면: 더 이상 이 방은 자동 메시지 보내지 않음
//                if (periodEnd != null && today.isAfter(periodEnd)) {
//                    // 원하면 여기서 키를 삭제해도 됨
//                    // redisTemplate.delete(key);
//                    continue;
//                }
//
//                // 3) 오늘이 기간 안에 있는 경우: 매일 랜덤 시간 재생성
//                String lastDate = node.hasNonNull("lastGeneratedDate")
//                        ? node.get("lastGeneratedDate").asText("")
//                        : "";
//
//                if (!today.toString().equals(lastDate)) {
//                    // 오늘용 랜덤 스케줄 새로 생성
//                    List<LocalDateTime> newTimes = generateRandomTimes(
//                            today, start, end, countPerDay, Duration.ofMinutes(minIntervalMinutes)
//                    );
//                    ObjectNode obj = (ObjectNode) node;
//                    obj.put("lastGeneratedDate", today.toString());
//                    ArrayNode arr = obj.putArray("scheduledTimes");
//                    newTimes.forEach(t -> arr.add(t.toString()));
//
//                    System.out.println("[ScheduledChatService] room=" + roomId +
//                            " 오늘 스케줄 재생성: " + newTimes);
//                }
//
//                // 4) 아직 남아 있는 예정 시간들
//                List<LocalDateTime> times = new ArrayList<>();
//                for (JsonNode tNode : node.withArray("scheduledTimes")) {
//                    times.add(LocalDateTime.parse(tNode.asText()));
//                }
//
//                // 5) 지금 시각이 지난 것들만 골라서 보내기
//                List<LocalDateTime> remain = new ArrayList<>();
//                for (LocalDateTime t : times) {
//                    if (!t.isAfter(now)) {
//                        sendScheduledMessage(roomId);
//                    } else {
//                        remain.add(t);
//                    }
//                }
//
//                // 6) 남은 시간만 다시 저장
//                ObjectNode obj = (ObjectNode) node;
//                ArrayNode arr = obj.putArray("scheduledTimes");
//                remain.forEach(tt -> arr.add(tt.toString()));
//
//                redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(obj));
//
//            } catch (Exception e) {
//                e.printStackTrace();
//            }
//        }
//    }
//
//
//    private void sendScheduledMessage(String roomId) {
//        String content = "오늘 하루는 어땠어? 😊"; // 나중에 방/캐릭터별로 다르게
//        String payload = String.format(
//                "{ \"roomId\": \"%s\", \"senderId\": \"system\", \"senderName\": \"숨터 AI\", \"content\": \"%s\" }",
//                roomId, content
//        );
//
//        String key = roomKey(roomId);
//        redisTemplate.opsForList().rightPush(key, payload);
//        redisTemplate.opsForList().trim(key, -200, -1);
//
//        messagingTemplate.convertAndSend("/sub/chat/" + roomId, payload);
//        System.out.println("[ScheduledChatService] 자동 메시지 전송: room=" + roomId);
//    }
//}

package com.soomteo.backend.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScheduledChatService {

    private final RedisTemplate<String, String> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Random random = new Random();

    public ScheduledChatService(RedisTemplate<String, String> redisTemplate,
                                SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    private String roomKey(String roomId) {
        // roomId = "{userId}:{characterId}"
        return "chat:room:" + roomId;
    }

    private String scheduleKeyFromRoomId(String roomId) {
        return "chat:schedule:" + roomId;
    }

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

        if (endSec - startSec < gapSec * (count - 1L)) {
            throw new IllegalArgumentException("time range too short");
        }

        List<Long> secondsList = new ArrayList<>();
        long tMin = startSec;
        long tMax = endSec - gapSec * (count - 1L);

        // 첫 번째 시간
        long t = tMin + (long) (random.nextDouble() * (tMax - tMin));
        secondsList.add(t);

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

    /**
     * 1분마다 모든 스케줄 확인해서 "보낼 시간이 된" 메시지를 발송
     * - 스케줄 키: chat:schedule:{roomId}
     * - roomId = "{userId}:{characterId}"
     */
    @Scheduled(fixedRate = 60_000L)
    public void tick() {
        ZoneId zone = ZoneId.of("Asia/Seoul");
        LocalDateTime now = LocalDateTime.now(zone);
        LocalDate today = now.toLocalDate();

        Set<String> keys = redisTemplate.keys("chat:schedule:*");
        if (keys == null || keys.isEmpty()) {
            return;
        }

        for (String key : keys) {
            try {
                String json = redisTemplate.opsForValue().get(key);
                if (json == null) continue;

                JsonNode node = objectMapper.readTree(json);

                String roomId = node.path("roomId").asText(null);
                if (roomId == null || roomId.isEmpty()) {
                    continue;
                }

                String startStr = node.path("startTime").asText("07:00");
                String endStr   = node.path("endTime").asText("21:00");
                int countPerDay = node.path("countPerDay").asInt(0);
                int minIntervalMinutes = node.path("minIntervalMinutes").asInt(0);

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
                    System.out.println("[ScheduledChatService] room=" + roomId +
                            " 오늘 스케줄 재생성: " + newTimes);
                }

                // 현재 scheduledTimes 읽기
                List<LocalDateTime> times = new ArrayList<>();
                for (JsonNode tNode : obj.withArray("scheduledTimes")) {
                    times.add(LocalDateTime.parse(tNode.asText()));
                }

                if (times.isEmpty()) {
                    continue;
                }

                // 지금 시각이 지난 것들만 골라서 메시지 보내기
                List<LocalDateTime> remain = new ArrayList<>();
                for (LocalDateTime t : times) {
                    if (!t.isAfter(now)) {
                        sendScheduledMessage(roomId);
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
                e.printStackTrace();
            }
        }
    }

    private void sendScheduledMessage(String roomId) {
        String content = "오늘 하루는 어땠어? 😊"; // 나중에 캐릭터/프롬프트 기반으로 바꿀 부분

        String payload = String.format(
                "{ \"roomId\": \"%s\", \"senderId\": \"system\", \"senderName\": \"숨터 AI\", \"content\": \"%s\" }",
                roomId, content
        );

        String key = roomKey(roomId);
        redisTemplate.opsForList().rightPush(key, payload);
        redisTemplate.opsForList().trim(key, -200, -1);

        messagingTemplate.convertAndSend("/sub/chat/" + roomId, payload);
        System.out.println("[ScheduledChatService] 자동 메시지 전송: room=" + roomId);
    }
}
