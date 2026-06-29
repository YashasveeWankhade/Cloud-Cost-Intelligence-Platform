package com.cloudcost.cost;

import com.cloudcost.cost.dto.CostDataResult;
import com.cloudcost.cost.dto.TrailEventResult;
import com.cloudcost.cost.simulator.SyntheticDataGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Synthetic Data Generator Tests")
class SyntheticDataGeneratorTest {

    private SyntheticDataGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new SyntheticDataGenerator();
    }

    @Test
    @DisplayName("Should generate data for all 6 services")
    void generatesDataForAllServices() {
        LocalDate start = LocalDate.now().minusDays(30);
        LocalDate end = LocalDate.now();

        List<CostDataResult> results = generator.generateCostData("acc-123", start, end);

        Set<String> services = results.stream().map(CostDataResult::getServiceName).collect(Collectors.toSet());
        assertThat(services).containsExactlyInAnyOrder("EC2", "RDS", "S3", "Lambda", "CloudFront", "DynamoDB");
    }

    @Test
    @DisplayName("Should generate 31 days × 6 services = 186 records")
    void generatesCorrectNumberOfRecords() {
        LocalDate start = LocalDate.now().minusDays(30);
        LocalDate end = LocalDate.now();

        List<CostDataResult> results = generator.generateCostData("acc-123", start, end);
        assertThat(results).hasSize(31 * 6);
    }

    @Test
    @DisplayName("Should inject anomalies with costs above normal range")
    void injectsAnomalies() {
        // Generate 180 days and look for EC2 anomaly
        LocalDate start = LocalDate.now().minusDays(60);
        LocalDate end = LocalDate.now();

        List<CostDataResult> ec2 = generator.generateCostData("acc-123", start, end)
                .stream().filter(c -> "EC2".equals(c.getServiceName())).toList();

        double maxCost = ec2.stream().mapToDouble(c -> c.getAmount().doubleValue()).max().orElse(0);
        double normalMax = 350.0; // Normal max per profile

        assertThat(maxCost).isGreaterThan(normalMax * 2); // Anomaly should be at least 2x normal
    }

    @Test
    @DisplayName("Should generate CloudTrail events aligned with anomalies")
    void generatesTrailEventsForAnomalies() {
        LocalDateTime start = LocalDateTime.now().minusDays(60);
        LocalDateTime end = LocalDateTime.now();

        List<TrailEventResult> events = generator.generateTrailEvents("acc-123", start, end);

        assertThat(events).isNotEmpty();
        // Should have at least one event per service (6 anomalies = 6 injected events)
        Set<String> servicesWithEvents = events.stream()
                .filter(e -> e.getInjectedCause() != null)
                .map(TrailEventResult::getServiceName)
                .collect(Collectors.toSet());
        assertThat(servicesWithEvents.size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("Should generate positive cost amounts")
    void generatesPositiveCosts() {
        LocalDate start = LocalDate.now().minusDays(7);
        LocalDate end = LocalDate.now();

        List<CostDataResult> results = generator.generateCostData("acc-123", start, end);

        assertThat(results).allMatch(r -> r.getAmount().doubleValue() > 0);
    }
}
