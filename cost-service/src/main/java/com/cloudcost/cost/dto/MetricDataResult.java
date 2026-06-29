package com.cloudcost.cost.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class MetricDataResult {
    private String accountId;
    private String serviceName;
    private String metricName;
    private Double value;
    private String unit;
    private String resourceId;
    private LocalDateTime timestamp;
}
