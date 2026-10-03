const env = require('./env');

const redisConnection = {
  host: env.redisHost,
  port: env.redisPort,
  maxRetriesPerRequest: null, // Required by BullMQ
};

module.exports = {
  redisConnection,
};
