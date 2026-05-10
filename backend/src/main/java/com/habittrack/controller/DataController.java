package com.habittrack.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/data")
public class DataController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostMapping
    public ResponseEntity<?> saveData(@RequestParam(defaultValue = "default") String userId, @RequestBody Map<String, Object> data) {
        System.out.println("==================================================");
        System.out.println("📥 [SYNC] Receiving save request for user: " + userId);
        // Save frontend data specifically for this user
        data.put("_id", "dashboard_" + userId);
        System.out.println("💾 [SYNC] Tasks count to save: " + (data.containsKey("tasks") ? ((java.util.List<?>) data.get("tasks")).size() : 0));
        mongoTemplate.save(data, "habit_track");
        System.out.println("✅ [SYNC] Data successfully pushed to MongoDB 'habit_track' collection!");
        System.out.println("==================================================");
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getData(@RequestParam(defaultValue = "default") String userId) {
        System.out.println("📤 [FETCH] Frontend requested data for user: " + userId);
        Map<String, Object> data = mongoTemplate.findById("dashboard_" + userId, Map.class, "habit_track");
        if (data == null) {
            System.out.println("⚠️ [FETCH] No existing data found in MongoDB. Returning empty state.");
            // Return empty JSON instead of 404 so the frontend knows the server is successfully online
            return ResponseEntity.ok(Map.of());
        }
        System.out.println("✅ [FETCH] Successfully loaded data from MongoDB.");
        return ResponseEntity.ok(data);
    }
}