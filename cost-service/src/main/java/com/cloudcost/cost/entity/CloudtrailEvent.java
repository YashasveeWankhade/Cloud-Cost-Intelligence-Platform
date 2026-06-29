package com.cloudcost.cost.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cloudtrail_events")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CloudtrailEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private String accountId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "resource_type")
    private String resourceType;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "event_source")
    private String eventSource;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "injected_cause")
    private String injectedCause;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
