// Revisa al arrancar que la base de datos tenga las tablas y columnas que usa la API.
// Si falta una tabla la crea; si falta una columna la agrega. Así un "Error interno del servidor"
// por una BD vieja o incompleta se corrige solo (o al menos se explica en la consola).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(dir, '../database/tienda_motos.sql'), 'utf8');

// Extrae { tabla: { columnas: { nombre: definición }, ddl } } del script SQL
function leerEsquema() {
  const tablas = {};
  for (const m of sql.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\);/g)) {
    const columnas = {};
    for (const linea of m[2].split('\n')) {
      const c = linea.match(/^\s{2}(\w+)\s+(.*?),?\s*$/);
      if (c && !/^(FOREIGN|INDEX|PRIMARY|UNIQUE|KEY|CONSTRAINT)$/i.test(c[1])) columnas[c[1]] = c[2];
    }
    tablas[m[1]] = { columnas, ddl: `CREATE TABLE IF NOT EXISTS ${m[1]} (${m[2]}\n)` };
  }
  return tablas;
}

export async function asegurarEsquema() {
  const esperado = leerEsquema();
  const [filas] = await pool.query(
    'SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()');
  const actual = {};
  for (const { t, c } of filas) (actual[t.toLowerCase()] ||= new Set()).add(c.toLowerCase());

  for (const [tabla, { columnas, ddl }] of Object.entries(esperado)) {
    if (!actual[tabla]) {
      console.warn(`[esquema] Falta la tabla "${tabla}": la creo.`);
      await pool.query(ddl);
      continue;
    }
    for (const [col, def] of Object.entries(columnas)) {
      if (actual[tabla].has(col.toLowerCase())) continue;
      console.warn(`[esquema] Falta la columna ${tabla}.${col}: la agrego.`);
      try {
        await pool.query(`ALTER TABLE ${tabla} ADD COLUMN ${col} ${def}`);
      } catch (e) {
        console.error(`[esquema] No pude agregar ${tabla}.${col}: ${e.message}. Ejecuta "npm run db:init" en backend/.`);
      }
    }
  }
}
