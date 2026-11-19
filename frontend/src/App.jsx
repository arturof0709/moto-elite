import { useEffect, useMemo, useRef, useState } from 'react';
import { HeroBike, Icon, ProductArt, TINTS, kindOf } from './art.jsx';
import Registro from './Registro.jsx';

const API = import.meta.env.VITE_API_URL || '/api';
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const stars = (n) => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0));

async function api(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ? (data.detalle ? `${data.error} (${data.detalle})` : data.error) : 'Error de conexión');
  return data;
}

// Categorías que se muestran aunque el backend esté apagado (se enlazan por nombre con la BD)
const CATEGORIAS_UI = [
  { nombre: 'Cascos', kind: 'casco', texto: 'Integrales y modulares' },
  { nombre: 'Escapes', kind: 'escape', texto: 'Más sonido, más potencia' },
  { nombre: 'Frenos', kind: 'freno', texto: 'Frena sin dudar' },
  { nombre: 'Suspensión', kind: 'suspension', texto: 'Control en cada curva' },
  { nombre: 'Protección', kind: 'chaqueta', texto: 'Chaquetas, guantes y botas' },
  { nombre: 'Filtros y motor', kind: 'filtro', texto: 'Respira mejor' }
];
const MARCAS_UI = ['Akrapovič', 'Brembo', 'Öhlins', 'AGV', 'Alpinestars', 'K&N', 'Dainese'];
const BENEFICIOS = [
  { icon: 'truck', t: 'Envío a todo el país', d: 'Entregas rápidas con seguimiento.' },
  { icon: 'shield', t: 'Garantía de fábrica', d: 'Piezas originales y certificadas.' },
  { icon: 'wrench', t: 'Asesoría experta', d: 'Te ayudamos a elegir según tu moto.' },
  { icon: 'bolt', t: 'Stock en tiempo real', d: 'Lo que ves es lo que hay disponible.' }
];
const OPINIONES = [
  { n: 'Carlos M.', moto: 'Yamaha R6', t: 'El casco llegó en 3 días y la ventilación se nota a 180 km/h. Súper recomendado.' },
  { n: 'Ana R.', moto: 'Ducati Panigale V2', t: 'Las pastillas frenan fuerte desde la primera vuelta. Buen precio y buena atención.' },
  { n: 'Luis P.', moto: 'Kawasaki Z900', t: 'Instalé el slip-on y cambió por completo el sonido. Calidad de carrera.' }
];
const STATS = [['12+', 'Productos'], ['7', 'Marcas top'], ['600cc+', 'Solo alto cilindraje']];

