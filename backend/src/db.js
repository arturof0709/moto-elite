import mysql from 'mysql2/promise';
import 'dotenv/config';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Admin12345',
  database: process.env.DB_NAME || 'tienda_motos',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true
});
