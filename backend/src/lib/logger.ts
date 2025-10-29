// backend/src/lib/logger.ts
import winston from 'winston';
import { env } from '../config/env';

// Formato para console com cores e timestamp legível
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
  winston.format.errors({ stack: true }) // Inclui stack trace se houver erro
);

// Formato para arquivos (JSON com timestamp)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // Inclui stack trace
  winston.format.json(),
);

export const logger = winston.createLogger({
  // Nível de log definido pela variável de ambiente
  level: env.LOG_LEVEL,
  // Formato padrão para logs em arquivo
  format: fileFormat,
  transports: [
    // Transporte para o console
    new winston.transports.Console({
      // Silencia o console durante testes
      silent: env.NODE_ENV === 'test',
      format: consoleFormat, // Usa o formato colorido
    }),
    // Transporte para arquivo de erros
    new winston.transports.File({
      filename: 'logs/error.log', // Salva em logs/error.log
      level: 'error', // Apenas logs de nível 'error'
    }),
    // Transporte para arquivo combinado (todos os níveis)
    new winston.transports.File({
      filename: 'logs/combined.log', // Salva em logs/combined.log
    }),
  ],
  // Não finaliza a aplicação em caso de erro não tratado no logger
  exitOnError: false,
});
