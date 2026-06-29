package com.cloudcost.analytics.dto;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class CostServiceClient {

    private final RestTemplate restTemplate;
    private final String costServiceUrl;

    public CostServiceClient(RestTemplate restTemplate,
                              @Value("${cost-service.url:http://cost-service:8082}") String url) {
        this.restTemplate = restTemplate;
        this.costServiceUrl = url;
    }

    public List<Map<String, Object>> fetchMetrics(String accountId, String serviceName,
                                                   LocalDateTime start, LocalDateTime end) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(costServiceUrl + "/api/costs/metrics/" + accountId)
                    .queryParam("serviceName", serviceName)
                    .queryParam("start", start.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .queryParam("end", end.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .toUriString();

            return restTemplate.exchange(url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}).getBody();
        } catch (Exception e) {
            log.warn("Failed to fetch metrics from cost-service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<Map<String, Object>> fetchTrailEvents(String accountId, LocalDateTime start, LocalDateTime end) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(costServiceUrl + "/api/costs/trail/" + accountId)
                    .queryParam("start", start.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .queryParam("end", end.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .toUriString();

            return restTemplate.exchange(url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}).getBody();
        } catch (Exception e) {
            log.warn("Failed to fetch trail events from cost-service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
