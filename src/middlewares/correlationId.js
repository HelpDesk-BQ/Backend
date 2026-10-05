import { resolveCorrelationId } from '../utils/correlation.js';

export function attachCorrelationId(req, res, next) {
  const incoming = req.headers['x-correlation-id'];
  const correlationId = resolveCorrelationId(incoming);
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}
