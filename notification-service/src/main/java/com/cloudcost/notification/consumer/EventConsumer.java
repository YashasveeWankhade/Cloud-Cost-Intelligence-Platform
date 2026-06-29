package com.cloudcost.notification.consumer;

import com.cloudcost.notification.service.NotificationService;
import com.cloudcost.notification.service.SseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventConsumer {

    private final NotificationService notificationService;
    private final SseService sseService;

    @KafkaListener(topics = "anomaly-events", groupId = "notification-group")
    public void consumeAnomaly(Map<String, Object> event) {
        try {
            notificationService.handleAnomalyEvent(event);
            // Broadcast the full Kafka event to all connected browser clients
            sseService.broadcast("anomaly", event);
        } catch (Exception e) {
            log.error("Error processing anomaly event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "recommendation-events", groupId = "notification-group")
    public void consumeRecommendation(Map<String, Object> event) {
        try {
            notificationService.handleRecommendationEvent(event);
            // Broadcast to all connected browser clients
            sseService.broadcast("recommendation", event);
        } catch (Exception e) {
            log.error("Error processing recommendation event: {}", e.getMessage(), e);
        }
    }
}
