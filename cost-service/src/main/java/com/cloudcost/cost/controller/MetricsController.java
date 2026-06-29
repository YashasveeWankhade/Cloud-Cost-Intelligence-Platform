package com.cloudcost.cost.controller;

import com.cloudcost.cost.entity.CloudtrailEvent;
import com.cloudcost.cost.entity.CloudwatchMetric;
import com.cloudcost.cost.repository.CloudtrailEventRepository;
import com.cloudcost.cost.repository.CloudwatchMetricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/costs")
@RequiredArgsConstructor
public class MetricsController {

    private final CloudwatchMetricRepository metricRepository;
    private final CloudtrailEventRepository trailRepository;

    @GetMapping("/metrics/{accountId}")
    public ResponseEntity<List<CloudwatchMetric>> getMetrics(
            @PathVariable String accountId,
            @RequestParam String serviceName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(
                metricRepository.findByAccountIdAndServiceNameAndTimestampBetweenOrderByTimestampAsc(
                        accountId, serviceName, start, end));
    }

    @GetMapping("/trail/{accountId}")
    public ResponseEntity<List<CloudtrailEvent>> getTrailEvents(
            @PathVariable String accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(
                trailRepository.findByAccountIdAndTimestampBetweenOrderByTimestampAsc(accountId, start, end));
    }
}
