package com.cloudcost.analytics;

import com.cloudcost.analytics.engine.AnomalyDetectionEngine;
import com.cloudcost.analytics.entity.CostAnomaly;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Anomaly Detection Engine Tests")
class AnomalyDetectionEngineTest {

    private AnomalyDetectionEngine engine;

    @BeforeEach
    void setUp() {
        engine = new AnomalyDetectionEngine();
    }

    private List<BigDecimal> normalHistory(int days, double baseline) {
        List<BigDecimal> history = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            history.add(BigDecimal.valueOf(baseline + (Math.random() - 0.5) * baseline * 0.1));
        }
        return history;
    }

    @Test
    @DisplayName("Should detect CRITICAL anomaly when cost is 5x baseline")
    void detectsCriticalAnomaly() {
        List<BigDecimal> history = normalHistory(30, 300.0);
        BigDecimal spike = BigDecimal.valueOf(1500.0);

        var result = engine.analyze(history, spike);

        assertThat(result.isAnomaly()).isTrue();
        assertThat(result.severity()).isEqualTo(CostAnomaly.Severity.CRITICAL);
        assertThat(result.increasePercentage()).isGreaterThan(300.0);
    }

    @Test
    @DisplayName("Should detect HIGH anomaly when cost is 3x baseline")
    void detectsHighAnomaly() {
        List<BigDecimal> history = normalHistory(30, 300.0);
        BigDecimal spike = BigDecimal.valueOf(950.0);

        var result = engine.analyze(history, spike);

        assertThat(result.isAnomaly()).isTrue();
        assertThat(result.severity()).isEqualTo(CostAnomaly.Severity.HIGH);
    }

    @Test
    @DisplayName("Should not flag normal cost variation as anomaly")
    void noFalsePositiveOnNormalVariation() {
        List<BigDecimal> history = normalHistory(30, 300.0);
        BigDecimal normal = BigDecimal.valueOf(315.0); // 5% above baseline

        var result = engine.analyze(history, normal);

        assertThat(result.isAnomaly()).isFalse();
    }

    @Test
    @DisplayName("Should return no anomaly for empty history")
    void handlesEmptyHistory() {
        var result = engine.analyze(List.of(), BigDecimal.valueOf(1000));
        assertThat(result.isAnomaly()).isFalse();
    }

    @Test
    @DisplayName("Z-score should be high for statistical outlier")
    void zScoreHighForOutlier() {
        List<BigDecimal> history = new ArrayList<>();
        for (int i = 0; i < 30; i++) history.add(BigDecimal.valueOf(300));
        BigDecimal outlier = BigDecimal.valueOf(1500);

        var result = engine.analyze(history, outlier);

        assertThat(result.zScore()).isGreaterThan(5.0);
    }

    @Test
    @DisplayName("Should provide correct baseline cost")
    void providesCorrectBaseline() {
        List<BigDecimal> history = new ArrayList<>();
        for (int i = 0; i < 30; i++) history.add(BigDecimal.valueOf(300));

        var result = engine.analyze(history, BigDecimal.valueOf(1500));

        assertThat(result.expectedCost().doubleValue()).isCloseTo(300.0, org.assertj.core.data.Offset.offset(10.0));
    }
}
