package com.example.kafka.user.service.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class KafkaProducerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Value("${kafka.topic.user-events}")
    private String userEventsTopic;

    @Value("${kafka.topic.user-events-serialized}")
    private String userEventsSerializedTopic;

    /**
     * Send plain JSON message to user-events topic
     */
    public void sendUserEvent(String message) {
        logger.info("Sending user event to topic: {}", userEventsTopic);
        kafkaTemplate.send(userEventsTopic, message);
    }

    /**
     * Send serialized (Base64 encoded) message to serialized topic
     */
    public void sendUserEventSerialized(String message) {
        String serializedMessage = Base64.getEncoder().encodeToString(message.getBytes());
        logger.info("Sending serialized user event to topic: {}", userEventsSerializedTopic);
        kafkaTemplate.send(userEventsSerializedTopic, serializedMessage);
    }
}