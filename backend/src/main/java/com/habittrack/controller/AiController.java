package com.habittrack.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // DTOs for the request and response
    public record AiChatRequest(String userText, Map<String, Object> trackerSnapshot) {}
    public record GeminiRequest(List<Content> contents) {}
    public record Content(List<Part> parts) {}
    public record Part(String text) {}
    public record GeminiResponse(List<Candidate> candidates) {}
    public record Candidate(Content content) {}

    @PostMapping("/chat")
    public ResponseEntity<String> chatWithAgent(@RequestBody AiChatRequest request) {
        if (geminiApiKey == null || geminiApiKey.isBlank() || geminiApiKey.equals("YOUR_GEMINI_API_KEY")) {
            return ResponseEntity.status(500).body("Server configuration error: Gemini API key missing on backend.");
        }

        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        String fullPrompt = String.format(
            "You are an AI productivity coach inside a habit tracker app.\n" +
            "You can see the user's full synced habit and tracker data below. Use it when answering.\n" +
            "Keep responses concise, practical, and specific to the user's real data.\n\n" +
            "Full tracker snapshot:\n%s\n\nUser message: %s",
            mapToJsonString(request.trackerSnapshot()),
            request.userText()
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<GeminiRequest> entity = new HttpEntity<>(new GeminiRequest(List.of(new Content(List.of(new Part(fullPrompt))))), headers);

        try {
            ResponseEntity<GeminiResponse> response = restTemplate.postForEntity(apiUrl, entity, GeminiResponse.class);
            if (response.getBody() != null && response.getBody().candidates() != null && !response.getBody().candidates().isEmpty()) {
                String responseText = response.getBody().candidates().get(0).content().parts().get(0).text();
                return ResponseEntity.ok(responseText);
            }
            return ResponseEntity.status(500).body("Failed to get a valid response from AI.");
        } catch (Exception e) {
            System.err.println("Error calling Gemini API: " + e.getMessage());
            return ResponseEntity.status(500).body("Error communicating with AI service.");
        }
    }

    private String mapToJsonString(Map<String, Object> map) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.writerWithDefaultPrettyPrinter().writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }
}