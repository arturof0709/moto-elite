// Rutas para registrar datos desde los 6 formularios de la página.
//   POST /api/registro/:tabla           -> guarda un registro en esa tabla
//   GET  /api/registro/:tabla/opciones  -> lista [{id, label}] para llenar los <select>
import { Router } from 'express';
import { pool } from './db.js';

const router = Router();
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const ESTADOS = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

// Definición de campos: l = etiqueta (para los mensajes), req = obligatorio, def = valor por defecto
const texto = (l, max, req = false) => ({ tipo: 'texto', l, max, req });
const email = (l, max, req = false) => ({ tipo: 'email', l, max, req });
const entero = (l, min, { req = false, def = null } = {}) => ({ tipo: 'entero', l, min, req, def });
const decimal = (l, min, { req = false, def = null } = {}) => ({ tipo: 'decimal', l, min, req, def });
const fk = (l) => ({ tipo: 'fk', l, req: true });
const lista = (l, valores, def) => ({ tipo: 'enum', l, valores, def });

// Solo se pueden escribir estas tablas y estas columnas (evita inyección y tablas ajenas)
const TABLAS = {
  categorias: {
    campos: { nombre: texto('Nombre', 60, true), descripcion: texto('Descripción', 200) },
    opciones: 'SELECT id, nombre AS label FROM categorias ORDER BY nombre'
  },
  marcas: {
    campos: { nombre: texto('Nombre', 60, true), pais: texto('País', 60) },
    opciones: 'SELECT id, nombre AS label FROM marcas ORDER BY nombre'
  },
  productos: {
    campos: {
      nombre: texto('Nombre', 120, true),
      descripcion: texto('Descripción', 5000),
      precio: decimal('Precio', 0, { req: true }),
      stock: entero('Stock', 0, { def: 0 }),
      cc_minimo: entero('Cilindraje mínimo', 1, { def: 600 }),
      categoria_id: fk('Categoría'),
      marca_id: fk('Marca')
    },
    opciones: 'SELECT id, nombre AS label FROM productos ORDER BY nombre'
  },
  clientes: {
    campos: {
      nombre: texto('Nombre', 100, true),
      email: email('Correo', 120, true),
      telefono: texto('Teléfono', 30),
      direccion: texto('Dirección', 200)
    },
    opciones: "SELECT id, CONCAT(nombre, ' · ', email) AS label FROM clientes ORDER BY nombre"
  },
  pedidos: {
    campos: {
      cliente_id: fk('Cliente'),
      estado: lista('Estado', ESTADOS, 'pendiente'),
      total: decimal('Total', 0, { def: 0 })
    },
    opciones: `SELECT p.id, CONCAT('#', p.id, ' · ', c.nombre, ' · ', p.estado) AS label
                 FROM pedidos p JOIN clientes c ON c.id = p.cliente_id ORDER BY p.id DESC`
  },
  detalle_pedido: {
    campos: {
      pedido_id: fk('Pedido'),
      producto_id: fk('Producto'),
      cantidad: entero('Cantidad', 1, { req: true }),
      precio_unitario: decimal('Precio unitario', 0) // vacío = precio actual del producto
    },
    // Si no escriben precio unitario se toma el del producto
    async antes(datos) {
      if (datos.precio_unitario !== null) return;
      const [[prod]] = await pool.query('SELECT precio FROM productos WHERE id = ?', [datos.producto_id]);
      datos.precio_unitario = prod ? prod.precio : null;
    }
  }
};

// Convierte y valida un valor; devuelve { valor } o { error }
function leer(def, bruto) {
  const vacio = bruto === undefined || bruto === null || String(bruto).trim() === '';
  if (vacio) {
    if (def.req) return { error: `${def.l} es obligatorio` };
    return { valor: def.def ?? null };
  }
  const s = String(bruto).trim();
  switch (def.tipo) {
    case 'texto':
    case 'email':
      if (s.length > def.max) return { error: `${def.l} admite máximo ${def.max} caracteres` };
      if (def.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { error: 'El correo no es válido' };
      return { valor: s };
    case 'entero': {
      const n = Number(s);
      if (!Number.isInteger(n) || n < def.min) return { error: `${def.l} debe ser un entero mayor o igual a ${def.min}` };
      return { valor: n };
    }
    case 'decimal': {
      const n = Number(s);
      if (!Number.isFinite(n) || n < def.min) return { error: `${def.l} debe ser un número mayor o igual a ${def.min}` };
      return { valor: Math.round(n * 100) / 100 };
    }
    case 'fk': {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 1) return { error: `Elige ${def.l.toLowerCase()}` };
      return { valor: n };
    }
    case 'enum':
      if (!def.valores.includes(s)) return { error: `${def.l} no es válido` };
      return { valor: s };
  }
}

const tablaDe = (nombre) => (Object.hasOwn(TABLAS, nombre) ? TABLAS[nombre] : null);

router.post('/:tabla', wrap(async (req, res) => {
  const tabla = tablaDe(req.params.tabla);
  if (!tabla) return res.status(404).json({ error: 'Tabla desconocida' });

  const datos = {};
  const errores = [];
  for (const [col, def] of Object.entries(tabla.campos)) {
    const r = leer(def, req.body?.[col]);
    if (r.error) errores.push(r.error); else datos[col] = r.valor;
  }
  if (errores.length) return res.status(400).json({ error: errores.join('. ') });
  if (tabla.antes) await tabla.antes(datos);

  try {
    const [r] = await pool.query('INSERT INTO ?? SET ?', [req.params.tabla, datos]);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un registro con ese nombre o correo' });
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'El registro relacionado ya no existe' });
    if (e.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return res.status(400).json({ error: 'Algún valor está fuera de rango' });
    if (e.code === 'ER_NO_SUCH_TABLE' || e.code === 'ER_BAD_DB_ERROR') {
      console.error('Falta crear las tablas: ejecuta npm run db:init en backend/');
      return res.status(500).json({ error: 'La base de datos no tiene las tablas. Ejecuta npm run db:init en backend' });
    }
    if (e.code === 'ER_ACCESS_DENIED_ERROR') return res.status(500).json({ error: 'Usuario o contraseña de MySQL incorrectos (revisa backend/.env)' });
    throw e;
  }
}));

router.get('/:tabla/opciones', wrap(async (req, res) => {
  const tabla = tablaDe(req.params.tabla);
  if (!tabla?.opciones) return res.status(404).json({ error: 'Tabla desconocida' });
  const [rows] = await pool.query(tabla.opciones);
  res.json(rows);
}));

export default router;