// Aparece suavemente al hacer scroll
function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [ver, setVer] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setVer(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVer(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${ver ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

const Svg = ({ name }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{Icon[name]}</svg>
);

export default function App() {
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ categoria: '', marca: '', q: '', orden: '' });
  const [carrito, setCarrito] = useState([]);
  const [panel, setPanel] = useState(null); // 'carrito' | 'pedidos' | null
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [versionRegistro, setVersionRegistro] = useState(0);

  // Al guardar en cualquier formulario se refrescan listas y catálogo
  const registroGuardado = () => {
    setVersionRegistro((v) => v + 1);
    Promise.all([api('/categorias'), api('/marcas')]).then(([c, m]) => { setCategorias(c); setMarcas(m); }).catch(() => {});
    cargarProductos();
  };

  const cargarProductos = () => {
    const qs = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString();
    api(`/productos?${qs}`).then((d) => { setProductos(d); setError(''); }).catch((e) => setError(e.message)).finally(() => setCargando(false));
  };

  useEffect(() => {
    Promise.all([api('/categorias'), api('/marcas')])
      .then(([c, m]) => { setCategorias(c); setMarcas(m); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const t = setTimeout(cargarProductos, 200);
    return () => clearTimeout(t);
  }, [filtros]);

  const totalCarrito = useMemo(() => carrito.reduce((s, i) => s + i.precio * i.cantidad, 0), [carrito]);
  const unidades = carrito.reduce((s, i) => s + i.cantidad, 0);

  const agregar = (p) => {
    setCarrito((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => (i.id === p.id ? { ...i, cantidad: Math.min(i.cantidad + 1, p.stock) } : i));
      return [...c, { id: p.id, nombre: p.nombre, precio: p.precio, stock: p.stock, cantidad: 1 }];
    });
    setAviso(`${p.nombre} agregado al carrito`);
    setTimeout(() => setAviso(''), 2000);
  };

  const cambiarCantidad = (id, delta) =>
    setCarrito((c) => c.map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, Math.min(i.stock, i.cantidad + delta)) } : i)));

  const abrirDetalle = (id) => api(`/productos/${id}`).then(setDetalle).catch((e) => setError(e.message));

  const irACatalogo = () => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  const elegirCategoria = (nombre) => {
    const c = categorias.find((x) => x.nombre === nombre);
    if (c) setFiltros((f) => ({ ...f, categoria: String(c.id) }));
    irACatalogo();
  };

  return (
    <>
      <header className="top">
        <a className="brand" href="#inicio" aria-label="MotoParts, inicio">
          <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true"><path d="M3 24 L12 6 H20 L29 24 H23 L16 11 L9 24 Z" fill="var(--accent)" /></svg>
          <span>MotoParts<small>Para motos de 600 cc en adelante</small></span>
        </a>
        <nav>
          <a className="navlink" href="#categorias">Categorías</a>
          <a className="navlink" href="#catalogo">Catálogo</a>
          <a className="navlink" href="#marcas">Marcas</a>
          <a className="navlink" href="#registro">Registro</a>
          <button className="link" onClick={() => setPanel('pedidos')}>Mis pedidos</button>
          <button className="cart-btn" onClick={() => setPanel('carrito')}>
            Carrito <span className="badge">{unidades}</span>
          </button>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-text">
          <p className="eyebrow">Nueva temporada · Pista y calle</p>
          <h1>Piezas que aguantan<br /><em>los 11.000 rpm</em></h1>
          <p className="lead">Cascos, escapes, frenos y suspensión de las mejores marcas, con stock real y envío a todo el país.</p>
          <div className="cta">
            <button className="primary big" onClick={irACatalogo}>Ver catálogo</button>
            <a className="ghost" href="#categorias">Explorar categorías</a>
          </div>
          <dl className="stats">
            {STATS.map(([n, t]) => <div key={t}><dt>{n}</dt><dd>{t}</dd></div>)}
          </dl>
        </div>
        <div className="hero-art" aria-hidden="false">
          <div className="glow" />
          <div className="rpm">11K<small>rpm</small></div>
          <HeroBike />
        </div>
      </section>

      <div className="marquee" id="marcas" aria-label="Marcas disponibles">
        <div className="track">
          {[...MARCAS_UI, ...MARCAS_UI, ...MARCAS_UI].map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>

      <section className="section" id="categorias">
        <Reveal><h2 className="title">Compra por <em>categoría</em></h2></Reveal>
        <div className="cats">
          {CATEGORIAS_UI.map((c, i) => (
            <Reveal key={c.nombre} delay={i * 60}>
              <button className="cat" style={{ '--tint': TINTS[c.kind] }} onClick={() => elegirCategoria(c.nombre)}>
                <ProductArt kind={c.kind} />
                <span className="cat-name">{c.nombre}</span>
                <span className="cat-sub">{c.texto}</span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section" id="catalogo">
        <Reveal><h2 className="title">Catálogo <em>completo</em></h2></Reveal>
        <main className="layout">
          <aside className="filters">
            <label>Buscar
              <input value={filtros.q} placeholder="Casco, escape, pastillas…" onChange={(e) => setFiltros({ ...filtros, q: e.target.value })} />
            </label>
            <label>Categoría
              <select value={filtros.categoria} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}>
                <option value="">Todas</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>
            <label>Marca
              <select value={filtros.marca} onChange={(e) => setFiltros({ ...filtros, marca: e.target.value })}>
                <option value="">Todas</option>
                {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
            <label>Ordenar por
              <select value={filtros.orden} onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}>
                <option value="">Más recientes</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
                <option value="nombre">Nombre</option>
              </select>
            </label>
            <button className="link" onClick={() => setFiltros({ categoria: '', marca: '', q: '', orden: '' })}>Limpiar filtros</button>
          </aside>

          <section>
            {error && <p className="error" role="alert">{error}. Revisa que el backend y MySQL estén encendidos.</p>}
            <div className="grid">
              {cargando && !error && Array.from({ length: 6 }, (_, i) => <div className="card skeleton" key={i} />)}
              {productos.map((p) => {
                const kind = kindOf(p.nombre, p.categoria);
                return (
                  <article className="card" key={p.id} style={{ '--tint': TINTS[kind] }}>
                    <button className="thumb" onClick={() => abrirDetalle(p.id)} aria-label={`Ver ${p.nombre}`}>
                      <ProductArt kind={kind} />
                      <span className="cc">{p.cc_minimo}<small>cc mín.</small></span>
                      {p.stock > 0 && p.stock <= 5 && <span className="tag">¡Últimas piezas!</span>}
                      {p.stock === 0 && <span className="tag out">Agotado</span>}
                    </button>
                    <div className="info">
                      <p className="meta">{p.marca} · {p.categoria}</p>
                      <h3>{p.nombre}</h3>
                      <p className="rating" title={`${p.promedio || 0} de 5`}>{stars(p.promedio)} <span>({p.total_resenas})</span></p>
                      <div className="row">
                        <strong>{money(p.precio)}</strong>
                        <span className={p.stock <= 5 ? 'stock low' : 'stock'}>{p.stock > 0 ? `${p.stock} en stock` : 'Agotado'}</span>
                      </div>
                      <button className="primary" disabled={p.stock === 0} onClick={() => agregar(p)}>Agregar al carrito</button>
                    </div>
                  </article>
                );
              })}
            </div>
            {!productos.length && !error && !cargando && <p className="empty">No hay productos con esos filtros. Prueba quitar alguno.</p>}
          </section>
        </main>
      </section>

      <section className="promo">
        <Reveal className="promo-in">
          <div>
            <p className="eyebrow dark">Equípate completo</p>
            <h2>Casco, chaqueta, guantes y botas.<br />Sal a rodar con todo.</h2>
            <button className="dark-btn" onClick={() => elegirCategoria('Protección')}>Ver protección</button>
          </div>
          <div className="promo-art">
            <ProductArt kind="casco" /><ProductArt kind="chaqueta" /><ProductArt kind="guantes" /><ProductArt kind="botas" />
          </div>
        </Reveal>
      </section>

      <section className="section">
        <div className="benefits">
          {BENEFICIOS.map((b, i) => (
            <Reveal key={b.t} delay={i * 70} className="benefit">
              <Svg name={b.icon} />
              <h3>{b.t}</h3>
              <p>{b.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <Reveal><h2 className="title">Lo que dicen los <em>riders</em></h2></Reveal>
        <div className="quotes">
          {OPINIONES.map((o, i) => (
            <Reveal key={o.n} delay={i * 80} as="figure" className="quote">
              <p className="rating">{stars(5)}</p>
              <blockquote>“{o.t}”</blockquote>
              <figcaption><b>{o.n}</b> · {o.moto}</figcaption>
            </Reveal>
          ))}
        </div>
      </section>

      <Registro api={api} version={versionRegistro} onGuardado={registroGuardado} />

      <footer className="footer">
        <div>
          <div className="brand"><svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M3 24 L12 6 H20 L29 24 H23 L16 11 L9 24 Z" fill="var(--accent)" /></svg><span>MotoParts</span></div>
          <p>Accesorios y repuestos para motos de alto cilindraje.</p>
        </div>
        <div>
          <h4>Tienda</h4>
          <a href="#categorias">Categorías</a><a href="#catalogo">Catálogo</a><a href="#marcas">Marcas</a><a href="#registro">Registro</a>
        </div>
        <div>
          <h4>Contacto</h4>
          <p>San Salvador, El Salvador</p><p>Lun a Sáb · 8:00 a 18:00</p>
        </div>
        <p className="copy">© {new Date().getFullYear()} MotoParts · Proyecto escolar</p>
      </footer>

      {aviso && <div className="toast" role="status">{aviso}</div>}

      {panel === 'carrito' && (
        <Carrito carrito={carrito} total={totalCarrito} cambiar={cambiarCantidad}
          quitar={(id) => setCarrito((c) => c.filter((i) => i.id !== id))}
          cerrar={() => setPanel(null)}
          pedidoCreado={() => { setCarrito([]); cargarProductos(); registroGuardado(); }} />
      )}
      {panel === 'pedidos' && <Pedidos cerrar={() => setPanel(null)} />}
      {detalle && <Detalle p={detalle} cerrar={() => setDetalle(null)} agregar={agregar}
        recargar={() => abrirDetalle(detalle.id).then(cargarProductos)} />}
    </>
  );
}


function Modal({ titulo, cerrar, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);
  return (
    <div className="overlay" onClick={cerrar}>
      <div className="modal" role="dialog" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <header><h2>{titulo}</h2><button className="link" onClick={cerrar}>Cerrar</button></header>
        {children}
      </div>
    </div>
  );
}

function Carrito({ carrito, total, cambiar, quitar, cerrar, pedidoCreado }) {
  const [cliente, setCliente] = useState({ nombre: '', email: '', telefono: '', direccion: '' });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const r = await api('/pedidos', {
        method: 'POST',
        body: JSON.stringify({ cliente, items: carrito.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })) })
      });
      setOk(r);
      pedidoCreado();
    } catch (err) { setMsg(err.message); }
  };

  if (ok) return (
    <Modal titulo="Pedido confirmado" cerrar={cerrar}>
      <p>Tu pedido <b>#{ok.id}</b> por <b>{money(ok.total)}</b> quedó registrado. Puedes consultarlo en “Mis pedidos” con tu correo.</p>
      <button className="primary" onClick={cerrar}>Seguir comprando</button>
    </Modal>
  );

  return (
    <Modal titulo="Tu carrito" cerrar={cerrar}>
      {!carrito.length ? <p className="empty">Tu carrito está vacío. Agrega algo del catálogo.</p> : (
        <>
          <ul className="lines">
            {carrito.map((i) => (
              <li key={i.id}>
                <span>{i.nombre}</span>
                <span className="qty">
                  <button onClick={() => cambiar(i.id, -1)} aria-label="Menos">−</button>
                  {i.cantidad}
                  <button onClick={() => cambiar(i.id, 1)} aria-label="Más">+</button>
                </span>
                <b>{money(i.precio * i.cantidad)}</b>
                <button className="link" onClick={() => quitar(i.id)}>Quitar</button>
              </li>
            ))}
          </ul>
          <p className="total">Total: <b>{money(total)}</b></p>
          <form onSubmit={enviar} className="form">
            <input required placeholder="Nombre completo" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
            <input required type="email" placeholder="Correo" value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
            <input placeholder="Teléfono" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
            <input placeholder="Dirección de envío" value={cliente.direccion} onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })} />
            {msg && <p className="error" role="alert">{msg}</p>}
            <button className="primary" type="submit">Confirmar pedido</button>
          </form>
        </>
      )}
    </Modal>
  );
}

