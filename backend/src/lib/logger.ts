import winston from 'winston';
import path from 'path';

// Determina o nível de log baseado no ambiente (padrão 'info')
const logLevel = process.env.LOG_LEVEL || 'info';

// Define onde os logs serão salvos
const logDir = path.join(__dirname, '../../logs'); // Cria pasta 'logs' na raiz do backend

// Formato customizado para os logs
const customFormat = winston.format.printf(({ level, message, timestamp, service, ...metadata }) => {
  let msg = `${timestamp} [${service || 'app'}] ${level}: ${message}`;
  // Adiciona metadados extras se existirem
  if (Object.keys(metadata).length > 0) {
    // Evita circular references ao converter para string
    try {
      msg += ` ${JSON.stringify(metadata, (key, value) => {
        if (value instanceof Error) {
          return { message: value.message, stack: value.stack };
        }
        return value;
      })}`;
    } catch (e) {
      msg += ' [metadata serialization error]';
    }
  }
  return msg;
});

const logger = winston.createLogger({
  level: logLevel, // Nível mínimo de log a ser registrado
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Inclui stack trace de erros
    winston.format.splat(),
    customFormat
  ),
  defaultMeta: { service: 'pao-do-ceu-api' }, // Metadados padrão
  transports: [
    // Transporte para salvar logs de erro em um arquivo
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Transporte para salvar todos os logs em outro arquivo
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Não registrar logs não tratados (exceções) automaticamente no arquivo,
  // pois o errorMiddleware já fará isso de forma estruturada.
  // exceptionHandlers: [
  //   new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  // ],
  exitOnError: false, // Não encerrar a aplicação em erros não tratados
});

// Se não estiver em produção, adicionar logs coloridos ao console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(), // Adiciona cores
      customFormat
    ),
  }));
}

// Criar um stream para logs HTTP (ex: com morgan)
// export const stream = {
//   write: (message: string) => {
//     logger.info(message.trim());
//   },
// };

export default logger;
