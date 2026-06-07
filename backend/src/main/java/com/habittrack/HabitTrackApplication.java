package com.habittrack;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HabitTrackApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(HabitTrackApplication.class, args);
    }

    private static void loadDotEnv() {
        loadDotEnvFile(Path.of(".env"));
        loadDotEnvFile(Path.of("..", ".env"));
        applySpringPropertyAlias("MONGODB_URI", "spring.data.mongodb.uri");
        applySpringPropertyAlias("MONGODB_DATABASE", "spring.data.mongodb.database");
        applySpringPropertyAlias("GEMINI_API_KEY", "gemini.api.key");
    }

    private static void loadDotEnvFile(Path envPath) {
        if (!Files.isRegularFile(envPath)) {
            return;
        }

        try {
            for (String line : Files.readAllLines(envPath)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                    continue;
                }

                String[] parts = trimmed.split("=", 2);
                String key = parts[0].trim();
                String value = stripQuotes(parts[1].trim());
                if (!key.isEmpty()) {
                    setPropertyIfMissing(key, value);
                }
            }
        } catch (IOException ignored) {
            // Environment variables still work when the optional .env file is unavailable.
        }
    }

    private static void applySpringPropertyAlias(String envKey, String springKey) {
        String value = System.getenv(envKey);
        if (value == null || value.isBlank()) {
            value = System.getProperty(envKey);
        }
        setPropertyIfMissing(springKey, value);
    }

    private static void setPropertyIfMissing(String key, String value) {
        if (value != null && !value.isBlank() && System.getProperty(key) == null) {
            System.setProperty(key, value);
        }
    }

    private static String stripQuotes(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }

}
