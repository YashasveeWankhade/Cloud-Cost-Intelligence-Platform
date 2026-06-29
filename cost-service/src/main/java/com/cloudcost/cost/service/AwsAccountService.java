package com.cloudcost.cost.service;

import com.cloudcost.cost.dto.*;
import com.cloudcost.cost.entity.AwsAccount;
import com.cloudcost.cost.provider.CloudProvider;
import com.cloudcost.cost.repository.AwsAccountRepository;
import com.cloudcost.cost.repository.DailyCostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AwsAccountService {

    private final AwsAccountRepository accountRepository;
    private final DailyCostRepository dailyCostRepository;
    private final CloudProvider cloudProvider;
    private final CostCollectionService collectionService;

    @Transactional
    public AwsAccountResponse connectAccount(ConnectAccountRequest request, Long userId) {
        if (accountRepository.existsByAccountId(request.getAccountId())) {
            throw new IllegalArgumentException("Account already connected: " + request.getAccountId());
        }

        boolean valid = cloudProvider.validateCredentials(request.getAccountId(),
                request.getAccessKeyId(), request.getSecretAccessKey());

        AwsAccount account = AwsAccount.builder()
                .accountName(request.getAccountName())
                .accountId(request.getAccountId())
                .region(request.getRegion() != null ? request.getRegion() : "us-east-1")
                .status(valid ? AwsAccount.AccountStatus.ACTIVE : AwsAccount.AccountStatus.ERROR)
                .accessKeyId(request.getAccessKeyId())
                .secretAccessKey(request.getSecretAccessKey())
                .description(request.getDescription())
                .ownerId(userId)
                .build();

        accountRepository.save(account);

        if (valid) {
            // Bootstrap data asynchronously (in demo it's fast enough inline)
            collectionService.bootstrapHistoricalData(account);
        }

        log.info("AWS account connected: {} ({})", account.getAccountName(), account.getAccountId());
        return toResponse(account);
    }

    public List<AwsAccountResponse> listAccounts(Long userId) {
        return accountRepository.findByOwnerId(userId).stream()
                .map(this::toResponse).toList();
    }

    public AwsAccountResponse getAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountId));
    }

    @Transactional
    public void disconnectAccount(Long accountId) {
        accountRepository.findById(accountId).ifPresent(account -> {
            account.setStatus(AwsAccount.AccountStatus.INACTIVE);
            accountRepository.save(account);
        });
    }

    @Transactional
    public void refreshAccount(Long accountId) {
        AwsAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        collectionService.bootstrapHistoricalData(account);
    }

    public CostSummaryResponse getCostSummary(String accountId) {
        LocalDate today = LocalDate.now();
        BigDecimal monthTotal = dailyCostRepository.sumByAccountIdAndDateRange(
                accountId, today.withDayOfMonth(1), today);
        BigDecimal yesterdayTotal = dailyCostRepository.sumByAccountIdAndDateRange(
                accountId, today.minusDays(1), today.minusDays(1));
        BigDecimal weekTotal = dailyCostRepository.sumByAccountIdAndDateRange(
                accountId, today.minusDays(7), today);

        List<Object[]> topServices = dailyCostRepository.findServiceTotals(
                accountId, today.minusDays(30), today);

        return CostSummaryResponse.builder()
                .accountId(accountId)
                .monthToDateCost(monthTotal != null ? monthTotal : BigDecimal.ZERO)
                .yesterdayCost(yesterdayTotal != null ? yesterdayTotal : BigDecimal.ZERO)
                .last7DaysCost(weekTotal != null ? weekTotal : BigDecimal.ZERO)
                .topServices(topServices.stream().limit(5).map(row ->
                        ServiceCostSummary.builder()
                                .serviceName((String) row[0])
                                .totalCost((BigDecimal) row[1])
                                .build()).toList())
                .build();
    }

    public List<DailyCostResponse> getDailyCosts(String accountId, LocalDate start, LocalDate end) {
        return dailyCostRepository.findByAccountIdAndCostDateBetweenOrderByCostDateAsc(accountId, start, end)
                .stream().map(dc -> DailyCostResponse.builder()
                        .serviceName(dc.getServiceName())
                        .date(dc.getCostDate())
                        .amount(dc.getAmount())
                        .currency(dc.getCurrency())
                        .build()).toList();
    }

    private AwsAccountResponse toResponse(AwsAccount account) {
        return AwsAccountResponse.builder()
                .id(account.getId())
                .accountName(account.getAccountName())
                .accountId(account.getAccountId())
                .region(account.getRegion())
                .status(account.getStatus())
                .description(account.getDescription())
                .lastSyncAt(account.getLastSyncAt())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
