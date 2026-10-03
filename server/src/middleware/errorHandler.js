const AppError = require('../utils/AppError');
const env = require('../config/env');

// PostgreSQL error codes → friendly HTTP errors
const PG_ERRORS = {
  23505: (err) => {
    if (err.constraint === 'leads_phone_unique') {
      return new AppError(409, 'A lead with this phone number already exists', {
        phone: 'This phone number is already registered',
      });
    }
    if (err.constraint === 'leads_email_unique' || (err.constraint && err.constraint.includes('email'))) {
      return new AppError(409, 'A lead with this email address already exists', {
        email: 'This email address is already registered',
      });
    }
    return new AppError(409, 'Duplicate value');
  },
  23503: () => new AppError(404, 'Referenced record does not exist'),
  23514: () => new AppError(400, 'One or more values are not allowed'),
  '22P02': () => new AppError(400, 'Invalid input syntax'),
};

const notFound = (req, res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.type === 'entity.parse.failed') {
    error = AppError.badRequest('Malformed JSON in request body');
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.fields || {})[0] || '';
    const isPhone = field.includes('phone') || (err.parent && err.parent.constraint === 'leads_phone_unique');
    const isEmail = field.includes('email') || (err.parent && err.parent.constraint && err.parent.constraint.includes('email'));
    if (isPhone) {
      error = new AppError(409, 'A lead with this phone number already exists', {
        phone: 'This phone number is already registered',
      });
    } else if (isEmail) {
      error = new AppError(409, 'A lead with this email address already exists', {
        email: 'This email address is already registered',
      });
    } else {
      error = new AppError(409, 'Duplicate value');
    }
  } else if (err.name === 'SequelizeValidationError') {
    const details = {};
    for (const item of err.errors || []) {
      details[item.path] = item.message;
    }
    error = AppError.badRequest('Validation failed', details);
  } else if (err.code && PG_ERRORS[err.code]) {
    error = PG_ERRORS[err.code](err);
  } else if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000') {
    console.error('Database connection error:', err.message);
    error = new AppError(503, 'Database is unavailable. Please try again later.');
  }

  if (!(error instanceof AppError)) {
    console.error(err);
    error = new AppError(500, 'Something went wrong on our end');
    if (!env.isProduction) error.details = { debug: err.message };
  }

  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      ...(error.details && { details: error.details }),
    },
  });
};

module.exports = { notFound, errorHandler };
