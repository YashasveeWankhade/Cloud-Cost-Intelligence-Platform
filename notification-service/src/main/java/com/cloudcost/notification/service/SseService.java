package com.cloudcost.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseService {

    private final Set<SseEmitter> emitters = ConcurrentHashMap.newKeySet();
    private final ObjectMapper mapper = new ObjectMapper();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // 0 = no timeout
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        // Send an initial heartbeat so the browser knows the connection is live
        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("status", "connected", "subscribers", emitters.size())));
        } catch (Exception e) {
            emitters.remove(emitter);
        }

        log.info("SSE client connected. Total subscribers: {}", emitters.size());
        return emitter;
    }

    public void broadcast(String eventName, Object payload) {
        if (emitters.isEmpty()) return;

        String json;
        try {
            json = mapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.warn("Failed to serialize SSE payload: {}", e.getMessage());
            return;
        }

        emitters.removeIf(emitter -> {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(json));
                return false;
            } catch (Exception e) {
                log.debug("Removing stale SSE emitter: {}", e.getMessage());
                return true;
            }
        });
    }

    @Scheduled(fixedDelay = 30_000)
    public void heartbeat() {
        broadcast("ping", Map.of("ts", System.currentTimeMillis()));
    }
}
