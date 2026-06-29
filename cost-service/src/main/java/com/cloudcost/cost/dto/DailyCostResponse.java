package com.cloudcost.cost.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder
public class DailyCostResponse {
    private String serviceName;
    private LocalDate date;
    private BigDecimal amount;
    private String currency;
}
