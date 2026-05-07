package com.habittrack.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habittrack.model.User;
import com.habittrack.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String username = request.get("username");
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");

        if (email == null || email.isBlank() || password == null || password.isBlank() || 
            username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }

        Optional<User> existingEmail = userRepository.findByEmail(email);
        Optional<User> existingUsername = userRepository.findByUsername(username);

        if (existingEmail.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }

        if (existingUsername.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        User user = new User(email, password, username, firstName != null ? firstName : "", lastName != null ? lastName : "");
        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("username", savedUser.getUsername());
        response.put("firstName", savedUser.getFirstName());
        response.put("lastName", savedUser.getLastName());
        response.put("avatarUrl", savedUser.getAvatarUrl());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        Optional<User> user = userRepository.findByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }

        if (!user.get().getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.get().getId());
        response.put("email", user.get().getEmail());
        response.put("username", user.get().getUsername());
        response.put("firstName", user.get().getFirstName());
        response.put("lastName", user.get().getLastName());
        response.put("avatarUrl", user.get().getAvatarUrl());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable String id) {
        Optional<User> user = userRepository.findById(id);

        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.get().getId());
        response.put("email", user.get().getEmail());
        response.put("username", user.get().getUsername());
        response.put("firstName", user.get().getFirstName());
        response.put("lastName", user.get().getLastName());
        response.put("avatarUrl", user.get().getAvatarUrl());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/user/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable String id, @RequestBody Map<String, String> request) {
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (request.containsKey("firstName")) {
            user.setFirstName(request.get("firstName"));
        }
        if (request.containsKey("lastName")) {
            user.setLastName(request.get("lastName"));
        }
        if (request.containsKey("avatarUrl")) {
            user.setAvatarUrl(request.get("avatarUrl"));
        }

        User updatedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", updatedUser.getId());
        response.put("email", updatedUser.getEmail());
        response.put("username", updatedUser.getUsername());
        response.put("firstName", updatedUser.getFirstName());
        response.put("lastName", updatedUser.getLastName());
        response.put("avatarUrl", updatedUser.getAvatarUrl());

        return ResponseEntity.ok(response);
    }
}
