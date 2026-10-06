import { generateCorrelationId, resolveCorrelationId, isValidCorrelationId } from '../../src/utils/correlation.js';

describe('correlation', () => {
  test('generates unique uuid v4 identifiers', () => {
    const first = generateCorrelationId();
    const second = generateCorrelationId();

    expect(isValidCorrelationId(first)).toBe(true);
    expect(isValidCorrelationId(second)).toBe(true);
    expect(first).not.toBe(second);
  });

  test('keeps incoming identifier when valid', () => {
    const incoming = generateCorrelationId();

    expect(resolveCorrelationId(incoming)).toBe(incoming);
  });

  test.each([undefined, null, '', 'not-a-uuid', 123])(
    'generates new identifier when incoming is %p',
    (incoming) => {
      const resolved = resolveCorrelationId(incoming);

      expect(isValidCorrelationId(resolved)).toBe(true);
    }
  );
});
