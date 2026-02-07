# E-Commerce Kafka Microservice

Full-stack e-commerce application with Spring Boot, Kafka messaging, and Playwright testing.

## Project Structure
```
ecommerce-kafka-microservice/
├── spring-boot-app/        # Spring Boot backend
├── playwright-tests/       # Playwright E2E tests
└── .github/workflows/      # CI/CD pipeline
```

## Prerequisites

- Java 21
- Node.js 18+
- Maven 3.9+
- MySQL 8.0
- Apache Kafka

## Quick Start

### Spring Boot Application
```bash
cd spring-boot-app
mvn clean install
mvn spring-boot:run
```

### Playwright Tests
```bash
cd playwright-tests
npm install
npx playwright install
npm test
```

## CI/CD Pipeline

Push to `main` branch triggers:
1. Build Spring Boot app
2. Run unit tests
3. Run Playwright integration tests
4. Deploy to TST (if all tests pass)

## Local Development

See individual README files:
- [Spring Boot App](./spring-boot-app/README.md)
- [Playwright Tests](./playwright-tests/README.md)