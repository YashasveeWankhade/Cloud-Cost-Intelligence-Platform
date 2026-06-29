package com.cloudcost.analytics.engine;

import com.cloudcost.analytics.entity.CostAnomaly;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.OptionalDouble;

/**
 * Deterministic, rules-based anomaly detection engine.
 * No AI/ML. Every anomaly is reproducible and auditable.
 *
 * Algorithm:
 * 1. Build 7-day and 30-day moving averages per service
 * 2. Calculate percentage deviation from baseline
 * 3. Calculate Z-score for statistical significance
 * 4. Apply severity thresholds
 */
@Component
@Slf4j
public class AnomalyDetectionEngine {

    @Value("${anomaly.low-threshold:1.5}")
    private double lowThreshold;

    @Value("${anomaly.medium-threshold:2.0}")
    private double mediumThreshold;

    @Value("${anomaly.high-threshold:3.0}")
    private double highThreshold;

    @Value("${anomaly.critical-threshold:5.0}")
    private double criticalThreshold;

    @Value("${anomaly.min-zscore:2.0}")
    private double minZScore;

    public record AnomalyDetectionResult(
            boolean isAnomaly,
            BigDecimal expectedCost,
            double increasePercentage,
            double zScore,
            CostAnomaly.Severity severity,
            String explanation
    ) {}

    /**
     * Analyze current cost against historical baseline.
     *
     * @param historicalCosts ordered list of daily costs (oldest → newest), excluding today
     * @param currentCost     today's observed cost
     */
    public AnomalyDetectionResult analyze(List<BigDecimal> historicalCosts, BigDecimal currentCost) {
        if (historicalCosts == null || historicalCosts.isEmpty()) {
            return noAnomaly(currentCost, 0.0, 0.0);
        }

        int size = historicalCosts.size();

        // Step 1: Build baselines
        List<BigDecimal> last30 = historicalCosts.subList(Math.max(0, size - 30), size);
        List<BigDecimal> last7 = historicalCosts.subList(Math.max(0, size - 7), size);

        double avg30 = average(last30);
        double avg7 = average(last7);

        // Use the more conservative (lower) baseline to reduce false positives
        double baseline = Math.min(avg30, avg7);
        if (baseline <= 0) {
            return noAnomaly(currentCost, 0.0, 0.0);
        }

        // Step 2: Calculate percentage increase
        double current = currentCost.doubleValue();
        double increasePercentage = (current - baseline) / baseline;

        if (increasePercentage <= 0) {
            return noAnomaly(BigDecimal.valueOf(baseline), increasePercentage, 0.0);
        }

        // Step 3: Calculate Z-score
        double zScore = calculateZScore(last30, current);

        // Step 4: Apply severity rules (require statistical significance: zScore > threshold)
        if (zScore < minZScore) {
            return noAnomaly(BigDecimal.valueOf(baseline), increasePercentage, zScore);
        }

        CostAnomaly.Severity severity = classifySeverity(increasePercentage);

        double multiplier = 1.0 + increasePercentage;
        String explanation = String.format(
                "Cost increased %.1f%% above 30-day baseline ($%.2f). " +
                "Z-score: %.2f. Severity: %s. " +
                "7-day avg: $%.2f, 30-day avg: $%.2f.",
                increasePercentage * 100, baseline, zScore, severity, avg7, avg30);

        log.info("Anomaly detected: {}x increase, z-score={:.2f}, severity={}",
                String.format("%.1f", multiplier), zScore, severity);

        return new AnomalyDetectionResult(
                true,
                BigDecimal.valueOf(baseline).setScale(4, RoundingMode.HALF_UP),
                increasePercentage * 100,
                zScore,
                severity,
                explanation
        );
    }

    private CostAnomaly.Severity classifySeverity(double increaseRatio) {
        double multiplier = 1.0 + increaseRatio;
        if (multiplier >= criticalThreshold) return CostAnomaly.Severity.CRITICAL;
        if (multiplier >= highThreshold)    return CostAnomaly.Severity.HIGH;
        if (multiplier >= mediumThreshold)  return CostAnomaly.Severity.MEDIUM;
        return CostAnomaly.Severity.LOW;
    }

    private double calculateZScore(List<BigDecimal> history, double currentValue) {
        if (history.size() < 2) return 0.0;

        DoubleSummaryStatistics stats = history.stream()
                .mapToDouble(BigDecimal::doubleValue)
                .summaryStatistics();

        double mean = stats.getAverage();
        double variance = history.stream()
                .mapToDouble(v -> Math.pow(v.doubleValue() - mean, 2))
                .average().orElse(0.0);
        double stdDev = Math.sqrt(variance);

        if (stdDev == 0) return 0.0;
        return (currentValue - mean) / stdDev;
    }

    private double average(List<BigDecimal> values) {
        OptionalDouble avg = values.stream().mapToDouble(BigDecimal::doubleValue).average();
        return avg.orElse(0.0);
    }

    private AnomalyDetectionResult noAnomaly(BigDecimal baseline, double pct, double z) {
        return new AnomalyDetectionResult(false, baseline, pct, z, null, null);
    }
}
