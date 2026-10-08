import { logger } from '../../src/utils/logger.js';

function captureStdout(work) {
  const chunks = [];
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => {
    chunks.push(String(chunk));
    return true;
  };
  try {
    work();
  } finally {
    process.stdout.write = original;
  }
  return chunks.join('');
}

describe('logger', () => {
  test('writes structured json with level, event and timestamp', () => {
    const output = captureStdout(() =>
      logger.info('ticket.created', { correlationId: 'req_1', route: 'POST /api/tickets', status: 201 })
    );

    const line = JSON.parse(output.trim());
    expect(line).toMatchObject({
      level: 'info',
      event: 'ticket.created',
      correlationId: 'req_1',
      status: 201,
    });
    expect(typeof line.timestamp).toBe('string');
  });

  test('exposes warn and error levels', () => {
    for (const level of ['warn', 'error']) {
      const output = captureStdout(() => logger[level]('test.event', {}));
      expect(JSON.parse(output.trim())).toMatchObject({ level, event: 'test.event' });
    }
  });
});
