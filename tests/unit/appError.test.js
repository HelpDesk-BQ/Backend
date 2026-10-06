import { AppError } from '../../src/utils/AppError.js';

describe('AppError', () => {
  test('carries status, code and message', () => {
    const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Resource not found');
    expect(error.isOperational).toBe(true);
  });

  test('defaults to internal error', () => {
    const error = new AppError();

    expect(error.status).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
  });
});
