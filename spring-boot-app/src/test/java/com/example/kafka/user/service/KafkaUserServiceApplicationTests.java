package com.example.kafka.user.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
    }
)
class KafkaUserServiceApplicationTests {

    @Test
    void contextLoads() {
        // Simple smoke test - verifies application context loads
    }

}