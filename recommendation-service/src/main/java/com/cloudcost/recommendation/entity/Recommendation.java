package com.cloudcost.recommendation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendations")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anomaly_id")
    private Long anomalyId;

    @Column(name = "account_id", nullable = false)
    private String accountId;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "root_cause")
    private String rootCause;

    @Column(name = "root_cause_confidence")
    private Double rootCauseConfidence;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String explanation;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String recommendation;

    @Column(name = "estimated_monthly_savings", precision = 15, scale = 2)
    private BigDecimal estimatedMonthlySavings;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecommendationStatus status;

    @Column(name = "ai_generated")
    private boolean aiGenerated;

    @Column(name = "cost_increase_percentage")
    private Double costIncreasePercentage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum RecommendationStatus {
        PENDING, ACCEPTED, DISMISSED, IMPLEMENTED
    }
}
