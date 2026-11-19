// Ejecuta database/tienda_motos.sql: npm run db:init
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const dir = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(dir, '../database/tienda_motos.sql'), 'utf8');

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Admin12345',
  multipleStatements: true
});
await conn.query(sql);
console.log('Base de datos "tienda_motos" creada con datos de ejemplo.');
await conn.end();
