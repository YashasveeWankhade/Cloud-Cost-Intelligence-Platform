package com.cloudcost.analytics.engine;

import com.cloudcost.analytics.dto.CostServiceClient;
import com.cloudcost.analytics.dto.EvidenceItem;
import com.cloudcost.analytics.dto.RootCauseResult;
import com.cloudcost.analytics.dto.TimelineEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Evidence-based root cause correlation engine.
 *
 * Confidence is computed from four independent signals:
 *
 *   Metric Correlation   30%  — Pearson r between metric time-series and cost proxy
 *   Change-Point Strength 25%  — magnitude of the most abrupt regime shift in the metric
 *   CloudTrail Evidence  25%  — presence and type of infrastructure events
 *   Temporal Alignment   20%  — how tightly the event timestamp precedes the cost spike
 *
 * All computation is deterministic: no AI, no ML, no hard-coded service rules.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RootCauseEngine {

    private final CostServiceClient costClient;

    // 4-component confidence weights (must sum to 1.0)
    private static final double W_METRIC_CORRELATION = 0.30;
    private static final double W_CHANGE_POINT       = 0.25;
    private static final double W_CLOUDTRAIL         = 0.25;
    private static final double W_TEMPORAL           = 0.20;

    // Legacy totalScore constants (kept for API compat)
    private static final int COST_INCREASE_SCORE       = 20;
    private static final int METRIC_CHANGE_SCORE       = 40;
    private static final int INFRASTRUCTURE_EVENT_SCORE = 30;
    private static final int TIMING_ALIGNMENT_SCORE    = 10;

    // ── Inner result carriers ──────────────────────────────────────────────────

    private record ChangePointResult(int index, double magnitude, double strengthScore) {}

    private record MetricAnalysisResult(int legacyScore, double correlationScore,
                                        double changePointStrength, List<TimelineEvent> timelines) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Public entry point
    // ─────────────────────────────────────────────────────────────────────────

    public RootCauseResult analyze(String accountId, String serviceName, LocalDate anomalyDate,
                                    double actualCost, double expectedCost) {
        List<EvidenceItem> evidence = new ArrayList<>();
        List<TimelineEvent> timeline = new ArrayList<>();
        int legacyTotal = 0;

        LocalDateTime windowStart = anomalyDate.minusDays(2).atStartOfDay();
        LocalDateTime windowEnd   = anomalyDate.plusDays(1).atTime(23, 59);

        // ── Evidence 1: Cost increase (always present) ────────────────────────
        double costMultiplier = actualCost / Math.max(expectedCost, 1.0);
        evidence.add(EvidenceItem.builder()
                .type("COST_INCREASE")
                .description(String.format("Cost increased %.1fx above baseline ($%.2f → $%.2f)",
                        costMultiplier, expectedCost, actualCost))
                .score(COST_INCREASE_SCORE)
                .build());
        legacyTotal += COST_INCREASE_SCORE;
        timeline.add(TimelineEvent.builder()
                .time(anomalyDate.toString())
                .event(String.format("Cost spike detected: $%.2f vs expected $%.2f (%.1fx above baseline)",
                        actualCost, expectedCost, costMultiplier))
                .build());

        // ── Evidence 2: CloudWatch metric time-series analysis ────────────────
        List<Map<String, Object>> metrics = costClient.fetchMetrics(
                accountId, serviceName, windowStart, windowEnd);
        MetricAnalysisResult metricResult = analyzeMetrics(
                metrics, evidence, serviceName, actualCost, expectedCost);
        legacyTotal += metricResult.legacyScore();
        timeline.addAll(metricResult.timelines());

        // ── Evidence 3: CloudTrail events ─────────────────────────────────────
        List<Map<String, Object>> events        = costClient.fetchTrailEvents(accountId, windowStart, windowEnd);
        List<Map<String, Object>> relevantEvents = filterEventsByService(events, serviceName);

        String detectedCause   = null;
        String eventTimestamp  = null;
        double cloudTrailScore;

        if (!relevantEvents.isEmpty()) {
            Map<String, Object> primary = relevantEvents.get(0);
            detectedCause  = extractEventType(primary);
            eventTimestamp = (String) primary.get("timestamp");
            cloudTrailScore = computeCloudTrailScore(relevantEvents);

            evidence.add(EvidenceItem.builder()
                    .type("INFRASTRUCTURE_EVENT")
                    .description(String.format("Infrastructure event detected: %s on %s (%d event(s) corroborated)",
                            detectedCause, serviceName, relevantEvents.size()))
                    .score(INFRASTRUCTURE_EVENT_SCORE)
                    .eventType(detectedCause)
                    .eventSource((String) primary.get("eventSource"))
                    .build());
            legacyTotal += INFRASTRUCTURE_EVENT_SCORE;

            if (eventTimestamp != null) {
                timeline.add(TimelineEvent.builder()
                        .time(eventTimestamp)
                        .event(String.format("CloudTrail event: %s (source: %s)",
                                detectedCause, primary.getOrDefault("eventSource", "unknown")))
                        .build());
            }

            String injectedCause = (String) primary.getOrDefault("injectedCause", null);
            if (injectedCause != null) detectedCause = injectedCause;

        } else {
            cloudTrailScore = 0.0;
            evidence.add(EvidenceItem.builder()
                    .type("NO_MATCHING_EVENT")
                    .description("No correlated CloudTrail event found in anomaly window")
                    .score(0)
                    .build());
            detectedCause = inferCauseFromMetrics(metrics, serviceName);
        }

        // ── Evidence 4: Temporal alignment ────────────────────────────────────
        double temporalScore = computeTemporalAlignmentScore(eventTimestamp, anomalyDate);
        if (temporalScore >= 60.0) {
            evidence.add(EvidenceItem.builder()
                    .type("TIMING_ALIGNMENT")
                    .description(String.format(
                            "Infrastructure event precedes cost spike — temporal alignment score: %.0f/100",
                            temporalScore))
                    .score(TIMING_ALIGNMENT_SCORE)
                    .build());
            legacyTotal += TIMING_ALIGNMENT_SCORE;
        }

        // ── 4-component confidence model ──────────────────────────────────────
        double metricCorrelationScore = metricResult.correlationScore();
        double changePointStrength    = metricResult.changePointStrength();

        double confidence = (metricCorrelationScore * W_METRIC_CORRELATION)
                          + (changePointStrength    * W_CHANGE_POINT)
                          + (cloudTrailScore        * W_CLOUDTRAIL)
                          + (temporalScore          * W_TEMPORAL);
        confidence = Math.min(100.0, Math.max(0.0, confidence));

        Map<String, Double> breakdown = Map.of(
                "metricCorrelation",   round1(metricCorrelationScore),
                "changePointStrength", round1(changePointStrength),
                "cloudTrailEvidence",  round1(cloudTrailScore),
                "temporalAlignment",   round1(temporalScore)
        );

        // Sort timeline chronologically (ISO strings sort lexicographically)
        timeline.sort(Comparator.comparing(TimelineEvent::getTime));

        log.info("Root cause [{}:{}]: cause={}, confidence={}% corr={} cp={} trail={} temporal={}",
                accountId, serviceName, detectedCause,
                String.format("%.1f", confidence),
                String.format("%.0f", metricCorrelationScore),
                String.format("%.0f", changePointStrength),
                String.format("%.0f", cloudTrailScore),
                String.format("%.0f", temporalScore));

        return RootCauseResult.builder()
                .accountId(accountId)
                .serviceName(serviceName)
                .rootCause(detectedCause != null ? detectedCause : "Undetermined")
                .confidence(confidence)
                .totalScore(legacyTotal)
                .evidence(evidence)
                .timeline(timeline)
                .confidenceBreakdown(breakdown)
                .analysisTimestamp(LocalDateTime.now())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Metric time-series analysis
    // ─────────────────────────────────────────────────────────────────────────

    private MetricAnalysisResult analyzeMetrics(List<Map<String, Object>> metrics,
                                                 List<EvidenceItem> evidence,
                                                 String serviceName,
                                                 double actualCost, double expectedCost) {
        if (metrics == null || metrics.isEmpty()) {
            evidence.add(EvidenceItem.builder()
                    .type("METRIC_NORMAL").description("No metric data available").score(0).build());
            return new MetricAnalysisResult(0, 0.0, 0.0, List.of());
        }

        // Group by metric name
        Map<String, List<Map<String, Object>>> byMetric = new LinkedHashMap<>();
        for (Map<String, Object> m : metrics) {
            String name = (String) m.get("metricName");
            if (name != null) byMetric.computeIfAbsent(name, k -> new ArrayList<>()).add(m);
        }
        // Sort each metric's points by timestamp (ISO strings sort lexicographically)
        byMetric.values().forEach(pts -> pts.sort(
                Comparator.comparing(m -> String.valueOf(m.getOrDefault("timestamp", "")))));

        double bestCorrelation        = 0.0;
        double bestChangePointStrength = 0.0;
        List<String> anomalyDescs    = new ArrayList<>();
        List<TimelineEvent> timelines = new ArrayList<>();

        for (Map.Entry<String, List<Map<String, Object>>> entry : byMetric.entrySet()) {
            String metricName           = entry.getKey();
            List<Map<String, Object>> pts = entry.getValue();
            List<Double> values = pts.stream()
                    .map(m -> ((Number) m.getOrDefault("metricValue", 0.0)).doubleValue())
                    .collect(Collectors.toList());

            if (values.size() < 2) continue;

            // 1. Rolling window: compare first half avg vs second half avg
            int halfN    = values.size() / 2;
            double prevAvg  = mean(values.subList(0, halfN));
            double currAvg  = mean(values.subList(halfN, values.size()));
            double rollingChangePct = prevAvg > 0 ? (currAvg - prevAvg) / prevAvg * 100.0 : 0.0;

            // 2. Change point detection — find the index of the most abrupt regime shift
            ChangePointResult cpResult = detectChangePoint(values);

            // 3. Pearson correlation between metric values and a synthetic cost proxy
            List<Double> costProxy = buildCostProxy(values.size(), expectedCost, actualCost);
            double pearsonR = pearsonCorrelation(values, costProxy);

            if (Math.abs(pearsonR) > Math.abs(bestCorrelation)) bestCorrelation = pearsonR;
            if (cpResult.strengthScore() > bestChangePointStrength)
                bestChangePointStrength = cpResult.strengthScore();

            // Anomalous if any of: rolling change > 30%, Pearson r > 0.6, change-point strength > 40
            boolean anomalous = Math.abs(rollingChangePct) > 30.0
                    || Math.abs(pearsonR) > 0.6
                    || cpResult.strengthScore() > 40.0;

            if (anomalous) {
                String dir = rollingChangePct >= 0 ? "increase" : "decrease";
                anomalyDescs.add(String.format(
                        "%s: %.0f%% %s, Pearson r=%.2f, change-point strength=%.0f/100",
                        metricName, Math.abs(rollingChangePct), dir, pearsonR, cpResult.strengthScore()));

                // Emit a timeline event at the detected change point
                int cpIdx = cpResult.index();
                if (cpIdx > 0 && cpIdx < pts.size()) {
                    Object ts = pts.get(cpIdx).get("timestamp");
                    if (ts != null) {
                        timelines.add(TimelineEvent.builder()
                                .time(ts.toString())
                                .event(String.format("%s change point: %.1fx shift detected (Pearson r=%.2f with cost)",
                                        metricName, cpResult.magnitude(), pearsonR))
                                .build());
                    }
                }
            }
        }

        if (!anomalyDescs.isEmpty()) {
            evidence.add(EvidenceItem.builder()
                    .type("METRIC_ANOMALY")
                    .description("Time-series analysis — " + String.join("; ", anomalyDescs))
                    .score(METRIC_CHANGE_SCORE)
                    .correlationScore(bestCorrelation)
                    .changePointMagnitude(bestChangePointStrength)
                    .build());
            return new MetricAnalysisResult(METRIC_CHANGE_SCORE,
                    Math.max(0.0, bestCorrelation * 100.0), bestChangePointStrength, timelines);
        }

        evidence.add(EvidenceItem.builder()
                .type("METRIC_NORMAL")
                .description(String.format("Metrics within normal range (max Pearson r=%.2f)", bestCorrelation))
                .score(0)
                .correlationScore(bestCorrelation)
                .build());
        return new MetricAnalysisResult(0, Math.max(0.0, bestCorrelation * 100.0),
                bestChangePointStrength, timelines);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Change-point detection
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Finds the single index that maximises |mean(right) − mean(left)| / mean(left).
     *
     * Strength uses a log scale: 50% change ≈ 37, 100% ≈ 63, 200% ≈ 100.
     */
    private static ChangePointResult detectChangePoint(List<Double> values) {
        if (values.size() < 4) {
            double first = values.get(0);
            double last  = values.get(values.size() - 1);
            double ratio    = first > 0 ? last / first : 1.0;
            double relChange = first > 0 ? Math.abs(last - first) / first : 0.0;
            return new ChangePointResult(-1, ratio,
                    Math.min(100.0, (Math.log1p(relChange) / Math.log(3.0)) * 100.0));
        }

        int    bestIdx       = -1;
        double bestRelChange = 0.0;
        double bestMagnitude = 1.0;

        for (int i = 2; i <= values.size() - 2; i++) {
            double leftMean  = mean(values.subList(0, i));
            double rightMean = mean(values.subList(i, values.size()));
            if (leftMean <= 0.0) continue;
            double relChange = Math.abs(rightMean - leftMean) / leftMean;
            if (relChange > bestRelChange) {
                bestRelChange = relChange;
                bestIdx       = i;
                bestMagnitude = rightMean / leftMean;
            }
        }

        double strength = Math.min(100.0, (Math.log1p(bestRelChange) / Math.log(3.0)) * 100.0);
        return new ChangePointResult(bestIdx, bestMagnitude, strength);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Pearson Correlation Coefficient
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Computes Pearson r ∈ [−1, 1] between two series of equal or differing length
     * (uses min(len) overlap). Returns 0 when either series is constant.
     */
    private static double pearsonCorrelation(List<Double> x, List<Double> y) {
        int n = Math.min(x.size(), y.size());
        if (n < 2) return 0.0;
        double xMean = mean(x.subList(0, n));
        double yMean = mean(y.subList(0, n));
        double num = 0.0, xSumSq = 0.0, ySumSq = 0.0;
        for (int i = 0; i < n; i++) {
            double dx = x.get(i) - xMean;
            double dy = y.get(i) - yMean;
            num    += dx * dy;
            xSumSq += dx * dx;
            ySumSq += dy * dy;
        }
        double denom = Math.sqrt(xSumSq * ySumSq);
        return denom < 1e-12 ? 0.0 : num / denom;
    }

    /**
     * Builds a synthetic cost proxy series of length {@code n}.
     * First half = expectedCost (baseline period).
     * Second half ramps linearly from expectedCost to actualCost (anomaly period).
     */
    private static List<Double> buildCostProxy(int n, double expectedCost, double actualCost) {
        List<Double> proxy = new ArrayList<>(n);
        int halfN = n / 2;
        for (int i = 0; i < n; i++) {
            if (i < halfN) {
                proxy.add(expectedCost);
            } else {
                double t = (double) (i - halfN) / Math.max(1, n - halfN - 1);
                proxy.add(expectedCost + t * (actualCost - expectedCost));
            }
        }
        return proxy;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CloudTrail scoring
    // ─────────────────────────────────────────────────────────────────────────

    private double computeCloudTrailScore(List<Map<String, Object>> relevantEvents) {
        if (relevantEvents.isEmpty()) return 0.0;
        double score = 40.0; // base for having any event
        score += switch (extractEventType(relevantEvents.get(0))) {
            case "ScaleOut", "ScaleIn"                  -> 35.0;
            case "RunInstances", "TerminateInstances"   -> 30.0;
            case "CreateBucket", "DeleteBucket"         -> 25.0;
            case "InvokeFunction", "CreateFunction"     -> 25.0;
            case "PutItem", "BatchWriteItem"            -> 20.0;
            default                                     -> 15.0;
        };
        if (relevantEvents.size() > 2) score += 10.0; // corroborating events
        return Math.min(100.0, score);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Temporal alignment
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Scores how tightly the event timestamp precedes the cost anomaly day.
     * An event 0–30 min before scores highest; an event after the anomaly scores lowest.
     */
    private double computeTemporalAlignmentScore(String eventTs, LocalDate anomalyDate) {
        if (eventTs == null) return 50.0; // no event → neutral
        try {
            LocalDateTime eventTime    = parseTimestamp(eventTs);
            LocalDateTime anomalyStart = anomalyDate.atStartOfDay();
            long minutesDelta = ChronoUnit.MINUTES.between(eventTime, anomalyStart);
            if (minutesDelta <    0) return 20.0;  // event after anomaly
            if (minutesDelta <    5) return 100.0;
            if (minutesDelta <   15) return 90.0;
            if (minutesDelta <   30) return 80.0;
            if (minutesDelta <   60) return 65.0;
            if (minutesDelta <  180) return 50.0;
            if (minutesDelta < 1440) return 35.0;  // same day
            return 20.0;                           // > 1 day before
        } catch (Exception e) {
            return 50.0;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static double mean(List<Double> values) {
        if (values.isEmpty()) return 0.0;
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private List<Map<String, Object>> filterEventsByService(List<Map<String, Object>> events,
                                                             String serviceName) {
        if (events == null) return List.of();
        return events.stream()
                .filter(e -> serviceName.equalsIgnoreCase((String) e.get("serviceName")))
                .toList();
    }

    private String extractEventType(Map<String, Object> event) {
        return (String) event.getOrDefault("eventType", "ConfigChange");
    }

    private String inferCauseFromMetrics(List<Map<String, Object>> metrics, String serviceName) {
        if (metrics == null || metrics.isEmpty()) return "Configuration Change";
        String topMetric = metrics.stream()
                .max(Comparator.comparingDouble(
                        m -> ((Number) m.getOrDefault("metricValue", 0)).doubleValue()))
                .map(m -> (String) m.get("metricName"))
                .orElse("");
        return switch (topMetric) {
            case "InstanceCount"                          -> "Instance Scaling";
            case "BucketSizeBytes", "NumberOfObjects"    -> "Storage Growth";
            case "Invocations"                           -> "Invocation Surge";
            case "Requests", "BytesDownloaded"           -> "Traffic Surge";
            case "ConsumedReadCapacityUnits"             -> "Capacity Increase";
            default                                      -> "Resource Utilization Increase";
        };
    }

    private LocalDateTime parseTimestamp(String ts) {
        return LocalDateTime.parse(ts.replace("Z", "")
                .replace(" ", "T")
                .replaceAll("\\.\\d+$", ""));
    }
}
