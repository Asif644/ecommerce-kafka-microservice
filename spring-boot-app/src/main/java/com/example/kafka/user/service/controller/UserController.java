package com.example.kafka.user.service.controller;

import com.example.kafka.user.service.model.User;
import com.example.kafka.user.service.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Get all users
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        Map<String, Object> response = new HashMap<>();

        try {
            List<User> users = userService.getAllUsers();
            response.put("success", true);
            response.put("count", users.size());
            response.put("users", users);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error fetching users: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get user by ID
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        userService.getUserById(id).ifPresentOrElse(
                user -> {
                    response.put("success", true);
                    response.put("user", user);
                },
                () -> {
                    response.put("success", false);
                    response.put("message", "User not found with ID: " + id);
                }
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get user by email
     * GET /api/users/email/{email}
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<Map<String, Object>> getUserByEmail(@PathVariable String email) {
        Map<String, Object> response = new HashMap<>();

        userService.getUserByEmail(email).ifPresentOrElse(
                user -> {
                    response.put("success", true);
                    // Don't expose password in response
                    Map<String, Object> safeUser = new HashMap<>();
                    safeUser.put("id", user.getId());
                    safeUser.put("name", user.getName());
                    safeUser.put("age", user.getAge());
                    safeUser.put("gender", user.getGender());
                    safeUser.put("email", user.getEmail());
                    safeUser.put("createdAt", user.getCreatedAt());

                    response.put("user", safeUser);
                },
                () -> {
                    response.put("success", false);
                    response.put("message", "User not found with email: " + email);
                }
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Check if email exists
     * GET /api/users/check-email/{email}
     */
    @GetMapping("/check-email/{email}")
    public ResponseEntity<Map<String, Object>> checkEmailExists(@PathVariable String email) {
        Map<String, Object> response = new HashMap<>();

        boolean exists = userService.emailExists(email);
        response.put("success", true);
        response.put("exists", exists);
        response.put("email", email);

        return ResponseEntity.ok(response);
    }

    /**
     * Get user count
     * GET /api/users/count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getUserCount() {
        Map<String, Object> response = new HashMap<>();

        long count = userService.getUserCount();
        response.put("success", true);
        response.put("count", count);

        return ResponseEntity.ok(response);
    }
}