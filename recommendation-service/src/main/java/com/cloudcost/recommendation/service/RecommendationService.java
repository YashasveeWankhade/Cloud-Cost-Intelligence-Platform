package com.cloudcost.recommendation.service;

import com.cloudcost.recommendation.entity.Recommendation;
import com.cloudcost.recommendation.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final RecommendationRepository repository;
    private final GeminiService geminiService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public Recommendation generateFromAnomaly(Long anomalyId, String accountId, String serviceName,
                                               double increasePercentage, String rootCause,
                                               double confidence, List<String> evidenceSummary) {
        String evidenceStr = String.join("; ", evidenceSummary);
        GeminiService.AiRecommendation ai = geminiService.generateRecommendation(
                serviceName, increasePercentage, rootCause, confidence, evidenceStr);

        BigDecimal savings = parseSavings(ai.estimatedSavings());

        Recommendation rec = Recommendation.builder()
                .anomalyId(anomalyId)
                .accountId(accountId)
                .serviceName(serviceName)
                .rootCause(rootCause)
                .rootCauseConfidence(confidence)
                .explanation(ai.explanation())
                .recommendation(ai.recommendation())
                .estimatedMonthlySavings(savings)
                .priority(classifyPriority(increasePercentage))
                .status(Recommendation.RecommendationStatus.PENDING)
                .aiGenerated(true)
                .costIncreasePercentage(increasePercentage)
                .build();

        repository.save(rec);
        log.info("Generated recommendation for anomaly {} on service {}", anomalyId, serviceName);

        // Publish RECOMMENDATION_CREATED event
        kafkaTemplate.send("recommendation-events", accountId, Map.of(
                "eventType", "RECOMMENDATION_CREATED",
                "recommendationId", rec.getId(),
                "anomalyId", anomalyId,
                "accountId", accountId,
                "serviceName", serviceName,
                "priority", rec.getPriority().name(),
                "estimatedSavings", savings.toPlainString(),
                "timestamp", System.currentTimeMillis()
        ));

        return rec;
    }

    public List<Recommendation> getAllRecommendations() {
        return repository.findAllOrderByCreatedAtDesc();
    }

    public List<Recommendation> getByAccount(String accountId) {
        return repository.findByAccountIdOrderByCreatedAtDesc(accountId);
    }

    public BigDecimal getTotalPotentialSavings() {
        return repository.totalPotentialSavings();
    }

    @Transactional
    public void updateStatus(Long id, Recommendation.RecommendationStatus status) {
        repository.findById(id).ifPresent(r -> {
            r.setStatus(status);
            repository.save(r);
        });
    }

    private Recommendation.Priority classifyPriority(double increasePercentage) {
        if (increasePercentage >= 400) return Recommendation.Priority.CRITICAL;
        if (increasePercentage >= 200) return Recommendation.Priority.HIGH;
        if (increasePercentage >= 100) return Recommendation.Priority.MEDIUM;
        return Recommendation.Priority.LOW;
    }

    private BigDecimal parseSavings(String savingsStr) {
        try {
            String cleaned = savingsStr.replaceAll("[^0-9.]", "").split("-")[0];
            if (cleaned.isEmpty()) return BigDecimal.ZERO;
            return new BigDecimal(cleaned);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
