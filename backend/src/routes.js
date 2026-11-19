import { Router } from 'express';
import { pool } from './db.js';

const router = Router();
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ error: 'Error interno del servidor', detalle: e.sqlMessage || e.message });
});

// Categorías y marcas
router.get('/categorias', wrap(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM categorias ORDER BY nombre');
  res.json(rows);
}));

router.get('/marcas', wrap(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM marcas ORDER BY nombre');
  res.json(rows);
}));

// Productos con filtros (JOIN categorias + marcas + promedio de reseñas)
router.get('/productos', wrap(async (req, res) => {
  const { categoria, marca, q, orden } = req.query;
  const where = [];
  const params = [];
  if (categoria) { where.push('p.categoria_id = ?'); params.push(categoria); }
  if (marca) { where.push('p.marca_id = ?'); params.push(marca); }
  if (q) { where.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const orderBy = { precio_asc: 'p.precio ASC', precio_desc: 'p.precio DESC', nombre: 'p.nombre ASC' }[orden] || 'p.id DESC';

  const [rows] = await pool.query(
    `SELECT p.*, c.nombre AS categoria, m.nombre AS marca,
            ROUND(AVG(r.calificacion), 1) AS promedio, COUNT(r.id) AS total_resenas
       FROM productos p
       JOIN categorias c ON c.id = p.categoria_id
       JOIN marcas m ON m.id = p.marca_id
       LEFT JOIN resenas r ON r.producto_id = p.id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY p.id
      ORDER BY ${orderBy}`, params);
  res.json(rows);
}));

// Detalle de un producto + sus reseñas
router.get('/productos/:id', wrap(async (req, res) => {
  const [[producto]] = await pool.query(
    `SELECT p.*, c.nombre AS categoria, m.nombre AS marca, m.pais
       FROM productos p
       JOIN categorias c ON c.id = p.categoria_id
       JOIN marcas m ON m.id = p.marca_id
      WHERE p.id = ?`, [req.params.id]);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  const [resenas] = await pool.query(
    `SELECT r.id, r.calificacion, r.comentario, r.fecha, cl.nombre AS cliente
       FROM resenas r JOIN clientes cl ON cl.id = r.cliente_id
      WHERE r.producto_id = ? ORDER BY r.fecha DESC`, [req.params.id]);
  res.json({ ...producto, resenas });
}));

// Crear pedido (transacción: cliente + pedido + detalle + descuento de stock)
router.post('/pedidos', wrap(async (req, res) => {
  const { cliente, items } = req.body;
  if (!cliente?.nombre || !cliente?.email || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Faltan datos del cliente o del carrito' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO clientes (nombre, email, telefono, direccion) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), telefono=VALUES(telefono), direccion=VALUES(direccion)`,
      [cliente.nombre, cliente.email, cliente.telefono || null, cliente.direccion || null]);
    const [[{ id: clienteId }]] = await conn.query('SELECT id FROM clientes WHERE email = ?', [cliente.email]);
    const [pedido] = await conn.query('INSERT INTO pedidos (cliente_id) VALUES (?)', [clienteId]);

    let total = 0;
    for (const it of items) {
      const cantidad = Number(it.cantidad);
      const [[prod]] = await conn.query('SELECT nombre, precio, stock FROM productos WHERE id = ? FOR UPDATE', [it.producto_id]);
      if (!prod) throw Object.assign(new Error('Producto inexistente'), { status: 400 });
      if (!(cantidad > 0) || prod.stock < cantidad) {
        throw Object.assign(new Error(`Stock insuficiente de "${prod.nombre}" (quedan ${prod.stock})`), { status: 409 });
      }
      await conn.query('INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?,?,?,?)',
        [pedido.insertId, it.producto_id, cantidad, prod.precio]);
      await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, it.producto_id]);
      total += prod.precio * cantidad;
    }
    await conn.query('UPDATE pedidos SET total = ? WHERE id = ?', [total.toFixed(2), pedido.insertId]);
    await conn.commit();
    res.status(201).json({ id: pedido.insertId, total });
  } catch (e) {
    await conn.rollback();
    if (!e.status) console.error('Error al crear pedido:', e);
    res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo crear el pedido', detalle: e.status ? undefined : (e.sqlMessage || e.message) });
  } finally {
    conn.release();
  }
}));

// Historial de pedidos por correo
router.get('/pedidos', wrap(async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Indica el correo' });
  const [rows] = await pool.query(
    `SELECT p.id, p.fecha, p.estado, p.total, pr.nombre AS producto, d.cantidad, d.precio_unitario
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       JOIN detalle_pedido d ON d.pedido_id = p.id
       JOIN productos pr ON pr.id = d.producto_id
      WHERE c.email = ? ORDER BY p.fecha DESC, p.id DESC`, [email]);
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.id)) map.set(r.id, { id: r.id, fecha: r.fecha, estado: r.estado, total: r.total, items: [] });
    map.get(r.id).items.push({ producto: r.producto, cantidad: r.cantidad, precio_unitario: r.precio_unitario });
  }
  res.json([...map.values()]);
}));

// Publicar reseña (solo clientes registrados)
router.post('/resenas', wrap(async (req, res) => {
  const { producto_id, email, calificacion, comentario } = req.body;
  const [[prodExiste]] = await pool.query('SELECT id FROM productos WHERE id = ?', [Number(producto_id) || 0]);
  if (!prodExiste) return res.status(404).json({ error: 'Producto no encontrado' });
  const [[cl]] = await pool.query('SELECT id FROM clientes WHERE email = ?', [String(email || '').trim()]);
  if (!cl) return res.status(404).json({ error: 'Ese correo no tiene compras registradas' });
  const nota = Number(calificacion);
  if (!(nota >= 1 && nota <= 5)) return res.status(400).json({ error: 'La calificación va de 1 a 5' });
  await pool.query('INSERT INTO resenas (producto_id, cliente_id, calificacion, comentario) VALUES (?,?,?,?)',
    [prodExiste.id, cl.id, Math.round(nota), String(comentario || '').slice(0, 500)]);
  res.status(201).json({ ok: true });
}));

export default router;
