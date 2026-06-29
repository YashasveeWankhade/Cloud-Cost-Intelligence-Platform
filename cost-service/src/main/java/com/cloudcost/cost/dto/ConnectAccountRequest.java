package com.cloudcost.cost.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConnectAccountRequest {
    @NotBlank
    private String accountName;
    @NotBlank
    private String accountId;
    private String region;
    private String accessKeyId;
    private String secretAccessKey;
    private String description;
}
