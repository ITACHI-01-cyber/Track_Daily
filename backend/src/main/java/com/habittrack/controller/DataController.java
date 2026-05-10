package com.habittrack.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/data")
public class DataController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostMapping
    public ResponseEntity<?> saveData(@RequestBody Map<String, Object> data) {
        // Save all incoming frontend data into a single master document
        data.put("_id", "user_dashboard_data");
        mongoTemplate.save(data, "app_data");
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getData() {
        Map<String, Object> data = mongoTemplate.findById("user_dashboard_data", Map.class, "app_data");
        if (data == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(data);
    }
}