package com.cloudcost.cost.repository;

import com.cloudcost.cost.entity.DailyCost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface DailyCostRepository extends JpaRepository<DailyCost, Long> {

    List<DailyCost> findByAccountIdAndCostDateBetweenOrderByCostDateAsc(
            String accountId, LocalDate start, LocalDate end);

    List<DailyCost> findByAccountIdAndServiceNameAndCostDateBetweenOrderByCostDateAsc(
            String accountId, String serviceName, LocalDate start, LocalDate end);

    @Query("SELECT d.serviceName, SUM(d.amount) as total FROM DailyCost d " +
           "WHERE d.accountId = :accountId AND d.costDate BETWEEN :start AND :end " +
           "GROUP BY d.serviceName ORDER BY total DESC")
    List<Object[]> findServiceTotals(@Param("accountId") String accountId,
                                     @Param("start") LocalDate start,
                                     @Param("end") LocalDate end);

    @Query("SELECT SUM(d.amount) FROM DailyCost d " +
           "WHERE d.accountId = :accountId AND d.costDate BETWEEN :start AND :end")
    BigDecimal sumByAccountIdAndDateRange(@Param("accountId") String accountId,
                                          @Param("start") LocalDate start,
                                          @Param("end") LocalDate end);

    @Query("SELECT d.costDate, SUM(d.amount) FROM DailyCost d " +
           "WHERE d.accountId = :accountId AND d.costDate BETWEEN :start AND :end " +
           "GROUP BY d.costDate ORDER BY d.costDate ASC")
    List<Object[]> findDailyTotals(@Param("accountId") String accountId,
                                   @Param("start") LocalDate start,
                                   @Param("end") LocalDate end);

    boolean existsByAccountIdAndServiceNameAndCostDate(String accountId, String serviceName, LocalDate costDate);

    List<DailyCost> findByAccountIdOrderByCostDateDesc(String accountId);
}
