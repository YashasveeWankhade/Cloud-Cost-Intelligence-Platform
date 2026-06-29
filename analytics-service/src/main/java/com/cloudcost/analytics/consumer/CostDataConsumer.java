package com.cloudcost.analytics.consumer;

import com.cloudcost.analytics.service.AnomalyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class CostDataConsumer {

    private final AnomalyService anomalyService;

    @KafkaListener(topics = "cost-data", groupId = "analytics-group")
    public void consume(Map<String, Object> event) {
        try {
            String eventType = (String) event.get("eventType");
            if (!"CostDataCollected".equals(eventType)) return;

            String accountId = (String) event.get("accountId");
            String serviceName = (String) event.get("serviceName");
            String costDateStr = (String) event.get("costDate");
            Object amountObj = event.get("amount");

            if (accountId == null || serviceName == null || costDateStr == null || amountObj == null) {
                log.warn("Received incomplete cost event: {}", event);
                return;
            }

            LocalDate costDate = LocalDate.parse(costDateStr.toString());
            BigDecimal amount = new BigDecimal(amountObj.toString());

            log.debug("Processing cost event: {}/{} on {} = ${}", accountId, serviceName, costDate, amount);
            anomalyService.processCostEvent(accountId, serviceName, costDate, amount);

        } catch (Exception e) {
            log.error("Error processing cost event: {}", e.getMessage(), e);
        }
    }
}