function Pedidos({ cerrar }) {
  const [email, setEmail] = useState('');
  const [lista, setLista] = useState(null);
  const [msg, setMsg] = useState('');

  const buscar = async (e) => {
    e.preventDefault();
    setMsg('');
    try { setLista(await api(`/pedidos?email=${encodeURIComponent(email)}`)); }
    catch (err) { setMsg(err.message); }
  };

  return (
    <Modal titulo="Mis pedidos" cerrar={cerrar}>
      <form onSubmit={buscar} className="inline">
        <input required type="email" placeholder="Correo con el que compraste" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="primary" type="submit">Buscar</button>
      </form>
      {msg && <p className="error">{msg}</p>}
      {lista && !lista.length && <p className="empty">No encontramos pedidos con ese correo.</p>}
      {lista?.map((p) => (
        <div className="order" key={p.id}>
          <p><b>Pedido #{p.id}</b> · {new Date(p.fecha).toLocaleDateString('es')} · <span className={`estado ${p.estado}`}>{p.estado}</span></p>
          <ul>{p.items.map((i, k) => <li key={k}>{i.cantidad} × {i.producto} — {money(i.precio_unitario)}</li>)}</ul>
          <p className="total">Total: <b>{money(p.total)}</b></p>
        </div>
      ))}
    </Modal>
  );
}

