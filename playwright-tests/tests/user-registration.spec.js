const { test, expect } = require('@playwright/test');
const db = require('../utils/database');
const KafkaHelper = require('../utils/kafka');
const helpers = require('../utils/helpers');
const config = require('../config/test.config');

test.describe('User Registration Tests', () => {
  let kafkaHelper;

  test.beforeAll(async () => {
    await db.connect();
    kafkaHelper = new KafkaHelper();
    await kafkaHelper.connect();
  });

  test.afterAll(async () => {
    await kafkaHelper.disconnect();
    await db.close();
  });

  test('Should register user and validate Kafka registration event', async ({ page }) => {
    const testUser = helpers.generateRandomUser();
    console.log('\n📝 Test User Data:', testUser);
    console.log('═══════════════════════════════════════════════════════════');

    // Navigate to registration page
    console.log('\n🌐 Navigating to registration page...');
    await page.goto('/register');
    await expect(page).toHaveTitle(/Register/);

    // Fill registration form
    console.log('\n📝 Filling registration form...');
    await page.fill('#name', testUser.name);
    await page.fill('#age', testUser.age.toString());
    await page.selectOption('#gender', testUser.gender);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);

    // Submit form
    console.log('\n✉️ Submitting registration...');
    
    await page.click('button[type="submit"]');
    
    // Wait for success message
    try {
      await page.waitForSelector('.message.success', { 
        state: 'visible',
        timeout: 10000 
      });
      console.log('✓ Registration success message displayed');
    } catch (error) {
      console.log('⚠ Success message timeout');
    }

    // Wait for backend processing
    console.log('\n⏳ Waiting for backend processing...');
    await page.waitForTimeout(3000);

    // Consume Kafka messages
    console.log('\n📨 Consuming Kafka messages...');
    
    const plainMessages = await kafkaHelper.consumeAllMessages(
      config.kafka.userEventsTopic,
      5000
    );
    
    const serializedMessages = await kafkaHelper.consumeAllMessages(
      config.kafka.userEventsSerializedTopic,
      5000
    );

    console.log(`✓ Received ${plainMessages.length} message(s) from user-events-topic`);
    console.log(`✓ Received ${serializedMessages.length} message(s) from serialized topic`);

    // Get latest messages
    const plainEvent = helpers.parseKafkaMessage(plainMessages[plainMessages.length - 1]);
    const decodedSerialized = kafkaHelper.decodeBase64(serializedMessages[serializedMessages.length - 1]);
    const serializedEvent = helpers.parseKafkaMessage(decodedSerialized);

    // Get from database
    console.log('\n💾 Retrieving user from database...');
    const dbUser = await db.getUserByEmail(testUser.email);
    expect(dbUser).toBeTruthy();

    // ═══════════════════════════════════════════════════════════
    // DETAILED REPORT
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           REGISTRATION TEST DETAILED REPORT                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 1. DATABASE RECORD                                          │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(`  • ID          : ${dbUser.id}`);
    console.log(`  • Name        : ${dbUser.name}`);
    console.log(`  • Age         : ${dbUser.age}`);
    console.log(`  • Gender      : ${dbUser.gender}`);
    console.log(`  • Email       : ${dbUser.email}`);
    console.log(`  • Created At  : ${dbUser.created_at}`);
    
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 2. KAFKA REGISTRATION EVENT (Plain)                         │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(JSON.stringify(plainEvent, null, 2));
    
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 3. KAFKA REGISTRATION EVENT (Serialized & Decoded)          │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(JSON.stringify(serializedEvent, null, 2));
    
    // Validate
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 4. VALIDATION RESULTS                                       │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const plainComparison = helpers.compareRegistrationData(dbUser, plainEvent);
    const serializedComparison = helpers.compareRegistrationData(dbUser, serializedEvent);
    
    console.log('\nDatabase vs Plain Kafka Event:');
    if (plainComparison.isMatch) {
      console.log('  ✓ MATCH - All fields are identical');
    } else {
      console.log('  ✗ MISMATCH:');
      plainComparison.differences.forEach(diff => console.log(`    - ${diff}`));
    }
    
    console.log('\nDatabase vs Serialized Kafka Event:');
    if (serializedComparison.isMatch) {
      console.log('  ✓ MATCH - All fields are identical');
    } else {
      console.log('  ✗ MISMATCH:');
      serializedComparison.differences.forEach(diff => console.log(`    - ${diff}`));
    }
    
    // Assertions
    expect(plainComparison.isMatch).toBe(true);
    expect(serializedComparison.isMatch).toBe(true);
    expect(plainEvent.action).toBe('registration');
    expect(serializedEvent.action).toBe('registration');

    console.log('\n🎉 Registration test passed!\n');

    // Cleanup
    await db.deleteUserByEmail(testUser.email);
  });
});