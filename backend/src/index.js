import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from './routes.js';
import registro from './registro.js';
import { pool } from './db.js';
import { asegurarEsquema } from './esquema.js';
import { sembrarCatalogo } from './seedCatalogo.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/registro', registro);
app.use('/api', routes);

const port = process.env.PORT || 4000;
pool.query('SELECT 1')
  .then(() => asegurarEsquema())
  .then(() => sembrarCatalogo())
  .then(() => app.listen(port, () => console.log(`API lista en http://localhost:${port}/api`)))
  .catch((e) => { console.error('No se pudo preparar MySQL o el catálogo:', e.message); process.exit(1); });
