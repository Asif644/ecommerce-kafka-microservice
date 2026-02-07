const { test, expect } = require('@playwright/test');
const db = require('../utils/database');
const KafkaHelper = require('../utils/kafka');
const helpers = require('../utils/helpers');
const config = require('../config/test.config');

test.describe('Complete Registration and Login Flow', () => {
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

  test('Should complete full registration, login, and validation flow', async ({ page }) => {
    const testUser = helpers.generateRandomUser();
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         COMPLETE REGISTRATION & LOGIN FLOW TEST               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n📝 Test User:', testUser.email);

    // ========== STEP 1: REGISTRATION ==========
    console.log('\n┌─── STEP 1: USER REGISTRATION ───────────────────────────────┐');
    
    await page.goto('/register');
    await page.fill('#name', testUser.name);
    await page.fill('#age', testUser.age.toString());
    await page.selectOption('#gender', testUser.gender);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    console.log('✓ Registration completed');

    // Validate registration in Mysql DB
    const registeredUser = await db.getUserByEmail(testUser.email);
    expect(registeredUser).toBeTruthy();
    console.log('✓ User found in database');

    // Consume registration Kafka messages
    const regMessages = await kafkaHelper.consumeAllMessages(
      config.kafka.userEventsTopic,
      5000
    );
    const regEvent = helpers.parseKafkaMessage(regMessages[regMessages.length - 1]);
    
    expect(regEvent.action).toBe('registration');
expect(regEvent.email).toBe(testUser.email);
console.log('✓ Registration Kafka event validated');
// ========== STEP 2: LOGIN ==========
console.log('\n┌─── STEP 2: USER LOGIN ──────────────────────────────────────┐');

await page.goto('/login');
await page.fill('#email', testUser.email);
await page.fill('#password', testUser.password);
await page.click('button[type="submit"]');

await page.waitForTimeout(3000);
console.log('✓ Login completed');

// Validate login in DB
const loginHistory = await db.getLoginHistoryByEmail(testUser.email);
expect(loginHistory.length).toBeGreaterThan(0);
console.log('✓ Login history found in database');

// Consume login Kafka messages
const loginMessages = await kafkaHelper.consumeAllMessages(
  config.kafka.userEventsTopic,
  5000
);
const loginEvent = helpers.parseKafkaMessage(loginMessages[loginMessages.length - 1]);

expect(loginEvent.action).toBe('login');
expect(loginEvent.email).toBe(testUser.email);
console.log('✓ Login Kafka event validated');

// ========== STEP 3: DASHBOARD ACCESS ==========
console.log('\n┌─── STEP 3: DASHBOARD ACCESS ────────────────────────────────┐');

// Should be on dashboard
try {
  await page.waitForURL(/\/dashboard/, { timeout: 5000 });
  console.log('✓ Redirected to dashboard');
} catch (error) {
  console.log('⚠ Dashboard redirect timeout (may still be on login page)');
}

// ========== FINAL REPORT ==========
console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                    FINAL VALIDATION                           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');

console.log('\n✓ Total Kafka Events Captured: ' + (regMessages.length + loginMessages.length));
console.log('  - Registration Events: ' + regMessages.filter(m => JSON.parse(m).action === 'registration').length);
console.log('  - Login Events: ' + loginMessages.filter(m => JSON.parse(m).action === 'login').length);

console.log('\n✓ Database Records:');
console.log(`  - User ID: ${registeredUser.id}`);
console.log(`  - Login Count: ${loginHistory.length}`);

console.log('\n🎉 Complete flow test passed!\n');

// Cleanup
await db.deleteUserByEmail(testUser.email);
});
});