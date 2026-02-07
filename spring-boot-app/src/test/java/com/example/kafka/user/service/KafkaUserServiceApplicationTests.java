package com.example.kafka.user.service;

import com.example.kafka.user.service.config.TestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestConfig.class)
class KafkaUserServiceApplicationTests {
    @Test
    void contextLoads() {
    }
}