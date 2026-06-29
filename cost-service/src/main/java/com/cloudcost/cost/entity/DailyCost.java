package com.cloudcost.cost.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_costs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"account_id", "service_name", "cost_date"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DailyCost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private String accountId;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "cost_date", nullable = false)
    private LocalDate costDate;

    @Column(nullable = false, precision = 15, scale = 4)
    private BigDecimal amount;

    private String currency;
    private String region;
    private String usageType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (currency == null) currency = "USD";
    }
}
