package com.cloudcost.cost.controller;

import com.cloudcost.cost.dto.AwsAccountResponse;
import com.cloudcost.cost.dto.ConnectAccountRequest;
import com.cloudcost.cost.service.AwsAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/demo")
@RequiredArgsConstructor
@Slf4j
public class DemoController {

    private final AwsAccountService accountService;

    @PostMapping("/initialize")
    public ResponseEntity<Map<String, Object>> initializeDemo() {
        log.info("Initializing demo environment...");

        ConnectAccountRequest request = new ConnectAccountRequest();
        request.setAccountName("Demo AWS Account");
        request.setAccountId("123456789012");
        request.setRegion("us-east-1");
        request.setAccessKeyId("DEMO_KEY");
        request.setSecretAccessKey("DEMO_SECRET");
        request.setDescription("Demo account with 6 months of synthetic data");

        AwsAccountResponse account = accountService.connectAccount(request, 1L);
        log.info("Demo environment initialized with account: {}", account.getAccountId());

        return ResponseEntity.ok(Map.of(
                "message", "Demo environment initialized successfully",
                "accountId", account.getAccountId(),
                "accountName", account.getAccountName(),
                "status", account.getStatus()
        ));
    }
}
