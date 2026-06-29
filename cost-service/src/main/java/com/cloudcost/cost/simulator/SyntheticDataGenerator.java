package com.cloudcost.cost.simulator;

import com.cloudcost.cost.dto.CostDataResult;
import com.cloudcost.cost.dto.MetricDataResult;
import com.cloudcost.cost.dto.TrailEventResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

@Component
@Slf4j
public class SyntheticDataGenerator {

    private static final Random RANDOM = new Random(42);

    private static final List<ServiceProfile> PROFILES = List.of(
            ServiceProfile.builder().serviceName("EC2").baseCostMin(250).baseCostMax(350)
                    .weekdayMultiplier(1.0).weekendMultiplier(0.7)
                    .anomalyType("COST_EXPLOSION").anomalyMultiplier(4.0)
                    .injectedCause("Autoscaling Event").build(),
            ServiceProfile.builder().serviceName("RDS").baseCostMin(80).baseCostMax(120)
                    .weekdayMultiplier(1.0).weekendMultiplier(0.85)
                    .anomalyType("READ_REPLICA").anomalyMultiplier(7.0)
                    .injectedCause("Read Replica Creation").build(),
            ServiceProfile.builder().serviceName("S3").baseCostMin(40).baseCostMax(70)
                    .weekdayMultiplier(1.0).weekendMultiplier(0.9)
                    .anomalyType("STORAGE_SPIKE").anomalyMultiplier(10.0)
                    .injectedCause("Massive Backup Upload").build(),
            ServiceProfile.builder().serviceName("Lambda").baseCostMin(10).baseCostMax(50)
                    .weekdayMultiplier(1.0).weekendMultiplier(0.6)
                    .anomalyType("INVOCATION_SURGE").anomalyMultiplier(12.5)
                    .injectedCause("Unexpected Invocation Growth").build(),
            ServiceProfile.builder().serviceName("CloudFront").baseCostMin(20).baseCostMax(80)
                    .weekdayMultiplier(1.0).weekendMultiplier(1.2)
                    .anomalyType("TRAFFIC_SPIKE").anomalyMultiplier(10.0)
                    .injectedCause("Traffic Spike").build(),
            ServiceProfile.builder().serviceName("DynamoDB").baseCostMin(15).baseCostMax(60)
                    .weekdayMultiplier(1.0).weekendMultiplier(0.75)
                    .anomalyType("CAPACITY_BURST").anomalyMultiplier(6.0)
                    .injectedCause("On-Demand Capacity Burst").build()
    );

    // Generate anomaly windows: inject 1 anomaly per service in last 30 days, spread out
    private final Map<String, LocalDate> anomalyDates = new HashMap<>();

    public SyntheticDataGenerator() {
        LocalDate today = LocalDate.now();
        // Place each service anomaly on a different day in the last 15-25 days
        int offset = 5;
        for (ServiceProfile profile : PROFILES) {
            anomalyDates.put(profile.getServiceName(), today.minusDays(offset));
            offset += 3;
        }
    }

