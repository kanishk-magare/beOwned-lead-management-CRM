const { Sequelize } = require('sequelize');
const { Pool, types } = require('pg');
const env = require('./env');

// Return NUMERIC columns (e.g. budget) as JS numbers instead of strings
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));
// Return COUNT(*) (bigint) as JS numbers
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));

const connectionString = env.databaseUrl || 'postgresql://postgres:postgres@localhost:5435/beowned_crm';

// Sequelize ORM instance
const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false,
});

// pg pool instance (kept for raw utility support)
const pool = new Pool(env.databaseUrl ? { connectionString: env.databaseUrl } : {});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  sequelize,
  pool,
  query,
};