function Detalle({ p, cerrar, agregar, recargar }) {
  const [form, setForm] = useState({ email: '', calificacion: 5, comentario: '' });
  const [msg, setMsg] = useState('');

  const publicar = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/resenas', { method: 'POST', body: JSON.stringify({ ...form, producto_id: p.id }) });
      setForm({ email: '', calificacion: 5, comentario: '' });
      recargar();
    } catch (err) { setMsg(err.message); }
  };

  return (
    <Modal titulo={p.nombre} cerrar={cerrar}>
      <div className="detail-art" style={{ '--tint': TINTS[kindOf(p.nombre, p.categoria)] }}>
        <ProductArt kind={kindOf(p.nombre, p.categoria)} />
      </div>
      <p className="meta">{p.marca} ({p.pais}) · {p.categoria} · Recomendado desde {p.cc_minimo} cc</p>
      <p>{p.descripcion}</p>
      <div className="row"><strong>{money(p.precio)}</strong>
        <button className="primary" disabled={p.stock === 0} onClick={() => agregar(p)}>Agregar al carrito</button></div>

      <h3>Reseñas ({p.resenas.length})</h3>
      {!p.resenas.length && <p className="empty">Aún no hay reseñas. Sé el primero en opinar.</p>}
      {p.resenas.map((r) => (
        <div className="review" key={r.id}>
          <p className="rating">{stars(r.calificacion)} <b>{r.cliente}</b></p>
          <p>{r.comentario}</p>
        </div>
      ))}

      <form onSubmit={publicar} className="form">
        <input required type="email" placeholder="Tu correo de compra" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <select value={form.calificacion} onChange={(e) => setForm({ ...form, calificacion: e.target.value })}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrellas</option>)}
        </select>
        <textarea placeholder="Cuéntanos cómo te fue con este producto" value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} />
        {msg && <p className="error">{msg}</p>}
        <button className="primary" type="submit">Publicar reseña</button>
      </form>
    </Modal>
  );
}
