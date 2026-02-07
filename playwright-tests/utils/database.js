const mysql = require('mysql2/promise');
const config = require('../config/test.config');

class DatabaseHelper {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (!this.connection) {
      this.connection = await mysql.createConnection({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database
      });
      console.log('✓ Connected to MySQL database');
    }
    return this.connection;
  }

  // ========== USER METHODS ==========
  
  async getUserById(id) {
    const connection = await this.connect();
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  async getLatestUser() {
    const connection = await this.connect();
    const [rows] = await connection.execute(
      'SELECT * FROM users ORDER BY id DESC LIMIT 1'
    );
    return rows[0];
  }

  async getUserByEmail(email) {
    const connection = await this.connect();
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  async getAllUsers() {
    const connection = await this.connect();
    const [rows] = await connection.execute('SELECT * FROM users');
    return rows;
  }

  async deleteUserById(id) {
    const connection = await this.connect();
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    console.log(`✓ Deleted user with ID: ${id}`);
  }

  async deleteUserByEmail(email) {
    const connection = await this.connect();
    await connection.execute('DELETE FROM users WHERE email = ?', [email]);
    console.log(`✓ Deleted user with email: ${email}`);
  }

  async clearAllUsers() {
    const connection = await this.connect();
    await connection.execute('DELETE FROM users');
    console.log('✓ Cleared all users from database');
  }

  // ========== LOGIN HISTORY METHODS ==========

  async getLoginHistoryByUserId(userId) {
    const connection = await this.connect();
    const [rows] = await connection.execute(
      'SELECT * FROM login_history WHERE user_id = ? ORDER BY login_time DESC',
      [userId]
    );
    return rows;
  }

  async getLatestLoginHistory() {
    const connection = await this.connect();
    const [rows] = await connection.execute(
      'SELECT * FROM login_history ORDER BY id DESC LIMIT 1'
    );
    return rows[0];
  }

  async getLoginHistoryByEmail(email) {
    const connection = await this.connect();
    const [rows] = await connection.execute(
      'SELECT * FROM login_history WHERE email = ? ORDER BY login_time DESC',
      [email]
    );
    return rows;
  }

  async clearLoginHistory() {
    const connection = await this.connect();
    await connection.execute('DELETE FROM login_history');
    console.log('✓ Cleared login history from database');
  }

  // ========== COMBINED QUERIES ==========

  async getUserWithLoginHistory(email) {
    const connection = await this.connect();
    const [rows] = await connection.execute(
      `SELECT 
        u.*,
        COUNT(lh.id) as login_count,
        MAX(lh.login_time) as last_login
      FROM users u
      LEFT JOIN login_history lh ON u.id = lh.user_id
      WHERE u.email = ?
      GROUP BY u.id`,
      [email]
    );
    return rows[0];
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('✓ Closed database connection');
    }
  }
}

module.exports = new DatabaseHelper();