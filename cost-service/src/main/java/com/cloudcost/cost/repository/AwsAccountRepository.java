package com.cloudcost.cost.repository;

import com.cloudcost.cost.entity.AwsAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AwsAccountRepository extends JpaRepository<AwsAccount, Long> {
    Optional<AwsAccount> findByAccountId(String accountId);
    List<AwsAccount> findByOwnerId(Long ownerId);
    boolean existsByAccountId(String accountId);
}
