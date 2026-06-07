package com.habittrack.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Pings the app's own health endpoint every 14 minutes to prevent
 * Render's free tier from spinning the instance down after 15 min of inactivity.
 */
@Service
public class UptimePingService {

    private static final Logger log = LoggerFactory.getLogger(UptimePingService.class);

    @Value("${app.self.ping.url}")
    private String pingUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Every 14 minutes (840,000 ms)
    @Scheduled(fixedDelay = 840_000, initialDelay = 60_000)
    public void ping() {
        try {
            String response = restTemplate.getForObject(pingUrl, String.class);
            log.info("[UptimePing] ✅ Pinged {} — response: {}", pingUrl, response);
        } catch (Exception e) {
            log.warn("[UptimePing] ⚠️ Ping failed for {}: {}", pingUrl, e.getMessage());
        }
    }
}
