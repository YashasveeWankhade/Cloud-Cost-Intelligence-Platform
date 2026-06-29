package com.cloudcost.analytics.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class EvidenceItem {
    private String type;
    private String description;
    private int score;
    private String eventType;
    private String eventSource;
    /** Pearson r between this metric and the cost proxy signal (-1.0 to 1.0). */
    private double correlationScore;
    /** Relative magnitude at the detected change point (rightMean / leftMean). */
    private double changePointMagnitude;
}
