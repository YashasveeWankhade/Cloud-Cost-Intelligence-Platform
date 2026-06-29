package com.cloudcost.cost.repository;

import com.cloudcost.cost.entity.CloudwatchMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CloudwatchMetricRepository extends JpaRepository<CloudwatchMetric, Long> {
    List<CloudwatchMetric> findByAccountIdAndServiceNameAndTimestampBetweenOrderByTimestampAsc(
            String accountId, String serviceName, LocalDateTime start, LocalDateTime end);

    List<CloudwatchMetric> findByAccountIdAndServiceNameAndMetricNameAndTimestampBetweenOrderByTimestampDesc(
            String accountId, String serviceName, String metricName, LocalDateTime start, LocalDateTime end);
}
