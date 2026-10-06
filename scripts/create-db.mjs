import 'dotenv/config';
import pg from 'pg';

const url = new URL(process.env.DATABASE_URL);
const dbName = url.pathname.slice(1).replace(/"/g, '');
url.pathname = '/postgres';

const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
await client.query(`CREATE DATABASE "${dbName}"`);
await client.end();
console.log(`database "${dbName}" created`);
