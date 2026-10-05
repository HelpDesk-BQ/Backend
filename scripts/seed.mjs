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

await pool.end();
