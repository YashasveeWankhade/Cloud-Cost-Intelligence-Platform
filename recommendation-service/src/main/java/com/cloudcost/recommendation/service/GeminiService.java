package com.cloudcost.recommendation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Gemini AI integration.
 * AI is ONLY used to:
 * - Explain findings in plain English
 * - Generate optimization recommendations
 * - Summarize root causes
 *
 * AI NEVER:
 * - Detects anomalies
 * - Makes financial decisions
 * - Generates confidence scores
 */
@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api-key:demo-key}")
    private String apiKey;

    @Value("${gemini.api-url}")
    private String apiUrl;

    @Value("${gemini.enabled:false}")
    private boolean enabled;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public record AiRecommendation(String explanation, String recommendation, String estimatedSavings) {}

    public AiRecommendation generateRecommendation(String service, double costIncrease,
                                                    String rootCause, double confidence,
                                                    String evidenceSummary) {
        if (!enabled || "demo-key".equals(apiKey)) {
            log.info("Gemini AI disabled — using fallback recommendations for service={}", service);
            return buildFallbackRecommendation(service, costIncrease, rootCause, confidence);
        }

        try {
            String prompt = buildPrompt(service, costIncrease, rootCause, confidence, evidenceSummary);
            String response = callGemini(prompt);
            return parseGeminiResponse(response, service, costIncrease, rootCause, confidence);
        } catch (Exception e) {
            log.error("Gemini API call failed, using fallback: {}", e.getMessage());
            return buildFallbackRecommendation(service, costIncrease, rootCause, confidence);
        }
    }

    private String buildPrompt(String service, double costIncrease, String rootCause,
                                double confidence, String evidenceSummary) {
        return String.format("""
                You are a cloud cost optimization expert. Analyze this cost anomaly and provide recommendations.

                Cost Anomaly Details:
                - AWS Service: %s
                - Cost Increase: %.1f%%
                - Root Cause: %s
                - Root Cause Confidence: %.0f%%
                - Evidence: %s

                Please provide:
                1. A plain English explanation of what happened (2-3 sentences, business-friendly)
                2. Specific optimization recommendations (bullet points)
                3. Estimated monthly savings range if recommendations are implemented

                Format your response as JSON:
                {
                  "explanation": "...",
                  "recommendation": "...",
                  "estimatedSavings": "$X-$Y/month"
                }
                """,
                service, costIncrease, rootCause, confidence, evidenceSummary);
    }

    private String callGemini(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                ))
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        String url = apiUrl + "?key=" + apiKey;

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        return response.getBody();
    }

    private AiRecommendation parseGeminiResponse(String response, String service, double costIncrease,
                                                   String rootCause, double confidence) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            // Extract JSON from response
            int jsonStart = text.indexOf('{');
            int jsonEnd = text.lastIndexOf('}') + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                JsonNode parsed = objectMapper.readTree(text.substring(jsonStart, jsonEnd));
                return new AiRecommendation(
                        parsed.path("explanation").asText(),
                        parsed.path("recommendation").asText(),
                        parsed.path("estimatedSavings").asText()
                );
            }
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
        }
        return buildFallbackRecommendation(service, costIncrease, rootCause, confidence);
    }

    private AiRecommendation buildFallbackRecommendation(String service, double costIncrease,
                                                          String rootCause, double confidence) {
        String explanation = String.format(
                "%s spending increased by %.1f%% above the 30-day baseline. " +
                "Root cause analysis identified \"%s\" as the primary driver with %.0f%% confidence. " +
                "Immediate investigation and action is recommended to prevent continued overspend.",
                service, costIncrease, rootCause, confidence);

        String recommendation = buildServiceRecommendation(service, rootCause);
        String savings = estimateSavings(service, costIncrease);

        return new AiRecommendation(explanation, recommendation, savings);
    }

    private String buildServiceRecommendation(String service, String rootCause) {
        return switch (service) {
            case "EC2" -> """
                    • Review Auto Scaling policies and set appropriate maximum instance limits
                    • Evaluate rightsizing opportunities — consider Reserved Instances for baseline load
                    • Enable Cost Anomaly Detection alerts in AWS Cost Management
                    • Review CloudWatch alarms for scale-out triggers to prevent runaway scaling
                    • Consider Spot Instances for non-critical workloads to reduce costs by up to 70%""";
            case "RDS" -> """
                    • Evaluate whether Read Replicas are still needed or can be deleted
                    • Review database instance sizing — consider downgrading if utilization is low
                    • Enable RDS Reserved Instance pricing for predictable workloads
                    • Consider Aurora Serverless for variable workloads
                    • Review and optimize slow queries to reduce database load""";
            case "S3" -> """
                    • Audit recent uploads and remove unnecessary large objects
                    • Implement S3 Lifecycle Policies to transition old data to Glacier or Glacier Deep Archive
                    • Enable S3 Intelligent-Tiering for automatically tiering infrequently accessed data
                    • Review and clean up incomplete multipart uploads
                    • Evaluate cross-region replication needs and disable if not required""";
            case "Lambda" -> """
                    • Investigate unexpected invocation sources and add appropriate throttling
                    • Review Lambda function concurrency limits and reserved concurrency settings
                    • Optimize function memory allocation using AWS Lambda Power Tuning
                    • Enable Lambda function URL throttling or API Gateway usage plans
                    • Review DLQ (Dead Letter Queue) for failed invocations causing retries""";
            case "CloudFront" -> """
                    • Analyze CloudFront access logs to identify traffic sources
                    • Implement WAF rules to block unwanted traffic patterns
                    • Review and optimize cache TTL settings to reduce origin fetches
                    • Consider CloudFront price class optimization for your geographic distribution
                    • Enable real-time monitoring dashboards for traffic pattern visibility""";
            case "DynamoDB" -> """
                    • Review on-demand vs. provisioned capacity mode for cost optimization
                    • Analyze access patterns and switch to provisioned capacity with auto-scaling
                    • Implement DynamoDB Accelerator (DAX) to reduce read costs
                    • Review and optimize query patterns to minimize read/write consumption
                    • Enable DynamoDB Point-in-Time Recovery only where needed""";
            default -> """
                    • Review service usage patterns and identify unexpected consumers
                    • Implement tagging strategy for cost allocation and tracking
                    • Set up AWS Budgets with alerts for early anomaly detection
                    • Consider Reserved capacity or Savings Plans for predictable usage
                    • Engage AWS Trusted Advisor for service-specific optimization recommendations""";
        };
    }

    private String estimateSavings(String service, double costIncrease) {
        double savingsFraction = switch (service) {
            case "EC2" -> 0.65;
            case "RDS" -> 0.55;
            case "S3" -> 0.70;
            case "Lambda" -> 0.80;
            case "CloudFront" -> 0.60;
            case "DynamoDB" -> 0.50;
            default -> 0.40;
        };

        double baseMonthlyCost = switch (service) {
            case "EC2" -> 9000;
            case "RDS" -> 2100;
            case "S3" -> 1500;
            case "Lambda" -> 750;
            case "CloudFront" -> 1200;
            case "DynamoDB" -> 1350;
            default -> 1000;
        };

        double excessCost = baseMonthlyCost * (costIncrease / 100.0);
        double low = excessCost * savingsFraction * 0.7;
        double high = excessCost * savingsFraction;
        return String.format("$%.0f-$%.0f/month", low, high);
    }
}
