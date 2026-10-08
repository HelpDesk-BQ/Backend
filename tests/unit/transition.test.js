import { AppError } from '../../src/utils/AppError.js';
import { assertTransition, ALLOWED_TRANSITIONS } from '../../src/services/transition.js';

describe('ticket transition', () => {
  test('permite resolved -> closed com comentário', () => {
    expect(() => assertTransition({ from: 'resolved', to: 'closed', comment: 'Resolvido' })).not.toThrow();
  });

  test('impede fechamento sem comentário', () => {
    let error = null;
    try {
      assertTransition({ from: 'resolved', to: 'closed', comment: '' });
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('RESOLUTION_COMMENT_REQUIRED');
  });

  test('impede salto open -> closed', () => {
    let error = null;
    try {
      assertTransition({ from: 'open', to: 'closed', comment: 'x' });
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('INVALID_STATE');
  });

  test.each([
    ['open', 'analysis'],
    ['analysis', 'in_progress'],
    ['in_progress', 'resolved'],
    ['resolved', 'in_progress'],
  ])('permite %s -> %s', (from, to) => {
    expect(() => assertTransition({ from, to, comment: 'ok' })).not.toThrow();
  });

  test.each([
    ['open', 'in_progress'],
    ['open', 'resolved'],
    ['analysis', 'resolved'],
    ['analysis', 'closed'],
    ['in_progress', 'closed'],
    ['closed', 'open'],
    ['closed', 'resolved'],
  ])('impede %s -> %s', (from, to) => {
    let error = null;
    try {
      assertTransition({ from, to, comment: 'ok' });
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('INVALID_STATE');
  });

  test('fechamento exige comentário não-branco', async () => {
    for (const comment of [undefined, null, '', '   ']) {
      let error = null;
      try {
        assertTransition({ from: 'resolved', to: 'closed', comment });
      } catch (err) {
        error = err;
      }
      expect(error).toBeInstanceOf(AppError);
      expect(error.status).toBe(409);
      expect(error.code).toBe('RESOLUTION_COMMENT_REQUIRED');
    }
  });

  test('rejeita estado de origem desconhecido', () => {
    let error = null;
    try {
      assertTransition({ from: 'archived', to: 'open', comment: 'x' });
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('INVALID_STATE');
  });

  test('expõe o mapa permitido', () => {
    expect(ALLOWED_TRANSITIONS).toEqual({
      open: ['analysis'],
      analysis: ['in_progress'],
      in_progress: ['resolved'],
      resolved: ['closed', 'in_progress'],
      closed: [],
    });
  });
});
