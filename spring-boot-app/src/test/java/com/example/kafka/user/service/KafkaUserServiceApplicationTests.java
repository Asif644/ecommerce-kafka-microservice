package com.example.kafka.user.service;

import com.example.kafka.user.service.config.TestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@Import(TestConfig.class)  // Import the test configuration
class KafkaUserServiceApplicationTests {

    @Test
    void contextLoads() {
        // This test verifies that the application context loads successfully
    }

}