const app = require('./app');
const env = require('./config/env');
const { pool, sequelize } = require('./config/db');
require('./workers/importQueue');
const migrate = require('./db/migrate');

async function start() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      await pool.query('SELECT 1');
      // Make sure tables exist so a fresh clone "just works"
      await migrate();
      console.log('Database connected and schema verified');
      break;
    } catch (err) {
      retries++;
      if (retries >= maxRetries) {
        console.error('Could not connect to PostgreSQL:', err.message);
        console.error('Check database configuration in .env and ensure the service is running.');
        process.exit(1);
      }
      console.log(`Waiting for database (attempt ${retries}/${maxRetries})...`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  const server = app.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}/api`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
