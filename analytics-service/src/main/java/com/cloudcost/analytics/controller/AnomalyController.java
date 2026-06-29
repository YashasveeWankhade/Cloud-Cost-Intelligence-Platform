package com.cloudcost.analytics.controller;

import com.cloudcost.analytics.entity.CostAnomaly;
import com.cloudcost.analytics.service.AnomalyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnomalyController {

    private final AnomalyService anomalyService;

    @GetMapping("/anomalies")
    public ResponseEntity<List<CostAnomaly>> getAllAnomalies() {
        return ResponseEntity.ok(anomalyService.getAllAnomalies());
    }

    @GetMapping("/anomalies/account/{accountId}")
    public ResponseEntity<List<CostAnomaly>> getByAccount(@PathVariable String accountId) {
        return ResponseEntity.ok(anomalyService.getAnomaliesByAccount(accountId));
    }

    @GetMapping("/anomalies/open")
    public ResponseEntity<List<CostAnomaly>> getOpenAnomalies() {
        return ResponseEntity.ok(anomalyService.getOpenAnomalies());
    }

    @GetMapping("/anomalies/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "openAnomalies", anomalyService.countOpenAnomalies(),
                "timestamp", System.currentTimeMillis()
        ));
    }

    @PutMapping("/anomalies/{id}/resolve")
    public ResponseEntity<Map<String, String>> resolveAnomaly(@PathVariable Long id) {
        anomalyService.resolveAnomaly(id);
        return ResponseEntity.ok(Map.of("message", "Anomaly resolved"));
    }
}
