package com.habittrack.controller;

import java.util.Map;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
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

    @GetMapping(produces = "application/json")
    public ResponseEntity<String> getData() {
        Query query = new Query(Criteria.where("id").is(1));
        Document doc = mongoTemplate.findOne(query, Document.class, "app_data");
        if (doc != null && doc.containsKey("content")) {
            return ResponseEntity.ok(doc.getString("content"));
        }
        return ResponseEntity.ok("{}");
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<Map<String, Boolean>> saveData(@RequestBody String rawJson) {
        Query query = new Query(Criteria.where("id").is(1));
        Update update = new Update().set("id", 1).set("content", rawJson);
        
        mongoTemplate.upsert(query, update, "app_data");
        
        return ResponseEntity.ok(Map.of("success", true));
    }
}