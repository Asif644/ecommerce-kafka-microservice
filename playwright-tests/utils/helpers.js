class TestHelpers {
  generateRandomUser() {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return {
      name: `Test User ${timestamp}`,
      age: Math.floor(Math.random() * 50) + 20,
      gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)],
      email: `testuser${timestamp}_${randomNum}@example.com`,
      password: 'Test@123'
    };
  }

  parseKafkaMessage(messageString) {
    try {
      return JSON.parse(messageString);
    } catch (error) {
      console.error('Failed to parse Kafka message:', messageString);
      throw error;
    }
  }

  /**
   * Compare registration event with database record
   */
  compareRegistrationData(dbUser, kafkaEvent) {
    const differences = [];

    if (!kafkaEvent.action || kafkaEvent.action !== 'registration') {
      differences.push(`Action mismatch: Expected "registration", got "${kafkaEvent.action}"`);
    }

    if (dbUser.id !== kafkaEvent.userId) {
      differences.push(`User ID mismatch: DB="${dbUser.id}", Kafka="${kafkaEvent.userId}"`);
    }

    if (dbUser.name !== kafkaEvent.name) {
      differences.push(`Name mismatch: DB="${dbUser.name}", Kafka="${kafkaEvent.name}"`);
    }

    if (dbUser.age !== kafkaEvent.age) {
      differences.push(`Age mismatch: DB="${dbUser.age}", Kafka="${kafkaEvent.age}"`);
    }

    if (dbUser.gender !== kafkaEvent.gender) {
      differences.push(`Gender mismatch: DB="${dbUser.gender}", Kafka="${kafkaEvent.gender}"`);
    }

    if (dbUser.email !== kafkaEvent.email) {
      differences.push(`Email mismatch: DB="${dbUser.email}", Kafka="${kafkaEvent.email}"`);
    }

    return {
      isMatch: differences.length === 0,
      differences
    };
  }

  /**
   * Compare login event with database record
   */
  compareLoginData(dbUser, loginHistory, kafkaEvent) {
    const differences = [];

    if (!kafkaEvent.action || kafkaEvent.action !== 'login') {
      differences.push(`Action mismatch: Expected "login", got "${kafkaEvent.action}"`);
    }

    if (dbUser.id !== kafkaEvent.userId) {
      differences.push(`User ID mismatch: DB="${dbUser.id}", Kafka="${kafkaEvent.userId}"`);
    }

    if (dbUser.name !== kafkaEvent.name) {
      differences.push(`Name mismatch: DB="${dbUser.name}", Kafka="${kafkaEvent.name}"`);
    }

    if (dbUser.email !== kafkaEvent.email) {
      differences.push(`Email mismatch: DB="${dbUser.email}", Kafka="${kafkaEvent.email}"`);
    }

    if (loginHistory && loginHistory.email !== kafkaEvent.email) {
      differences.push(`Login history email mismatch: DB="${loginHistory.email}", Kafka="${kafkaEvent.email}"`);
    }

    return {
      isMatch: differences.length === 0,
      differences
    };
  }

  formatDate(date) {
    return new Date(date).toISOString();
  }
}

module.exports = new TestHelpers();