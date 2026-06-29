package com.cloudcost.cost.simulator;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class ServiceProfile {
    private String serviceName;
    private double baseCostMin;
    private double baseCostMax;
    private double weekdayMultiplier;
    private double weekendMultiplier;
    private String anomalyType;
    private double anomalyMultiplier;
    private String injectedCause;
}
