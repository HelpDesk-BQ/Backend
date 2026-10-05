import 'dotenv/config';
import { runner } from 'node-pg-migrate';

const direction = process.argv[2] === 'down' ? 'down' : 'up';

await runner({
  databaseUrl: process.env.DATABASE_URL,
  dir: 'migrations',
  direction,
  migrationsTable: 'pgmigrations',
  verbose: true,
});
