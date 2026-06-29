package com.cloudcost.cost.controller;

import com.cloudcost.cost.dto.*;
import com.cloudcost.cost.service.AwsAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/costs")
@RequiredArgsConstructor
public class CostController {

    private final AwsAccountService accountService;

    @PostMapping("/accounts")
    public ResponseEntity<AwsAccountResponse> connectAccount(
            @Valid @RequestBody ConnectAccountRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(accountService.connectAccount(request, userId));
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<AwsAccountResponse>> listAccounts(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(accountService.listAccounts(userId));
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<AwsAccountResponse> getAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(accountService.getAccount(accountId));
    }

    @DeleteMapping("/accounts/{accountId}")
    public ResponseEntity<Void> disconnectAccount(@PathVariable Long accountId) {
        accountService.disconnectAccount(accountId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/accounts/{accountId}/refresh")
    public ResponseEntity<Map<String, String>> refreshAccount(@PathVariable Long accountId) {
        accountService.refreshAccount(accountId);
        return ResponseEntity.ok(Map.of("message", "Data refresh initiated"));
    }

    @GetMapping("/summary/{accountId}")
    public ResponseEntity<CostSummaryResponse> getSummary(@PathVariable String accountId) {
        return ResponseEntity.ok(accountService.getCostSummary(accountId));
    }

    @GetMapping("/daily/{accountId}")
    public ResponseEntity<List<DailyCostResponse>> getDailyCosts(
            @PathVariable String accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(accountService.getDailyCosts(accountId, start, end));
    }
}
