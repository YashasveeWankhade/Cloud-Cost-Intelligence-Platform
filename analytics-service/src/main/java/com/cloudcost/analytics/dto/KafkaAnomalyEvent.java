package com.cloudcost.analytics.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data @Builder
public class KafkaAnomalyEvent {
    private String eventType;
    private Long anomalyId;
    private String accountId;
    private String serviceName;
    private LocalDate costDate;
    private BigDecimal expectedCost;
    private BigDecimal actualCost;
    private Double increasePercentage;
    private String severity;
    private String rootCause;
    private Double rootCauseConfidence;
    private List<String> evidenceSummary;
    private long timestamp;
}
