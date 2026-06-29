package com.cloudcost.recommendation.controller;

import com.cloudcost.recommendation.entity.Recommendation;
import com.cloudcost.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService service;

    @GetMapping
    public ResponseEntity<List<Recommendation>> getAll() {
        return ResponseEntity.ok(service.getAllRecommendations());
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<Recommendation>> getByAccount(@PathVariable String accountId) {
        return ResponseEntity.ok(service.getByAccount(accountId));
    }

    @GetMapping("/savings")
    public ResponseEntity<Map<String, Object>> getTotalSavings() {
        BigDecimal savings = service.getTotalPotentialSavings();
        return ResponseEntity.ok(Map.of("potentialMonthlySavings", savings));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> updateStatus(
            @PathVariable Long id,
            @RequestParam Recommendation.RecommendationStatus status) {
        service.updateStatus(id, status);
        return ResponseEntity.ok(Map.of("message", "Status updated"));
    }
}
