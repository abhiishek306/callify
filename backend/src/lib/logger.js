import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const requestLogger = (req, res, next) => {
  req.id = req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  res.setHeader("x-request-id", req.id);

  logger.info({
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  }, "Incoming request");

  const start = Date.now();

  res.on("finish", () => {
    logger.info({
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    }, "Request completed");
  });

  next();
};
