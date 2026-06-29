package com.cloudcost.cost.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder
public class KafkaCostEvent {
    private String eventType;
    private String accountId;
    private String serviceName;
    private LocalDate costDate;
    private BigDecimal amount;
    private String currency;
    private long timestamp;
}
