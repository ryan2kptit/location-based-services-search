import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DB_TYPE: Joi.string().valid('postgres', 'mysql').default('mysql'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_POOL_SIZE: Joi.number().default(20),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_TTL: Joi.number().default(300),

  // JWT
  JWT_ALGORITHM: Joi.string().valid('RS256').default('RS256'),
  JWT_ACCESS_TOKEN_EXPIRY: Joi.string().default('1h'),
  JWT_REFRESH_TOKEN_EXPIRY: Joi.string().default('7d'),
  JWT_PRIVATE_KEY_PATH: Joi.string().required(),
  JWT_PUBLIC_KEY_PATH: Joi.string().required(),

  // Security
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),

  // Rate Limiting (Throttling)
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  THROTTLE_AUTH_LIMIT: Joi.number().default(5),

  // CORS
  CORS_ORIGIN: Joi.string().required(),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_DIR: Joi.string().default('logs'),
  LOG_MAX_FILES: Joi.string().default('14d'),
});
