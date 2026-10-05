import { AppError } from '../utils/AppError.js';
import { generateCorrelationId } from '../utils/correlation.js';

function buildErrorBody(code, message, correlationId) {
  return { error: { code, message, correlationId } };
}

// Resposta externa genérica; detalhes ficam só no log interno.
export function errorHandler(err, req, res, _next) {
  const correlationId = req.correlationId || res.getHeader('X-Correlation-Id') || generateCorrelationId();

  res.setHeader('X-Correlation-Id', correlationId);

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.status).json(buildErrorBody(err.code, err.message, correlationId));
  }

  if (err && err.type === 'entity.too.large') {
    return res.status(413).json(buildErrorBody('PAYLOAD_TOO_LARGE', 'Payload too large', correlationId));
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(buildErrorBody('INVALID_JSON', 'Invalid JSON payload', correlationId));
  }

  if (err && err.name === 'ZodError') {
    return res.status(400).json(buildErrorBody('VALIDATION_ERROR', 'Revise os campos destacados.', correlationId));
  }

  return res.status(500).json(buildErrorBody('INTERNAL_ERROR', 'An unexpected error occurred', correlationId));
}
