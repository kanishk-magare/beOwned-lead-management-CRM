const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    // 1. If any duplicates exist, disambiguate them by appending row id (+id) before applying the constraint
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
          WITH duplicates AS (
            SELECT id, email,
                   ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY id ASC) as rn
            FROM leads
          )
          UPDATE leads l
          SET email = REPLACE(d.email, '@', '+' || d.id || '@')
          FROM duplicates d
          WHERE l.id = d.id AND d.rn > 1;
        END IF;
      END $$;
    `);

    // 2. Run schema.sql
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);
    console.log('Database schema is up to date');
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .catch((err) => {
      console.error('Migration failed:', err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = migrate;
