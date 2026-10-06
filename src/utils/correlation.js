import { randomUUID } from 'node:crypto';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidCorrelationId(value) {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value);
}

export function generateCorrelationId() {
  return randomUUID();
}

export function resolveCorrelationId(incoming) {
  if (isValidCorrelationId(incoming)) {
    return incoming;
  }
  return generateCorrelationId();
}
