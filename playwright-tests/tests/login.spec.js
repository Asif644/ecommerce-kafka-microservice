const { test, expect } = require('@playwright/test');
const db = require('../utils/database');
const KafkaHelper = require('../utils/kafka');
const helpers = require('../utils/helpers');
const config = require('../config/test.config');

test.describe('User Login Tests', () => {
  let kafkaHelper;
  let testUser;

  test.beforeAll(async () => {
    await db.connect();
    kafkaHelper = new KafkaHelper();
    await kafkaHelper.connect();
  });

  test.afterAll(async () => {
    await kafkaHelper.disconnect();
    await db.close();
  });

  test.beforeEach(async ({ page }) => {
    // Register a user first
    testUser = helpers.generateRandomUser();
    console.log('\n📝 Registering test user:', testUser.email);
    
    await page.goto('/register');
    await page.fill('#name', testUser.name);
    await page.fill('#age', testUser.age.toString());
    await page.selectOption('#gender', testUser.gender);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    console.log('✓ Test user registered');
  });

  test.afterEach(async () => {
    // Cleanup
    if (testUser) {
      await db.deleteUserByEmail(testUser.email);
    }
  });

  test('Should login user and validate Kafka login event', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('           LOGIN TEST');
    console.log('═══════════════════════════════════════════════════════════');

    // Navigate to login page
    console.log('\n🌐 Navigating to login page...');
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login/);

    // Fill login form
    console.log('\n📝 Filling login form...');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);

    // Submit login
    console.log('\n✉️ Submitting login...');
    
    await page.click('button[type="submit"]');
    
    // Wait for success
    try {
      await page.waitForSelector('.message.success', { 
        state: 'visible',
        timeout: 10000 
      });
      console.log('✓ Login success message displayed');
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

    // Get latest messages (should be login events)
    const plainEvent = helpers.parseKafkaMessage(plainMessages[plainMessages.length - 1]);
    const decodedSerialized = kafkaHelper.decodeBase64(serializedMessages[serializedMessages.length - 1]);
    const serializedEvent = helpers.parseKafkaMessage(decodedSerialized);

    // Get from database
    console.log('\n💾 Retrieving data from database...');
    const dbUser = await db.getUserByEmail(testUser.email);
    const loginHistory = await db.getLatestLoginHistory();
    
    expect(dbUser).toBeTruthy();
    expect(loginHistory).toBeTruthy();

    // ═══════════════════════════════════════════════════════════
    // DETAILED REPORT
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              LOGIN TEST DETAILED REPORT                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 1. DATABASE USER RECORD                                     │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(`  • ID          : ${dbUser.id}`);
    console.log(`  • Name        : ${dbUser.name}`);
    console.log(`  • Email       : ${dbUser.email}`);
    
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 2. DATABASE LOGIN HISTORY                                   │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(`  • Login ID    : ${loginHistory.id}`);
    console.log(`  • User ID     : ${loginHistory.user_id}`);
    console.log(`  • Email       : ${loginHistory.email}`);
    console.log(`  • Login Time  : ${loginHistory.login_time}`);
    console.log(`  • IP Address  : ${loginHistory.ip_address}`);
    
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 3. KAFKA LOGIN EVENT (Plain)                                │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(JSON.stringify(plainEvent, null, 2));
    
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 4. KAFKA LOGIN EVENT (Serialized & Decoded)                 │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(JSON.stringify(serializedEvent, null, 2));
    
    // Validate
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 5. VALIDATION RESULTS                                       │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const plainComparison = helpers.compareLoginData(dbUser, loginHistory, plainEvent);
    const serializedComparison = helpers.compareLoginData(dbUser, loginHistory, serializedEvent);
    
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
    expect(plainEvent.action).toBe('login');
    expect(serializedEvent.action).toBe('login');
    expect(loginHistory.user_id).toBe(dbUser.id);
    expect(loginHistory.email).toBe(dbUser.email);

    console.log('\n🎉 Login test passed!\n');
  });

  test('Should handle invalid login credentials', async ({ page }) => {
    console.log('\n📝 Testing invalid login...');

    await page.goto('/login');
    await page.fill('#email', testUser.email);
    await page.fill('#password', 'WrongPassword123');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMsg = await page.waitForSelector('.message.error', {
      state: 'visible',
      timeout: 5000
    });
    
    expect(errorMsg).toBeTruthy();
    console.log('✓ Error message displayed for invalid credentials');

    // Should NOT create login history
    await page.waitForTimeout(2000);
    const loginHistory = await db.getLoginHistoryByEmail(testUser.email);
    expect(loginHistory.length).toBe(0);
    console.log('✓ No login history created for failed login');

    console.log('\n🎉 Invalid login test passed!\n');
  });
});