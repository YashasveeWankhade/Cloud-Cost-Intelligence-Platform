package com.cloudcost.analytics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cost_anomalies")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CostAnomaly {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private String accountId;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "cost_date", nullable = false)
    private LocalDate costDate;

    @Column(name = "expected_cost", nullable = false, precision = 15, scale = 4)
    private BigDecimal expectedCost;

    @Column(name = "actual_cost", nullable = false, precision = 15, scale = 4)
    private BigDecimal actualCost;

    @Column(name = "increase_percentage", nullable = false)
    private Double increasePercentage;

    @Column(name = "z_score")
    private Double zScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnomalyStatus status;

    @Column(name = "root_cause")
    private String rootCause;

    @Column(name = "root_cause_confidence")
    private Double rootCauseConfidence;

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "first_detected", nullable = false)
    private LocalDateTime firstDetected;

    @Column(name = "last_detected")
    private LocalDateTime lastDetected;

    @Column(name = "resolved_time")
    private LocalDateTime resolvedTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = AnomalyStatus.OPEN;
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum AnomalyStatus {
        OPEN, INVESTIGATING, RESOLVED
    }
}
