// Sessão via cookie httpOnly (RNF04: token fora do alcance de JS/XSS).
// CSRF: SameSite=Lax + nenhuma rota GET com efeito colateral — mutações são
// POST/PATCH/DELETE, que o navegador não envia cross-site com Lax.

export const SESSION_COOKIE_NAME = 'helpdesk_token';

export function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    if (name) out[name] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}

export function expiresInToMs(value) {
  const match = /^(\d+)([smhd])$/.exec(String(value || ''));
  if (!match) throw new Error('Invalid expires format');
  const amount = Number(match[1]);
  const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return amount * factor;
}