    public List<CostDataResult> generateCostData(String accountId, LocalDate start, LocalDate end) {
        List<CostDataResult> results = new ArrayList<>();

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            for (ServiceProfile profile : PROFILES) {
                double amount = generateDailyCost(profile, date);
                results.add(CostDataResult.builder()
                        .accountId(accountId)
                        .serviceName(profile.getServiceName())
                        .date(date)
                        .amount(BigDecimal.valueOf(amount).setScale(4, RoundingMode.HALF_UP))
                        .currency("USD")
                        .region("us-east-1")
                        .usageType(profile.getServiceName() + ":Usage")
                        .build());
            }
        }
        return results;
    }

    private double generateDailyCost(ServiceProfile profile, LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        boolean isWeekend = dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
        double multiplier = isWeekend ? profile.getWeekendMultiplier() : profile.getWeekdayMultiplier();

        // Base cost with natural variation
        double base = profile.getBaseCostMin() +
                (profile.getBaseCostMax() - profile.getBaseCostMin()) * seededRandom(profile.getServiceName(), date);

        // Seasonal: slight monthly trend
        double seasonality = 1.0 + 0.05 * Math.sin(2 * Math.PI * date.getDayOfYear() / 365.0);

        double cost = base * multiplier * seasonality;

        // Anomaly injection: 3-day window
        LocalDate anomalyDate = anomalyDates.get(profile.getServiceName());
        if (anomalyDate != null) {
            long daysFromAnomaly = Math.abs(date.toEpochDay() - anomalyDate.toEpochDay());
            if (daysFromAnomaly <= 2) {
                double anomalyFactor = profile.getAnomalyMultiplier() * (1.0 - daysFromAnomaly * 0.3);
                cost = cost * anomalyFactor;
            }
        }

        return cost;
    }

    private double seededRandom(String service, LocalDate date) {
        long seed = service.hashCode() * 31L + date.toEpochDay();
        Random r = new Random(seed);
        return r.nextDouble();
    }

    public List<MetricDataResult> generateMetrics(String accountId, String serviceName, LocalDateTime start, LocalDateTime end) {
        List<MetricDataResult> results = new ArrayList<>();
        ServiceProfile profile = PROFILES.stream()
                .filter(p -> p.getServiceName().equals(serviceName))
                .findFirst().orElse(null);
        if (profile == null) return results;

        LocalDateTime anomalyDateTime = anomalyDates.getOrDefault(serviceName, LocalDate.now().minusDays(100))
                .atTime(14, 10);

        LocalDateTime current = start;
        while (!current.isAfter(end)) {
            boolean isAnomaly = Math.abs(Duration.between(current, anomalyDateTime).toHours()) <= 48;
            double anomalyFactor = isAnomaly ? profile.getAnomalyMultiplier() : 1.0;

            switch (serviceName) {
                case "EC2" -> {
                    results.add(metric(accountId, serviceName, "InstanceCount",
                            isAnomaly ? 20.0 : 5.0, "Count", current));
                    results.add(metric(accountId, serviceName, "CPUUtilization",
                            isAnomaly ? 85.0 : 22.0, "Percent", current));
                    results.add(metric(accountId, serviceName, "NetworkOut",
                            isAnomaly ? 900.0 : 50.0, "MB", current));
                }
                case "RDS" -> {
                    results.add(metric(accountId, serviceName, "CPUUtilization",
                            isAnomaly ? 78.0 : 25.0, "Percent", current));
                    results.add(metric(accountId, serviceName, "DatabaseConnections",
                            isAnomaly ? 450.0 : 80.0, "Count", current));
                    results.add(metric(accountId, serviceName, "FreeStorageSpace",
                            isAnomaly ? 5.0 : 40.0, "GB", current));
                }
                case "S3" -> {
                    results.add(metric(accountId, serviceName, "BucketSizeBytes",
                            isAnomaly ? 5000.0 : 200.0, "GB", current));
                    results.add(metric(accountId, serviceName, "NumberOfObjects",
                            isAnomaly ? 2000000.0 : 50000.0, "Count", current));
                }
                case "Lambda" -> {
                    results.add(metric(accountId, serviceName, "Invocations",
                            isAnomaly ? 5000000.0 : 100000.0, "Count", current));
                    results.add(metric(accountId, serviceName, "Duration",
                            isAnomaly ? 3000.0 : 250.0, "Milliseconds", current));
                    results.add(metric(accountId, serviceName, "Errors",
                            isAnomaly ? 1200.0 : 10.0, "Count", current));
                }
                case "CloudFront" -> {
                    results.add(metric(accountId, serviceName, "Requests",
                            isAnomaly ? 10000000.0 : 500000.0, "Count", current));
                    results.add(metric(accountId, serviceName, "BytesDownloaded",
                            isAnomaly ? 2000.0 : 100.0, "GB", current));
                }
                case "DynamoDB" -> {
                    results.add(metric(accountId, serviceName, "ConsumedReadCapacityUnits",
                            isAnomaly ? 50000.0 : 2000.0, "Count", current));
                    results.add(metric(accountId, serviceName, "ThrottledRequests",
                            isAnomaly ? 5000.0 : 0.0, "Count", current));
                }
            }
            current = current.plusHours(1);
        }
        return results;
    }

    private MetricDataResult metric(String accountId, String serviceName, String name, double value, String unit, LocalDateTime ts) {
        return MetricDataResult.builder()
                .accountId(accountId)
                .serviceName(serviceName)
                .metricName(name)
                .value(value + (RANDOM.nextDouble() * value * 0.05))
                .unit(unit)
                .resourceId(serviceName.toLowerCase() + "-resource-1")
                .timestamp(ts)
                .build();
    }

    public List<TrailEventResult> generateTrailEvents(String accountId, LocalDateTime start, LocalDateTime end) {
        List<TrailEventResult> results = new ArrayList<>();

        for (ServiceProfile profile : PROFILES) {
            LocalDate anomalyDate = anomalyDates.get(profile.getServiceName());
            if (anomalyDate == null) continue;

            LocalDateTime eventTime = anomalyDate.atTime(14, 10);
            if (!eventTime.isBefore(start) && !eventTime.isAfter(end)) {
                results.add(buildTrailEvent(accountId, profile, eventTime));
            }
        }

        // Add routine events (noise)
        LocalDateTime current = start;
        while (!current.isAfter(end)) {
            if (RANDOM.nextDouble() < 0.05) {
                results.add(TrailEventResult.builder()
                        .accountId(accountId)
                        .eventType("DescribeInstances")
                        .serviceName("EC2")
                        .resourceId("ec2-routine")
                        .resourceType("Instance")
                        .metadata("{\"action\": \"describe\"}")
                        .eventSource("ec2.amazonaws.com")
                        .timestamp(current)
                        .build());
            }
            current = current.plusHours(6);
        }

        results.sort(Comparator.comparing(TrailEventResult::getTimestamp));
        return results;
    }

    private TrailEventResult buildTrailEvent(String accountId, ServiceProfile profile, LocalDateTime eventTime) {
        String eventType = switch (profile.getServiceName()) {
            case "EC2" -> "ScaleOut";
            case "RDS" -> "CreateReadReplica";
            case "S3" -> "UploadLargeBackup";
            case "Lambda" -> "UpdateFunctionCode";
            case "CloudFront" -> "TrafficBurst";
            case "DynamoDB" -> "UpdateTableCapacity";
            default -> "ConfigChange";
        };

        String metadata = String.format(
                "{\"cause\": \"%s\", \"service\": \"%s\", \"eventType\": \"%s\"}",
                profile.getInjectedCause(), profile.getServiceName(), eventType);

        return TrailEventResult.builder()
                .accountId(accountId)
                .eventType(eventType)
                .serviceName(profile.getServiceName())
                .resourceId(profile.getServiceName().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8))
                .resourceType(profile.getServiceName())
                .metadata(metadata)
                .eventSource(profile.getServiceName().toLowerCase() + ".amazonaws.com")
                .timestamp(eventTime)
                .injectedCause(profile.getInjectedCause())
                .build();
    }

    public Map<String, LocalDate> getAnomalyDates() {
        return Collections.unmodifiableMap(anomalyDates);
    }
}
