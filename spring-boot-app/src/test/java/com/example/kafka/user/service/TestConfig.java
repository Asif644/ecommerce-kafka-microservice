package com.example.kafka.user.service.config;

import com.example.kafka.user.service.service.KafkaProducerService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;

@TestConfiguration
public class TestConfig {
    
    @Bean
    @Primary
    public KafkaProducerService mockKafkaProducerService() {
        KafkaProducerService mock = mock(KafkaProducerService.class);
        
        // Configure mock to do nothing when methods are called
        doNothing().when(mock).sendUserEvent(anyString());
        doNothing().when(mock).sendUserEventSerialized(anyString());
        
        return mock;
    }
}