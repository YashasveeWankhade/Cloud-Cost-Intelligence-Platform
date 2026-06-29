package com.cloudcost.cost.provider;

import com.cloudcost.cost.dto.CostDataResult;
import com.cloudcost.cost.dto.MetricDataResult;
import com.cloudcost.cost.dto.TrailEventResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface CloudProvider {
    String getName();
    boolean validateCredentials(String accountId, String accessKey, String secretKey);
    List<CostDataResult> fetchCostData(String accountId, LocalDate start, LocalDate end);
    List<MetricDataResult> fetchMetrics(String accountId, String serviceName, LocalDateTime start, LocalDateTime end);
    List<TrailEventResult> fetchTrailEvents(String accountId, LocalDateTime start, LocalDateTime end);
}
