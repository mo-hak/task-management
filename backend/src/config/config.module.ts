import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        // Application
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),
        API_PREFIX: Joi.string().default('api'),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),

        // Database
        DATABASE_URL: Joi.string().required(),

        // Authentication
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('24h'),

        // Email
        SMTP_HOST: Joi.string().optional(),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASSWORD: Joi.string().optional(),
        EMAIL_FROM: Joi.string().email().optional(),

        // Rate Limiting
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(100),

        // Logging
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .default('debug'),

        // Redis
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional().allow(''),

        // Swagger
        SWAGGER_TITLE: Joi.string().default('Task Management API'),
        SWAGGER_DESCRIPTION: Joi.string().default('API Documentation'),
        SWAGGER_VERSION: Joi.string().default('1.0'),
        SWAGGER_PATH: Joi.string().default('docs'),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
  ],
})
export class AppConfigModule {} 