package com.cloudcost.cost.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder
public class CostDataResult {
    private String accountId;
    private String serviceName;
    private LocalDate date;
    private BigDecimal amount;
    private String currency;
    private String region;
    private String usageType;
}
