package com.cloudcost.analytics.repository;

import com.cloudcost.analytics.entity.CostAnomaly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CostAnomalyRepository extends JpaRepository<CostAnomaly, Long> {

    List<CostAnomaly> findByAccountIdOrderByFirstDetectedDesc(String accountId);

    List<CostAnomaly> findByStatusOrderByFirstDetectedDesc(CostAnomaly.AnomalyStatus status);

    Optional<CostAnomaly> findByAccountIdAndServiceNameAndCostDate(
            String accountId, String serviceName, LocalDate costDate);

    @Query("SELECT a FROM CostAnomaly a WHERE a.severity IN ('HIGH', 'CRITICAL') AND a.status = 'OPEN' " +
           "ORDER BY a.firstDetected DESC")
    List<CostAnomaly> findHighSeverityOpen();

    @Query("SELECT COUNT(a) FROM CostAnomaly a WHERE a.status = 'OPEN'")
    long countOpenAnomalies();

    List<CostAnomaly> findByAccountIdAndStatusOrderByFirstDetectedDesc(
            String accountId, CostAnomaly.AnomalyStatus status);

    @Query("SELECT a FROM CostAnomaly a WHERE a.accountId = :accountId " +
           "AND a.costDate BETWEEN :start AND :end ORDER BY a.costDate DESC")
    List<CostAnomaly> findByAccountIdAndDateRange(@Param("accountId") String accountId,
                                                   @Param("start") LocalDate start,
                                                   @Param("end") LocalDate end);
}
