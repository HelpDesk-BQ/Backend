import 'dotenv/config';
import bcrypt from 'bcrypt';
import { loadEnv } from '../src/config/env.js';
import { createPool } from '../src/db/pool.js';

const env = loadEnv(process.env);
const pool = createPool(env.DATABASE_URL);

const SEED_USERS = [
  { name: 'Admin BQ', email: 'admin@exemplo.local', password: 'Admin123!', role: 'admin' },
  { name: 'Rafa Tecnico', email: 'tecnico@exemplo.local', password: 'Tecnico123!', role: 'technician' },
  { name: 'Lia Solicitante', email: 'lia@exemplo.local', password: 'Solicitante123!', role: 'requester' },
];

for (const seed of SEED_USERS) {
  const passwordHash = await bcrypt.hash(seed.password, env.BCRYPT_COST);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [seed.name, seed.email.toLowerCase(), passwordHash, seed.role]
  );
  console.log(`seeded ${seed.email}`);
}

const ids = {};
for (const email of SEED_USERS.map((user) => user.email)) {
  const result = await pool.query('SELECT id, role FROM users WHERE email = $1 LIMIT 1', [email]);
  ids[email] = result.rows[0];
}

// Seed estável de demonstração (A12): 12 chamados — 3 open, 3 analysis,
// 3 in_progress, 2 resolved, 1 closed; prioridades distribuídas + 1 crítico.
const SEED_TICKETS = [
  { title: 'Impressora do setor fiscal parou', priority: 'high', status: 'open' },
  { title: 'Computador da recepcao nao inicializa', priority: 'medium', status: 'open' },
  { title: 'Acesso ao portal do aluno negado', priority: 'low', status: 'open' },
  { title: 'Rede sem fio instavel no laboratorio', priority: 'high', status: 'analysis' },
  { title: 'Sistema de notas fora do ar parcial', priority: 'critical', status: 'analysis' },
  { title: 'Teclado do laboratório 2 com defeito', priority: 'low', status: 'analysis' },
  { title: 'Falha ao emitir relatorio de chamados', priority: 'medium', status: 'in_progress' },
  { title: 'Backup do servidor de arquivos lento', priority: 'high', status: 'in_progress' },
  { title: 'Conta de e-mail institucional bloqueada', priority: 'medium', status: 'in_progress' },
  { title: 'Atualizacao do antivirus concluida', priority: 'low', status: 'resolved' },
  { title: 'Troca de projetor da sala de aula', priority: 'medium', status: 'resolved' },
  { title: 'Vazamento crítico no banco de dados', priority: 'critical', status: 'closed' },
];

const existing = await pool.query('SELECT COUNT(*) AS count FROM tickets');
if (Number(existing.rows[0].count) === 0) {
  const requesterId = ids['lia@exemplo.local'].id;
  const technicianId = ids['tecnico@exemplo.local'].id;
  for (const ticket of SEED_TICKETS) {
    const description =
      `${ticket.title}. Registro de demonstração para o ambiente demo: ` +
      'sintomas observados, impacto no setor e passos já tentados pela equipe local.';
    await pool.query(
      `INSERT INTO tickets (title, description, priority, status, requester_id, assignee_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        ticket.title,
        description,
        ticket.priority,
        ticket.status,
        requesterId,
        ticket.status === 'open' ? null : technicianId,
      ]
    );
  }
  console.log('seeded 12 tickets');
} else {
  console.log('tickets already seeded, skipping');
}

await pool.end();
