const { Kafka } = require('kafkajs');
const config = require('../config/test.config');

class KafkaHelper {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'test-client',
      brokers: [config.kafka.broker]
    });
    this.admin = this.kafka.admin();
    this.consumer = null;
    this.messages = [];
  }

  async connect() {
    await this.admin.connect();
    console.log('✓ Connected to Kafka');
  }

  /**
   * Consume messages from a topic starting from the latest offset
   */
  async consumeLatestMessages(topic, maxMessages = 1, timeoutMs = 15000) {
    this.messages = [];
    
    const uniqueGroupId = `test-group-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const consumer = this.kafka.consumer({ 
      groupId: uniqueGroupId,
      fromBeginning: false
    });
    
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    
    console.log(`✓ Consumer subscribed to ${topic} (waiting for new messages)`);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        await consumer.disconnect();
        if (this.messages.length === 0) {
          reject(new Error(`No messages received from topic '${topic}' within ${timeoutMs}ms`));
        } else {
          resolve(this.messages);
        }
      }, timeoutMs);

      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const value = message.value.toString();
          console.log(`✓ Received message from ${topic}`);
          this.messages.push(value);

          if (this.messages.length >= maxMessages) {
            clearTimeout(timeout);
            await consumer.disconnect();
            resolve(this.messages);
          }
        }
      });
    });
  }

  /**
   * Consume ALL messages from beginning (for verification)
   */
  async consumeAllMessages(topic, timeoutMs = 5000) {
    this.messages = [];
    
    const uniqueGroupId = `verify-group-${Date.now()}`;
    const consumer = this.kafka.consumer({ 
      groupId: uniqueGroupId
    });
    
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        await consumer.disconnect();
        resolve(this.messages);
      }, timeoutMs);

      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const value = message.value.toString();
          this.messages.push(value);
        }
      });
    });
  }

  /**
   * Consume a single latest message
   */
  async consumeLatestMessage(topic, timeoutMs = 15000) {
    const messages = await this.consumeLatestMessages(topic, 1, timeoutMs);
    return messages[0];
  }

  /**
   * Decode Base64 string
   */
  decodeBase64(encodedString) {
    return Buffer.from(encodedString, 'base64').toString('utf-8');
  }

  /**
   * Parse JSON message
   */
  parseMessage(messageString) {
    try {
      return JSON.parse(messageString);
    } catch (error) {
      console.error('Failed to parse message:', messageString);
      throw error;
    }
  }

  async disconnect() {
    if (this.admin) {
      await this.admin.disconnect();
      console.log('✓ Disconnected from Kafka');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = KafkaHelper;