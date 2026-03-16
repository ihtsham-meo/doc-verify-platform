import fs from 'fs';
import path from 'path';
import pool from './db';
import dotenv from 'dotenv';
dotenv.config();

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Running database migration...');
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(sql);
    console.log('Migration completed successfully.');

    // Create a default admin user for testing
    const adminEmail = 'admin@docverify.com';
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existing.rowCount === 0) {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash('Admin@1234', 12);
      await client.query(
        `INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin')`,
        [adminEmail, hash]
      );
      console.log('Default admin created: admin@docverify.com / Admin@1234');
    } else {
      console.log('Admin user already exists, skipping.');
    }

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();