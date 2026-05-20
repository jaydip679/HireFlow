import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom console format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true })
  ),
  transports: [
    // Always write errors to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: json()
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: json()
    })
  ]
});

// If we are not in production, log to console in colorized development format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      devFormat
    )
  }));
} else {
  // In production, also log JSON to standard output
  logger.add(new winston.transports.Console({
    format: json()
  }));
}

// Create a stream object for Morgan middleware integration
export const morganStream = {
  write: (message) => logger.info(message.trim())
};

export default logger;
