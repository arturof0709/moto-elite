import { pool } from './db.js';

// Carga un catálogo demostrativo sin borrar información existente.
// Es idempotente: categorías, marcas y productos ya registrados no se duplican.
const categorias = [
  ['Cascos', 'Integrales y modulares homologados'],
  ['Escapes', 'Sistemas de escape y rendimiento'],
  ['Frenos', 'Pastillas, discos y bombas'],
  ['Suspensión', 'Amortiguadores y barras de horquilla'],
  ['Protección', 'Chaquetas, guantes y botas'],
  ['Filtros y motor', 'Filtros de aire, aceite y bujías']
];

const marcas = [
  ['Akrapovič', 'Eslovenia'], ['Brembo', 'Italia'], ['Öhlins', 'Suecia'],
  ['AGV', 'Italia'], ['Alpinestars', 'Italia'], ['K&N', 'Estados Unidos'],
  ['Dainese', 'Italia']
];

const productos = [
  ['Casco AGV Pista GP RR', 'Casco integral de carbono para pista, aprobado ECE/DOT.', 1299.00, 8, 600, 'Cascos', 'AGV'],
  ['Casco AGV K6 S', 'Integral ligero para calle y touring, con ventilación multizona.', 449.00, 15, 600, 'Cascos', 'AGV'],
  ['Escape Akrapovič Racing Line', 'Sistema completo en titanio para motos deportivas.', 1850.00, 4, 1000, 'Escapes', 'Akrapovič'],
  ['Silenciador Akrapovič Slip-On', 'Silenciador de carbono con sonido deportivo.', 720.00, 9, 750, 'Escapes', 'Akrapovič'],
  ['Pastillas Brembo Sinterizadas', 'Juego delantero de alto coeficiente de fricción.', 89.90, 40, 600, 'Frenos', 'Brembo'],
  ['Bomba de freno Brembo RCS 19', 'Bomba radial con palanca ajustable.', 389.00, 6, 750, 'Frenos', 'Brembo'],
  ['Amortiguador Öhlins TTX36', 'Amortiguador trasero regulable para alto rendimiento.', 1790.00, 3, 1000, 'Suspensión', 'Öhlins'],
  ['Kit de horquilla Öhlins NIX', 'Cartuchos para horquilla invertida.', 1450.00, 5, 750, 'Suspensión', 'Öhlins'],
  ['Chaqueta Alpinestars GP Plus', 'Chaqueta de cuero con protecciones CE.', 549.00, 12, 600, 'Protección', 'Alpinestars'],
  ['Guantes Dainese Full Metal 7', 'Guantes deportivos con refuerzos de carbono.', 249.00, 20, 600, 'Protección', 'Dainese'],
  ['Botas Alpinestars Supertech R', 'Botas deportivas con refuerzo de tobillo.', 619.00, 7, 750, 'Protección', 'Alpinestars'],
  ['Filtro de aire K&N Lavable', 'Filtro reutilizable de alto flujo de aire.', 74.50, 30, 600, 'Filtros y motor', 'K&N']
];

export async function sembrarCatalogo() {
  // INSERT IGNORE aprovecha las restricciones UNIQUE de nombre en estas tablas.
  for (const [nombre, descripcion] of categorias) {
    await pool.query('INSERT IGNORE INTO categorias (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
  }
  for (const [nombre, pais] of marcas) {
    await pool.query('INSERT IGNORE INTO marcas (nombre, pais) VALUES (?, ?)', [nombre, pais]);
  }

  const [cats] = await pool.query('SELECT id, nombre FROM categorias');
  const [brands] = await pool.query('SELECT id, nombre FROM marcas');
  const catId = new Map(cats.map((x) => [x.nombre, x.id]));
  const brandId = new Map(brands.map((x) => [x.nombre, x.id]));

  let agregados = 0;
  for (const [nombre, descripcion, precio, stock, cc, categoria, marca] of productos) {
    const [[existente]] = await pool.query('SELECT id FROM productos WHERE nombre = ? LIMIT 1', [nombre]);
    if (existente) continue;
    const categoriaId = catId.get(categoria);
    const marcaId = brandId.get(marca);
    if (!categoriaId || !marcaId) throw new Error(`No se encontró la categoría o marca para ${nombre}`);
    await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock, cc_minimo, categoria_id, marca_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, descripcion, precio, stock, cc, categoriaId, marcaId]
    );
    agregados++;
  }
  console.log(`[catálogo] Catálogo verificado: ${productos.length} productos de ejemplo; ${agregados} agregados en este arranque.`);
}
