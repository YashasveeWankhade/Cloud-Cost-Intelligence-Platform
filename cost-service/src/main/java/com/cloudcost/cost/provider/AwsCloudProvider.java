package com.cloudcost.cost.provider;

import com.cloudcost.cost.dto.CostDataResult;
import com.cloudcost.cost.dto.MetricDataResult;
import com.cloudcost.cost.dto.TrailEventResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Real AWS provider — uses AWS SDK (Cost Explorer, CloudWatch, CloudTrail).
 * Activated by setting cloud.provider=aws and supplying valid credentials.
 * In the current portfolio build, this is a stub; the SDK dependency is omitted
 * to keep Docker images lean for demo/simulation use cases.
 */
@Component("awsCloudProvider")
@ConditionalOnProperty(name = "cloud.provider", havingValue = "aws")
@Slf4j
public class AwsCloudProvider implements CloudProvider {

    @Override
    public String getName() {
        return "aws";
    }

    @Override
    public boolean validateCredentials(String accountId, String accessKey, String secretKey) {
        // TODO: use STS GetCallerIdentity to validate credentials
        log.warn("AWS provider: real credential validation not yet implemented");
        return false;
    }

    @Override
    public List<CostDataResult> fetchCostData(String accountId, LocalDate start, LocalDate end) {
        // TODO: implement via AWS Cost Explorer GetCostAndUsage API
        throw new UnsupportedOperationException("AWS provider not implemented in demo build — set cloud.provider=mock");
    }

    @Override
    public List<MetricDataResult> fetchMetrics(String accountId, String serviceName, LocalDateTime start, LocalDateTime end) {
        // TODO: implement via CloudWatch GetMetricData API
        throw new UnsupportedOperationException("AWS provider not implemented in demo build — set cloud.provider=mock");
    }

    @Override
    public List<TrailEventResult> fetchTrailEvents(String accountId, LocalDateTime start, LocalDateTime end) {
        // TODO: implement via CloudTrail LookupEvents API
        throw new UnsupportedOperationException("AWS provider not implemented in demo build — set cloud.provider=mock");
    }
}
