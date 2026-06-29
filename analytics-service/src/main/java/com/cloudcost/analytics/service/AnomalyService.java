package com.cloudcost.analytics.service;

import com.cloudcost.analytics.dto.KafkaAnomalyEvent;
import com.cloudcost.analytics.dto.RootCauseResult;
import com.cloudcost.analytics.engine.AnomalyDetectionEngine;
import com.cloudcost.analytics.engine.RootCauseEngine;
import com.cloudcost.analytics.entity.CostAnomaly;
import com.cloudcost.analytics.repository.CostAnomalyRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnomalyService {

    private final CostAnomalyRepository anomalyRepository;
    private final AnomalyDetectionEngine detectionEngine;
    private final RootCauseEngine rootCauseEngine;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    // accountId -> serviceName -> sorted daily costs (history buffer)
    private final java.util.concurrent.ConcurrentHashMap<String, List<BigDecimal>> costHistory =
            new java.util.concurrent.ConcurrentHashMap<>();

    @Transactional
    public void processCostEvent(String accountId, String serviceName, LocalDate costDate, BigDecimal amount) {
        String key = accountId + ":" + serviceName;
        List<BigDecimal> history = costHistory.computeIfAbsent(key, k -> new java.util.ArrayList<>());

        AnomalyDetectionEngine.AnomalyDetectionResult result = detectionEngine.analyze(history, amount);

        // Add current to history after analysis
        history.add(amount);
        if (history.size() > 90) history.remove(0);

        if (!result.isAnomaly()) return;

        // Check if we already have an anomaly for this day
        if (anomalyRepository.findByAccountIdAndServiceNameAndCostDate(accountId, serviceName, costDate).isPresent()) {
            log.debug("Anomaly already recorded for {}/{}/{}", accountId, serviceName, costDate);
            return;
        }

        log.info("New anomaly detected: {}/{} on {} — {}% increase, severity={}",
                accountId, serviceName, costDate,
                String.format("%.1f", result.increasePercentage()), result.severity());

        // Run root cause analysis
        RootCauseResult rcResult = rootCauseEngine.analyze(
                accountId, serviceName, costDate, amount.doubleValue(), result.expectedCost().doubleValue());

        String evidenceJson = serializeEvidence(rcResult);

        CostAnomaly anomaly = CostAnomaly.builder()
                .accountId(accountId)
                .serviceName(serviceName)
                .costDate(costDate)
                .expectedCost(result.expectedCost())
                .actualCost(amount)
                .increasePercentage(result.increasePercentage())
                .zScore(result.zScore())
                .severity(result.severity())
                .status(CostAnomaly.AnomalyStatus.OPEN)
                .rootCause(rcResult.getRootCause())
                .rootCauseConfidence(rcResult.getConfidence())
                .evidence(evidenceJson)
                .firstDetected(LocalDateTime.now())
                .lastDetected(LocalDateTime.now())
                .build();

        anomalyRepository.save(anomaly);

        // Publish anomaly event
        KafkaAnomalyEvent event = KafkaAnomalyEvent.builder()
                .eventType("ANOMALY_DETECTED")
                .anomalyId(anomaly.getId())
                .accountId(accountId)
                .serviceName(serviceName)
                .costDate(costDate)
                .expectedCost(result.expectedCost())
                .actualCost(amount)
                .increasePercentage(result.increasePercentage())
                .severity(result.severity().name())
                .rootCause(rcResult.getRootCause())
                .rootCauseConfidence(rcResult.getConfidence())
                .evidenceSummary(rcResult.getEvidence().stream()
                        .map(e -> e.getType() + ": " + e.getDescription())
                        .collect(Collectors.toList()))
                .timestamp(System.currentTimeMillis())
                .build();

        kafkaTemplate.send("anomaly-events", accountId, event);
        log.info("Published ANOMALY_DETECTED event for anomaly id={}", anomaly.getId());
    }

    public List<CostAnomaly> getAllAnomalies() {
        return anomalyRepository.findAll().stream()
                .sorted((a, b) -> b.getFirstDetected().compareTo(a.getFirstDetected()))
                .toList();
    }

    public List<CostAnomaly> getAnomaliesByAccount(String accountId) {
        return anomalyRepository.findByAccountIdOrderByFirstDetectedDesc(accountId);
    }

    public List<CostAnomaly> getOpenAnomalies() {
        return anomalyRepository.findByStatusOrderByFirstDetectedDesc(CostAnomaly.AnomalyStatus.OPEN);
    }

    public long countOpenAnomalies() {
        return anomalyRepository.countOpenAnomalies();
    }

    @Transactional
    public void resolveAnomaly(Long id) {
        anomalyRepository.findById(id).ifPresent(a -> {
            a.setStatus(CostAnomaly.AnomalyStatus.RESOLVED);
            a.setResolvedTime(LocalDateTime.now());
            anomalyRepository.save(a);
        });
    }

    private String serializeEvidence(RootCauseResult result) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "rootCause", result.getRootCause(),
                    "confidence", result.getConfidence(),
                    "evidence", result.getEvidence()
            ));
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
