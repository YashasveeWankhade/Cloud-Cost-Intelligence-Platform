package com.cloudcost.cost.dto;

import com.cloudcost.cost.entity.AwsAccount;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class AwsAccountResponse {
    private Long id;
    private String accountName;
    private String accountId;
    private String region;
    private AwsAccount.AccountStatus status;
    private String description;
    private LocalDateTime lastSyncAt;
    private LocalDateTime createdAt;
}
