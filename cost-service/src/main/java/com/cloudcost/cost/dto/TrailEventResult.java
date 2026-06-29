package com.cloudcost.cost.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class TrailEventResult {
    private String accountId;
    private String eventType;
    private String serviceName;
    private String resourceId;
    private String resourceType;
    private String metadata;
    private String eventSource;
    private LocalDateTime timestamp;
    private String injectedCause;
}
