// Teste de carga manual — evidência RNF01 (95% ≤ 800 ms com 20 usuários simulados).
// Uso: npm run perf[:carga] (sobe o servidor separadamente) ou:
//   node scripts/perf-rnf01.mjs [--base http://localhost:3000] [--vus 20] [--iters 25] [--out evidencias/resultado.json]
// Senhas abaixo são as do seed de desenvolvimento (fictícias, só para o ambiente demo).

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? true];
  })
);

const BASE = args.base || process.env.PERF_BASE_URL || 'http://localhost:3000';
const VUS = Number(args.vus || 20);
const ITERS = Number(args.iters || 25);
const LIMIT_MS = 800;

const CREDENTIALS = [
  { email: 'lia@exemplo.local', password: process.env.PERF_REQUESTER_PASSWORD || 'Solicitante123!' },
  { email: 'tecnico@exemplo.local', password: process.env.PERF_TECH_PASSWORD || 'Tecnico123!' },
  { email: 'admin@exemplo.local', password: process.env.PERF_ADMIN_PASSWORD || 'Admin123!' },
];

const samples = [];
function record(route, status, ms) {
  samples.push({ route, status, ms });
}

async function timed(route, fn) {
  const start = performance.now();
  try {
    const res = await fn();
    // Consome o corpo para medir a resposta completa.
    res.bodyText = await res.text();
    record(route, res.status, performance.now() - start);
    return res;
  } catch (error) {
    record(route, 'ERR', performance.now() - start);
    throw error;
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// --- Setup: autentica os 3 papéis uma vez (fora da medição) ---
const tokens = {};
for (const cred of CREDENTIALS) {
  const res = await fetch(`${BASE}/api/sessions`, json({ email: cred.email, password: cred.password }));
  if (!res.ok) throw new Error(`setup login falhou para ${cred.email}: HTTP ${res.status}`);
  const body = await res.json();
  tokens[cred.email] = body.data.token;
}
const requester = tokens['lia@exemplo.local'];
const admin = tokens['admin@exemplo.local'];

// Chamado base para leitura por ID (fora da medição).
const baselineRes = await fetch(`${BASE}/api/tickets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${requester}` },
  body: JSON.stringify({
    title: 'Baseline de medicao de desempenho',
    description: 'Chamado criado pelo script de carga para medir leitura por ID no ambiente demo.',
    priority: 'low',
  }),
});
const baseline = await baselineRes.json();
const baselineId = baseline.data.id;

// --- Carga: 20 trabalhadores concorrentes, cada um com ITERS iterações ---
let createdIds = [];
const createdLock = { list: createdIds };
async function worker() {
  for (let i = 0; i < ITERS; i += 1) {
    await timed('GET /health', () => fetch(`${BASE}/health`));
    await timed('GET /api/tickets', () => fetch(`${BASE}/api/tickets?limit=20`, auth(requester)));
    await timed('GET /api/tickets?status+priority', () =>
      fetch(`${BASE}/api/tickets?status=open&priority=high`, auth(requester))
    );
    await timed('GET /api/tickets/:id', () => fetch(`${BASE}/api/tickets/${baselineId}`, auth(requester)));
    // Escrita a cada 5 iterações para não inundar o banco de dev.
    if (i % 5 === 0) {
      const res = await timed('POST /api/tickets', () =>
        fetch(`${BASE}/api/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${requester}` },
          body: JSON.stringify({
            title: `Carga perf ${Date.now()} ${i}`,
            description: 'Chamado gerado pelo teste de carga RNF01; será excluído na limpeza.',
            priority: 'low',
          }),
        })
      );
      if (res.status === 201) {
        const body = JSON.parse(res.bodyText || '{}');
        if (body?.data?.id) createdLock.list.push(body.data.id);
      }
    }
  }
}

await Promise.all(Array.from({ length: VUS }, () => worker()));

// --- Limpeza: exclui os chamados criados (soft delete via admin) ---
for (const id of createdLock.list) {
  await fetch(`${BASE}/api/tickets/${id}`, {
    ...auth(admin),
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ justification: 'Limpeza do teste de carga RNF01.' }),
  }).catch(() => {});
}
await fetch(`${BASE}/api/tickets/${baselineId}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` },
  body: JSON.stringify({ justification: 'Limpeza do teste de carga RNF01.' }),
}).catch(() => {});

// --- Resultado ---
const ok = samples.filter((s) => typeof s.status === 'number' && s.status < 500);
const lat = ok.map((s) => s.ms).sort((a, b) => a - b);
const byRoute = {};
for (const s of ok) {
  byRoute[s.route] = byRoute[s.route] || [];
  byRoute[s.route].push(s.ms);
}
const summary = {
  vus: VUS,
  iters: ITERS,
  requests: samples.length,
  errors5xx: samples.length - ok.length,
  p50Ms: Math.round(percentile(lat, 50)),
  p95Ms: Math.round(percentile(lat, 95)),
  maxMs: Math.round(lat[lat.length - 1] || 0),
  gateMs: LIMIT_MS,
  pass: percentile(lat, 95) <= LIMIT_MS && samples.length - ok.length === 0,
  perRoute: Object.fromEntries(
    Object.entries(byRoute).map(([route, arr]) => {
      const sorted = arr.sort((a, b) => a - b);
      return [route, { n: arr.length, p50Ms: Math.round(percentile(sorted, 50)), p95Ms: Math.round(percentile(sorted, 95)) }];
    })
  ),
};

console.log(JSON.stringify(summary, null, 2));
if (args.out) {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, JSON.stringify({ ...summary, at: new Date().toISOString() }, null, 2));
}
if (!summary.pass) process.exit(1);
