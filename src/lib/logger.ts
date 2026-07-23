const isDev = process.env.NODE_ENV === 'development';

type LogPayload = Record<string, unknown> | unknown;

function format(scope: string, message: string, payload?: LogPayload) {
  if (payload === undefined) return `[MarketAI:${scope}] ${message}`;
  return [`[MarketAI:${scope}] ${message}`, payload] as const;
}

export const logger = {
  error(scope: string, message: string, payload?: LogPayload) {
    const formatted = format(scope, message, payload);
    if (Array.isArray(formatted)) {
      console.error(...formatted);
    } else {
      console.error(formatted);
    }
  },

  warn(scope: string, message: string, payload?: LogPayload) {
    if (!isDev) return;
    const formatted = format(scope, message, payload);
    if (Array.isArray(formatted)) {
      console.warn(...formatted);
    } else {
      console.warn(formatted);
    }
  },

  info(scope: string, message: string, payload?: LogPayload) {
    if (!isDev) return;
    const formatted = format(scope, message, payload);
    if (Array.isArray(formatted)) {
      console.info(...formatted);
    } else {
      console.info(formatted);
    }
  },
};
