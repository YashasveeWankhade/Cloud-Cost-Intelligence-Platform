package com.cloudcost.recommendation.consumer;

import com.cloudcost.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnomalyEventConsumer {

    private final RecommendationService recommendationService;

    @KafkaListener(topics = "anomaly-events", groupId = "recommendation-group")
    public void consume(Map<String, Object> event) {
        try {
            String eventType = (String) event.get("eventType");
            if (!"ANOMALY_DETECTED".equals(eventType)) return;

            Long anomalyId = getLong(event, "anomalyId");
            String accountId = (String) event.get("accountId");
            String serviceName = (String) event.get("serviceName");
            double increasePercentage = getDouble(event, "increasePercentage");
            String rootCause = (String) event.getOrDefault("rootCause", "Unknown");
            double confidence = getDouble(event, "rootCauseConfidence");

            @SuppressWarnings("unchecked")
            List<String> evidenceSummary = (List<String>) event.getOrDefault("evidenceSummary", List.of());

            log.info("Generating recommendation for anomaly {} — {}/{} +{:.1f}%",
                    anomalyId, accountId, serviceName, increasePercentage);

            recommendationService.generateFromAnomaly(
                    anomalyId, accountId, serviceName, increasePercentage,
                    rootCause, confidence, evidenceSummary);

        } catch (Exception e) {
            log.error("Error processing anomaly event: {}", e.getMessage(), e);
        }
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Number n) return n.longValue();
        return Long.parseLong(val.toString());
    }

    private double getDouble(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return 0.0;
        if (val instanceof Number n) return n.doubleValue();
        return Double.parseDouble(val.toString());
    }
}
