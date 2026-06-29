package com.cloudcost.cost.service;

import com.cloudcost.cost.dto.CostDataResult;
import com.cloudcost.cost.dto.KafkaCostEvent;
import com.cloudcost.cost.dto.MetricDataResult;
import com.cloudcost.cost.dto.TrailEventResult;
import com.cloudcost.cost.entity.AwsAccount;
import com.cloudcost.cost.entity.CloudtrailEvent;
import com.cloudcost.cost.entity.CloudwatchMetric;
import com.cloudcost.cost.entity.DailyCost;
import com.cloudcost.cost.provider.CloudProvider;
import com.cloudcost.cost.repository.AwsAccountRepository;
import com.cloudcost.cost.repository.CloudtrailEventRepository;
import com.cloudcost.cost.repository.CloudwatchMetricRepository;
import com.cloudcost.cost.repository.DailyCostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CostCollectionService {

    private final CloudProvider cloudProvider;
    private final AwsAccountRepository accountRepository;
    private final DailyCostRepository dailyCostRepository;
    private final CloudwatchMetricRepository metricRepository;
    private final CloudtrailEventRepository trailRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    // Collect daily costs every hour in demo mode
    @Scheduled(fixedDelayString = "3600000", initialDelayString = "10000")
    public void scheduledCollection() {
        List<AwsAccount> accounts = accountRepository.findAll();
        for (AwsAccount account : accounts) {
            if (account.getStatus() == AwsAccount.AccountStatus.ACTIVE) {
                try {
                    collectForAccount(account, LocalDate.now().minusDays(1), LocalDate.now());
                } catch (Exception e) {
                    log.error("Collection failed for account {}: {}", account.getAccountId(), e.getMessage());
                }
            }
        }
    }

    @Transactional
    public void bootstrapHistoricalData(AwsAccount account) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(180);
        log.info("Bootstrapping 180 days of historical data for account {}", account.getAccountId());
        collectForAccount(account, start, end);
        // Collect metrics and trail events for last 30 days
        collectMetricsAndTrail(account, LocalDateTime.now().minusDays(30), LocalDateTime.now());
        account.setLastSyncAt(LocalDateTime.now());
        accountRepository.save(account);
    }

    @Transactional
    public void collectForAccount(AwsAccount account, LocalDate start, LocalDate end) {
        List<CostDataResult> costData = cloudProvider.fetchCostData(account.getAccountId(), start, end);
        int saved = 0;
        for (CostDataResult result : costData) {
            if (!dailyCostRepository.existsByAccountIdAndServiceNameAndCostDate(
                    result.getAccountId(), result.getServiceName(), result.getDate())) {
                DailyCost dc = DailyCost.builder()
                        .accountId(result.getAccountId())
                        .serviceName(result.getServiceName())
                        .costDate(result.getDate())
                        .amount(result.getAmount())
                        .currency(result.getCurrency())
                        .region(result.getRegion())
                        .usageType(result.getUsageType())
                        .build();
                dailyCostRepository.save(dc);

                // Publish to Kafka for analytics
                KafkaCostEvent event = KafkaCostEvent.builder()
                        .eventType("CostDataCollected")
                        .accountId(result.getAccountId())
                        .serviceName(result.getServiceName())
                        .costDate(result.getDate())
                        .amount(result.getAmount())
                        .currency(result.getCurrency())
                        .timestamp(System.currentTimeMillis())
                        .build();
                kafkaTemplate.send("cost-data", account.getAccountId(), event);
                saved++;
            }
        }
        log.info("Saved {} new cost records for account {}", saved, account.getAccountId());
    }

    @Transactional
    public void collectMetricsAndTrail(AwsAccount account, LocalDateTime start, LocalDateTime end) {
        List<String> services = List.of("EC2", "RDS", "S3", "Lambda", "CloudFront", "DynamoDB");
        for (String service : services) {
            List<MetricDataResult> metrics = cloudProvider.fetchMetrics(account.getAccountId(), service, start, end);
            for (MetricDataResult m : metrics) {
                CloudwatchMetric metric = CloudwatchMetric.builder()
                        .accountId(m.getAccountId())
                        .serviceName(m.getServiceName())
                        .metricName(m.getMetricName())
                        .metricValue(m.getValue())
                        .unit(m.getUnit())
                        .resourceId(m.getResourceId())
                        .timestamp(m.getTimestamp())
                        .build();
                metricRepository.save(metric);
            }
        }

        List<TrailEventResult> trailEvents = cloudProvider.fetchTrailEvents(account.getAccountId(), start, end);
        for (TrailEventResult t : trailEvents) {
            CloudtrailEvent event = CloudtrailEvent.builder()
                    .accountId(t.getAccountId())
                    .eventType(t.getEventType())
                    .serviceName(t.getServiceName())
                    .resourceId(t.getResourceId())
                    .resourceType(t.getResourceType())
                    .metadata(t.getMetadata())
                    .eventSource(t.getEventSource())
                    .timestamp(t.getTimestamp())
                    .injectedCause(t.getInjectedCause())
                    .build();
            trailRepository.save(event);
        }
    }
}
