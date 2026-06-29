package com.cloudcost.cost.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "aws_accounts")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AwsAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String accountName;

    @Column(nullable = false, unique = true)
    private String accountId;

    private String region;

    @Enumerated(EnumType.STRING)
    private AccountStatus status;

    @Column(name = "access_key_id")
    private String accessKeyId;

    @Column(name = "secret_access_key")
    private String secretAccessKey;

    private String description;

    @Column(nullable = false)
    private Long ownerId;

    private LocalDateTime lastSyncAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum AccountStatus {
        ACTIVE, INACTIVE, ERROR, PENDING
    }
}
