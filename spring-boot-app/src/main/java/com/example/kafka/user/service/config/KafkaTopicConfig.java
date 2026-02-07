package com.example.kafka.user.service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Value("${kafka.topic.user-events}")
    private String userEventsTopic;

    @Value("${kafka.topic.user-events-serialized}")
    private String userEventsSerializedTopic;

    @Bean
    public NewTopic userEventsTopic() {
        return TopicBuilder.name(userEventsTopic)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic userEventsSerializedTopic() {
        return TopicBuilder.name(userEventsSerializedTopic)
                .partitions(1)
                .replicas(1)
                .build();
    }
}