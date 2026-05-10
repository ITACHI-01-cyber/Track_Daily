package com.habittrack.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habittrack.model.User;
import com.habittrack.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        // Check if user already exists
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already taken");
        }
        
        // Generate an automatic avatar using their name
        if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
            String name = (user.getFirstName() != null && !user.getFirstName().isEmpty()) ? user.getFirstName() : user.getUsername();
            user.setAvatarUrl("https://ui-avatars.com/api/?name=" + name + "&background=random");
        }

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        // Note: Passwords are in plain text as requested by AUTH_FEATURES.md logic, but should be hashed for production!
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(loginRequest.getPassword())) {
            return ResponseEntity.ok(userOpt.get());
        }
        return ResponseEntity.status(401).body("Invalid email or password");
    }
}