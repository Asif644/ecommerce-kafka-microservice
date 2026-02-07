package com.example.kafka.user.service.service;

import com.example.kafka.user.service.dto.LoginRequest;
import com.example.kafka.user.service.dto.RegistrationRequest;
import com.example.kafka.user.service.model.LoginHistory;
import com.example.kafka.user.service.model.User;
import com.example.kafka.user.service.repository.LoginHistoryRepository;
import com.example.kafka.user.service.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoginHistoryRepository loginHistoryRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    private final ObjectMapper objectMapper;

    public AuthService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Register a new user
     */
    public Map<String, Object> registerUser(RegistrationRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Check if email already exists
            if (userRepository.existsByEmail(request.getEmail())) {
                response.put("success", false);
                response.put("message", "Email already registered");
                return response;
            }

            // Create and save user
            User user = new User(
                    request.getName(),
                    request.getAge(),
                    request.getGender(),
                    request.getEmail(),
                    request.getPassword() // In production, hash this password!
            );

            User savedUser = userRepository.save(user);
            logger.info("User registered: {}", savedUser.getEmail());

            // Create Kafka event
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("action", "registration");
            eventData.put("userId", savedUser.getId());
            eventData.put("name", savedUser.getName());
            eventData.put("age", savedUser.getAge());
            eventData.put("gender", savedUser.getGender());
            eventData.put("email", savedUser.getEmail());
            eventData.put("timestamp", savedUser.getCreatedAt().toString());

            String eventJson = objectMapper.writeValueAsString(eventData);

            // Send to Kafka topics
            kafkaProducerService.sendUserEvent(eventJson);
            kafkaProducerService.sendUserEventSerialized(eventJson);

            response.put("success", true);
            response.put("message", "Registration successful");
            response.put("userId", savedUser.getId());
            response.put("email", savedUser.getEmail());

        } catch (Exception e) {
            logger.error("Registration error", e);
            response.put("success", false);
            response.put("message", "Registration failed: " + e.getMessage());
        }

        return response;
    }

    /**
     * Login user
     */
    public Map<String, Object> loginUser(LoginRequest request, String ipAddress) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Find user by email
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Invalid email or password");
                return response;
            }

            User user = userOpt.get();

            // Check password (In production, use proper password hashing!)
            if (!user.getPassword().equals(request.getPassword())) {
                response.put("success", false);
                response.put("message", "Invalid email or password");
                return response;
            }

            // Save login history
            LoginHistory loginHistory = new LoginHistory(user.getId(), user.getEmail(), ipAddress);
            loginHistoryRepository.save(loginHistory);
            logger.info("User logged in: {}", user.getEmail());

            // Create Kafka event
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("action", "login");
            eventData.put("userId", user.getId());
            eventData.put("name", user.getName());
            eventData.put("email", user.getEmail());
            eventData.put("timestamp", loginHistory.getLoginTime().toString());
            eventData.put("ipAddress", ipAddress);

            String eventJson = objectMapper.writeValueAsString(eventData);

            // Send to Kafka topics
            kafkaProducerService.sendUserEvent(eventJson);
            kafkaProducerService.sendUserEventSerialized(eventJson);

            response.put("success", true);
            response.put("message", "Login successful");
            response.put("userId", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());

        } catch (Exception e) {
            logger.error("Login error", e);
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
        }

        return response;
    }
}