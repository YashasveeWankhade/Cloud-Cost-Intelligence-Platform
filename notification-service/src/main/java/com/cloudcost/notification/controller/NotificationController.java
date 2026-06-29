package com.cloudcost.notification.controller;

import com.cloudcost.notification.entity.Notification;
import com.cloudcost.notification.service.NotificationService;
import com.cloudcost.notification.service.SseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;
    private final SseService sseService;

    @GetMapping
    public ResponseEntity<List<Notification>> getAll() {
        return ResponseEntity.ok(service.getAllNotifications());
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<Notification>> getByAccount(@PathVariable String accountId) {
        return ResponseEntity.ok(service.getByAccount(accountId));
    }

    /**
     * SSE endpoint — the browser connects here once and receives all Kafka events in real time.
     * Route: GET /api/notifications/stream
     * The API Gateway already proxies /api/notifications/** to this service.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return sseService.subscribe();
    }
}
