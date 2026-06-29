package com.cloudcost.analytics.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class TimelineEvent {
    private String time;
    private String event;
}
