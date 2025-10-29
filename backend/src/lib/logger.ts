import winston from 'winston';
import { env } from '../config/env'; 

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(), 
);

export const logger = winston.createLogger({
  
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  transports: [
    new winston.transports.Console({
      silent: env.NODE_ENV === 'test',
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
  exitOnError: false,
});
