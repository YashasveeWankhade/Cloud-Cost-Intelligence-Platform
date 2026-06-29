package com.cloudcost.cost.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data @Builder
public class ServiceCostSummary {
    private String serviceName;
    private BigDecimal totalCost;
}
