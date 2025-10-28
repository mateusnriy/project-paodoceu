import winston from 'winston';
import { env } from '../config/env'; // Importa env normalmente

// Define os formatos de log
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(), // Formato JSON para arquivos
);

// Cria o logger do Winston
export const logger = winston.createLogger({
  // CORREÇÃO: Determina o nível dinamicamente AQUI,
  // garantindo que 'env' já foi inicializado.
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat, // Formato padrão para arquivos
  transports: [
    // Transporte para console (apenas em desenvolvimento)
    new winston.transports.Console({
      // Mostra console apenas se não for produção OU se não for teste
      // (para evitar poluir a saída dos testes)
      silent: env.NODE_ENV === 'production' || env.NODE_ENV === 'test',
      format: consoleFormat, // Usa formato colorido para console
    }),
    // Transporte para arquivo de erros
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error', // Loga apenas erros neste arquivo
    }),
    // Transporte para arquivo combinado (todos os logs)
    new winston.transports.File({
      filename: 'logs/combined.log',
      // Não define 'level' para logar tudo a partir do nível principal ('info' ou 'debug')
    }),
  ],
  // Não trava a aplicação em erros não tratados (boa prática)
  exitOnError: false,
});

// Stream para Morgan (se usado futuramente)
// export const stream = {
//   write: (message: string) => {
//     logger.info(message.trim());
//   },
// };
