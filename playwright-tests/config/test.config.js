require('dotenv').config();

module.exports = {
  app: {
    url: process.env.APP_URL
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  kafka: {
    broker: process.env.KAFKA_BROKER,
    userEventsTopic: process.env.KAFKA_USER_EVENTS_TOPIC,
    userEventsSerializedTopic: process.env.KAFKA_USER_EVENTS_SERIALIZED_TOPIC,
    groupId: process.env.KAFKA_GROUP_ID
  }
};