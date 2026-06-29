package com.cloudcost.notification.service;

import com.cloudcost.notification.entity.Notification;
import com.cloudcost.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository repository;
    private final JavaMailSender mailSender;

    @Value("${notification.enabled:false}")
    private boolean emailEnabled;

    @Value("${notification.admin-email:admin@cloudcost.io}")
    private String adminEmail;

    @Transactional
    public void handleAnomalyEvent(Map<String, Object> event) {
        String severity = (String) event.getOrDefault("severity", "LOW");
        if (!"HIGH".equals(severity) && !"CRITICAL".equals(severity)) return;

        String accountId = (String) event.get("accountId");
        String serviceName = (String) event.get("serviceName");
        String rootCause = (String) event.getOrDefault("rootCause", "Under investigation");
        Object increaseObj = event.getOrDefault("increasePercentage", 0);
        double increase = increaseObj instanceof Number n ? n.doubleValue() : 0.0;
        Object confidenceObj = event.getOrDefault("rootCauseConfidence", 0);
        double confidence = confidenceObj instanceof Number n ? n.doubleValue() : 0.0;
        Object anomalyIdObj = event.get("anomalyId");
        Long anomalyId = anomalyIdObj instanceof Number n ? n.longValue() : null;

        String subject = String.format("[%s] Cloud Cost Alert: %s cost spike detected on %s",
                severity, serviceName, accountId);

        String body = String.format("""
                Cloud Cost Intelligence Platform — Anomaly Alert
                =================================================

                Account ID:        %s
                Service:           %s
                Severity:          %s
                Cost Increase:     %.1f%%
                Root Cause:        %s
                Confidence:        %.0f%%
                Anomaly ID:        %s

                Please review the Cloud Cost Dashboard for full details and recommendations.

                ---
                Cloud Cost Intelligence Platform
                """,
                accountId, serviceName, severity, increase, rootCause, confidence,
                anomalyId != null ? anomalyId.toString() : "N/A");

        createAndSend(accountId, subject, body, Notification.NotificationType.ANOMALY_ALERT,
                "ANOMALY_DETECTED", anomalyId);
    }

    @Transactional
    public void handleRecommendationEvent(Map<String, Object> event) {
        String accountId = (String) event.get("accountId");
        String serviceName = (String) event.get("serviceName");
        String priority = (String) event.getOrDefault("priority", "MEDIUM");
        if ("LOW".equals(priority)) return;

        Object recIdObj = event.get("recommendationId");
        Long recId = recIdObj instanceof Number n ? n.longValue() : null;
        String savings = (String) event.getOrDefault("estimatedSavings", "Unknown");

        String subject = String.format("[%s Priority] New Optimization Recommendation for %s", priority, serviceName);
        String body = String.format("""
                Cloud Cost Intelligence Platform — New Recommendation
                =======================================================

                Service:           %s
                Account:           %s
                Priority:          %s
                Estimated Savings: $%s/month
                Recommendation ID: %s

                Login to your dashboard to review and implement this recommendation.

                ---
                Cloud Cost Intelligence Platform
                """, serviceName, accountId, priority, savings, recId != null ? recId : "N/A");

        createAndSend(accountId, subject, body, Notification.NotificationType.RECOMMENDATION,
                "RECOMMENDATION_CREATED", recId);
    }

    private void createAndSend(String accountId, String subject, String body,
                                Notification.NotificationType type, String trigger, Long refId) {
        Notification notification = Notification.builder()
                .accountId(accountId)
                .subject(subject)
                .body(body)
                .recipientEmail(adminEmail)
                .type(type)
                .status(Notification.NotificationStatus.PENDING)
                .triggerEvent(trigger)
                .referenceId(refId)
                .build();

        if (emailEnabled) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(adminEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                notification.setStatus(Notification.NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                log.info("Email notification sent: {}", subject);
            } catch (MailException e) {
                notification.setStatus(Notification.NotificationStatus.FAILED);
                log.error("Failed to send email: {}", e.getMessage());
            }
        } else {
            notification.setStatus(Notification.NotificationStatus.SKIPPED);
            log.info("Email disabled — notification logged: {}", subject);
        }

        repository.save(notification);
    }

    public List<Notification> getAllNotifications() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public List<Notification> getByAccount(String accountId) {
        return repository.findByAccountIdOrderByCreatedAtDesc(accountId);
    }
}
