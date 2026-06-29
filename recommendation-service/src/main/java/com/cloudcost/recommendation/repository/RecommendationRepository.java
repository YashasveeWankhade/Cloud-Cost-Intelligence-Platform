package com.cloudcost.recommendation.repository;

import com.cloudcost.recommendation.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByAccountIdOrderByCreatedAtDesc(String accountId);
    List<Recommendation> findByStatusOrderByCreatedAtDesc(Recommendation.RecommendationStatus status);
    List<Recommendation> findByPriorityOrderByCreatedAtDesc(Recommendation.Priority priority);

    @Query("SELECT COALESCE(SUM(r.estimatedMonthlySavings), 0) FROM Recommendation r " +
           "WHERE r.status != 'DISMISSED'")
    BigDecimal totalPotentialSavings();

    @Query("SELECT r FROM Recommendation r ORDER BY r.createdAt DESC")
    List<Recommendation> findAllOrderByCreatedAtDesc();
}
