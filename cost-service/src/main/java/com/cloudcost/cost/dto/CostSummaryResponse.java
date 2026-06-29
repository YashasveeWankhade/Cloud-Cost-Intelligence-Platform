package com.cloudcost.cost.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class CostSummaryResponse {
    private String accountId;
    private BigDecimal monthToDateCost;
    private BigDecimal yesterdayCost;
    private BigDecimal last7DaysCost;
    private List<ServiceCostSummary> topServices;
}
