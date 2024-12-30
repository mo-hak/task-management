import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transports: [
          // Console transport
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context, trace }) => {
                return `${timestamp} [${level}] [${context || 'Application'}]: ${message}${
                  trace ? `\n${trace}` : ''
                }`;
              }),
            ),
          }),
          // File transport for errors
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
          // File transport for all logs
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        ],
        // Log level based on environment
        level: config.get('NODE_ENV') === 'production' ? 'info' : 'debug',
      }),
    }),
  ],
})
export class LoggingModule {} 