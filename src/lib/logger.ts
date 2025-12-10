type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    // Ở môi trường Dev thì log ra console đẹp
    // Ở Prod thì gửi về Sentry / Datadog
    const logData = {
      timestamp,
      level,
      message,
      meta, // Context: UserID, RequestID, v.v.
    };

    if (process.env.NODE_ENV === 'development') {
        const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
        console.log(color, `[${level.toUpperCase()}]`, '\x1b[0m', message, meta ? meta : '');
    } else {
        // TODO: Integration with Sentry/CloudWatch here
        console.log(JSON.stringify(logData));
    }
  }

  info(message: string, meta?: any) { this.log('info', message, meta); }
  warn(message: string, meta?: any) { this.log('warn', message, meta); }
  error(message: string, error?: any) {
    this.log('error', message, {
      stack: error?.stack,
      message: error?.message || error,
      ...error // Spread custom props
    });
  }
}

export const logger = new Logger();