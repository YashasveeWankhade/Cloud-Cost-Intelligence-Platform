package com.cloudcost.analytics.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data @Builder
public class RootCauseResult {
    private String accountId;
    private String serviceName;
    private String rootCause;
    private double confidence;
    private int totalScore;
    private List<EvidenceItem> evidence;
    private List<TimelineEvent> timeline;
    /** Per-component scores used to compute confidence. Keys: metricCorrelation, changePointStrength, cloudTrailEvidence, temporalAlignment. */
    private Map<String, Double> confidenceBreakdown;
    private LocalDateTime analysisTimestamp;
}
