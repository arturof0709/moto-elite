import { useEffect, useState } from 'react';

const ESTADOS = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

// Un formulario por tabla de MySQL. "opciones" = de qué tabla se llena el <select>.
const FORMULARIOS = [
  {
    tabla: 'productos', titulo: 'Productos', campos: [
      { n: 'nombre', l: 'Nombre', req: true, max: 120 },
      { n: 'descripcion', l: 'Descripción', area: true },
      { n: 'precio', l: 'Precio (USD)', tipo: 'number', step: '0.01', min: 0, req: true, half: true },
      { n: 'stock', l: 'Stock', tipo: 'number', min: 0, def: 0, req: true, half: true },
      { n: 'cc_minimo', l: 'Cilindraje mínimo (cc)', tipo: 'number', min: 1, def: 600, req: true },
      { n: 'categoria_id', l: 'Categoría', opciones: 'categorias', req: true, half: true },
      { n: 'marca_id', l: 'Marca', opciones: 'marcas', req: true, half: true }
    ]
  },
  {
    tabla: 'clientes', titulo: 'Clientes', campos: [
      { n: 'nombre', l: 'Nombre completo', req: true, max: 100 },
      { n: 'email', l: 'Correo', tipo: 'email', req: true, max: 120 },
      { n: 'telefono', l: 'Teléfono', max: 30, half: true },
      { n: 'direccion', l: 'Dirección', max: 200, half: true }
    ]
  },
  {
    tabla: 'pedidos', titulo: 'Pedidos', campos: [
      { n: 'cliente_id', l: 'Cliente', opciones: 'clientes', req: true },
      { n: 'estado', l: 'Estado', lista: ESTADOS, def: 'pendiente', half: true },
      { n: 'total', l: 'Total (USD)', tipo: 'number', step: '0.01', min: 0, def: 0, half: true }
    ]
  },
  {
    tabla: 'detalle_pedido', titulo: 'Detalle de pedido', campos: [
      { n: 'pedido_id', l: 'Pedido', opciones: 'pedidos', req: true },
      { n: 'producto_id', l: 'Producto', opciones: 'productos', req: true },
      { n: 'cantidad', l: 'Cantidad', tipo: 'number', min: 1, req: true, half: true },
      { n: 'precio_unitario', l: 'Precio unitario', tipo: 'number', step: '0.01', min: 0, half: true,
        ayuda: 'Si lo dejas vacío se usa el precio del producto.' }
    ]
  }
];

function Formulario({ def, api, version, onGuardado }) {
  const vacio = () => Object.fromEntries(def.campos.map((c) => [c.n, c.def ?? '']));
  const [valores, setValores] = useState(vacio);
  const [opciones, setOpciones] = useState({});
  const [estado, setEstado] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [enviando, setEnviando] = useState(false);
  const [errorLista, setErrorLista] = useState('');

  // Vuelve a pedir las listas (categorías, marcas, clientes…) cuando se guarda algo en cualquier formulario
  useEffect(() => {
    def.campos.filter((c) => c.opciones).forEach((c) => {
      api(`/registro/${c.opciones}/opciones`)
        .then((o) => { setOpciones((prev) => ({ ...prev, [c.n]: o })); setErrorLista(''); })
        .catch((e) => setErrorLista(`No se pudo cargar la lista de ${c.l.toLowerCase()}: ${e.message}`));
    });
  }, [version]);

  const cambiar = (n, v) => setValores((prev) => ({ ...prev, [n]: v }));

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setEstado(null);
    try {
      const r = await api(`/registro/${def.tabla}`, { method: 'POST', body: JSON.stringify(valores) });
      setEstado({ tipo: 'ok', texto: `Guardado en MySQL (id ${r.id})` });
      setValores(vacio());
      onGuardado(def.tabla);
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="reg-card" onSubmit={enviar}>
      <header>
        <h3>{def.titulo}</h3>
        <code>{def.tabla}</code>
      </header>
      <div className="fields">
        {def.campos.map((c) => (
          <label key={c.n} className={c.half ? '' : 'full'}>
            {c.l}{c.req && ' *'}
            {c.opciones || c.lista ? (
              <select required={c.req} value={valores[c.n]} onChange={(e) => cambiar(c.n, e.target.value)}>
                {c.opciones && <option value="">Selecciona…</option>}
                {c.opciones
                  ? (opciones[c.n] || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)
                  : c.lista.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : c.area ? (
              <textarea value={valores[c.n]} onChange={(e) => cambiar(c.n, e.target.value)} />
            ) : (
              <input type={c.tipo || 'text'} required={c.req} maxLength={c.max} min={c.min} step={c.step}
                value={valores[c.n]} onChange={(e) => cambiar(c.n, e.target.value)} />
            )}
            {c.opciones && opciones[c.n] && !opciones[c.n].length && (
              <small className="hint">No hay {c.l.toLowerCase()}s registrados todavía: primero regístralos en su formulario.</small>
            )}
            {c.ayuda && <small className="hint">{c.ayuda}</small>}
          </label>
        ))}
      </div>
      {errorLista && <p className="error" role="alert">{errorLista}</p>}
      {estado && <p className={estado.tipo === 'ok' ? 'ok' : 'error'} role={estado.tipo === 'ok' ? 'status' : 'alert'}>{estado.texto}</p>}
      <button className="primary" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
    </form>
  );
}

export default function Registro({ api, version, onGuardado }) {
  return (
    <section className="section" id="registro">
      <h2 className="title">Registro de <em>datos</em></h2>
      <p className="lead">Cada formulario guarda un registro nuevo en su tabla de la base de datos <code>tienda_motos</code>.</p>
      <div className="forms-grid">
        {FORMULARIOS.map((f) => <Formulario key={f.tabla} def={f} api={api} version={version} onGuardado={onGuardado} />)}
      </div>
    </section>
  );
}
