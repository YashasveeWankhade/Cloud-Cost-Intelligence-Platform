package com.cloudcost.cost.provider;

import com.cloudcost.cost.dto.CostDataResult;
import com.cloudcost.cost.dto.MetricDataResult;
import com.cloudcost.cost.dto.TrailEventResult;
import com.cloudcost.cost.simulator.SyntheticDataGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component("mockCloudProvider")
@RequiredArgsConstructor
@Slf4j
public class MockCloudProvider implements CloudProvider {

    private final SyntheticDataGenerator generator;

    @Override
    public String getName() {
        return "mock";
    }

    @Override
    public boolean validateCredentials(String accountId, String accessKey, String secretKey) {
        log.info("Mock: validating credentials for account {}", accountId);
        return true;
    }

    @Override
    public List<CostDataResult> fetchCostData(String accountId, LocalDate start, LocalDate end) {
        log.info("Mock: fetching cost data for account {} from {} to {}", accountId, start, end);
        return generator.generateCostData(accountId, start, end);
    }

    @Override
    public List<MetricDataResult> fetchMetrics(String accountId, String serviceName, LocalDateTime start, LocalDateTime end) {
        log.info("Mock: fetching metrics for account {} service {}", accountId, serviceName);
        return generator.generateMetrics(accountId, serviceName, start, end);
    }

    @Override
    public List<TrailEventResult> fetchTrailEvents(String accountId, LocalDateTime start, LocalDateTime end) {
        log.info("Mock: fetching trail events for account {}", accountId);
        return generator.generateTrailEvents(accountId, start, end);
    }
}
