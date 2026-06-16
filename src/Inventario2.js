import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CATEGORIAS = ['Lubricantes', 'Juguetes', 'Limpiadores', 'Otros'];
const STOCK_MINIMO = 5;

const s = {
  wrap: { display: 'block' },
  // Tarjetas resumen
  resumenGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 },
  resumenCard: { background: 'var(--bg2)', borderRadius: 14, padding: 16, border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 14 },
  resumenIcono: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  resumenVal: { color: 'var(--text)', fontSize: 22, fontWeight: 700, lineHeight: 1.2 },
  resumenLabel: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  // Alerta
  alertaCard: { background: 'rgba(216,90,48,0.1)', borderRadius: 14, padding: '12px 16px', border: '1px solid #d85a30', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  alertaTexto: { color: '#d85a30', fontSize: 13, fontWeight: 600 },
  alertaSub: { color: '#d85a30', fontSize: 12, opacity: 0.8, marginTop: 2 },
  // Toolbar
  toolbar: { display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 180 },
  searchInput: { background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 13, outline: 'none', flex: 1 },
  filtroBtn: { background: 'transparent', border: '1px solid var(--border2)', borderRadius: 20, color: 'var(--text-sub)', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  filtroActivo: { background: 'var(--gold)', borderColor: 'var(--gold)', color: '#141414', fontWeight: 600 },
  toggleVista: { display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 3 },
  toggleBtn: { background: 'transparent', border: 'none', borderRadius: 6, color: 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 },
  toggleBtnActivo: { background: 'var(--bg3)', color: 'var(--gold)' },
  // Cards
  card: { background: 'var(--bg2)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-out)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardNombre: { color: 'var(--gold)', fontSize: 13, fontWeight: 600 },
  cardCategoria: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  cardPrecio: { color: 'var(--gold)', fontSize: 14, fontWeight: 600 },
  // Lista
  listaCard: { background: 'var(--bg2)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 },
  // Barra de stock
  barraWrap: { background: 'var(--bg3)', borderRadius: 20, height: 6, marginTop: 8, overflow: 'hidden' },
  barraFill: { height: '100%', borderRadius: 20, transition: 'width 0.4s' },
  // Botones stock
  stockControls: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
  btnStk: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--text)', width: 32, height: 32, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stockNum: { color: 'var(--text)', fontSize: 15, fontWeight: 600, minWidth: 32, textAlign: 'center' },
  // Acciones
  accionRow: { display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' },
  btnEditar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  btnEliminar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  btnConfirmar: { background: '#d85a3022', border: '1px solid #d85a30', borderRadius: 8, color: '#d85a30', padding: '6px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 },
  // Form
  btnNuevo: { background: 'var(--gold)', border: 'none', borderRadius: 10, color: '#141414', padding: '10px 20px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 },
  form: { background: 'var(--bg2)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-out)', marginBottom: 12 },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14, boxSizing: 'border-box' },
  select: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14 },
  btnGuardar: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '10px', fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
  btnCancelar: { background: 'transparent', border: 'none', color: 'var(--text-sub)', padding: '10px', fontSize: 13, cursor: 'pointer' },
  uploadBox: { display: 'block', border: '1px dashed var(--border2)', borderRadius: 10, padding: '16px', textAlign: 'center', cursor: 'pointer', marginBottom: 14, color: 'var(--text-sub)', fontSize: 12 },
  imgPreview: { width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 10 },
  imgInventario: { width: 52, height: 52, objectFit: 'cover', borderRadius: 10, background: 'var(--bg3)', flexShrink: 0 },
  turnoLabel: { color: 'var(--gold)', fontSize: 16, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  // Tienda
  alertaExito: { background: '#1d9e7522', borderRadius: 14, padding: 16, border: '1px solid #1d9e75', color: '#1d9e75', fontSize: 13, marginBottom: 10 },
  imgTienda: { width: '100%', height: 180, objectFit: 'contain', borderRadius: 10, marginBottom: 12, background: 'var(--bg3)' },
  btnPedir: { background: 'var(--gold)', border: 'none', borderRadius: 12, color: '#141414', padding: '12px 28px', fontSize: 15, fontWeight: 700, letterSpacing: 1, cursor: 'pointer', boxShadow: '0 2px 8px rgba(201,146,74,0.4)' },
  cuotaBox: { background: 'var(--bg)', borderRadius: 10, padding: 12, boxShadow: 'var(--shadow-in)', marginTop: 8 },
  cuotaTexto: { color: 'var(--text-sub)', fontSize: 12, marginBottom: 10 },
  cuotaBtns: { display: 'flex', gap: 8 },
  cuotaBtn: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '8px', fontSize: 12, cursor: 'pointer' },
};

export default function Inventario2({ rol, nombreModelo }) {
  const [productos, setProductos] = useState([]);
  const [modo, setModo] = useState(null);
  const [form, setForm] = useState({ nombre: '', categoria: '', precio: '', stock: '' });
  const [pedidoEnviado, setPedidoEnviado] = useState(null);
  const [seleccionando, setSeleccionando] = useState(null);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [confirmando, setConfirmando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtrocat, setFiltrocat] = useState('Todos');
  const [vistaGrid, setVistaGrid] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventario'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setProductos(data);
    });
    return unsub;
  }, []);

  const guardar = async () => {
    if (!form.nombre || !form.categoria || !form.precio || !form.stock) return;
    setSubiendo(true);
    const id = form.nombre.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
    let urlImagen = '';
    if (imagenArchivo) {
      try {
        const storageRef = ref(storage, `productos/${id}`);
        await uploadBytes(storageRef, imagenArchivo);
        urlImagen = await getDownloadURL(storageRef);
      } catch (err) { console.error('Error subiendo imagen:', err); }
    }
    await setDoc(doc(db, 'inventario', id), {
      nombre: form.nombre, categoria: form.categoria,
      precio: Number(form.precio), stock: Number(form.stock),
      stockMinimo: STOCK_MINIMO, imagen: urlImagen
    });
    setModo(null);
    setForm({ nombre: '', categoria: '', precio: '', stock: '' });
    setImagenArchivo(null); setImagenPreview(null); setSubiendo(false);
  };

  const ajustarStock = async (producto, cantidad) => {
    const nuevoStock = Math.max(0, producto.stock + cantidad);
    await setDoc(doc(db, 'inventario', producto.id), { ...producto, stock: nuevoStock });
  };

  const hacerPedido = async (producto, cuotas) => {
    await addDoc(collection(db, 'pedidos'), {
      producto: producto.nombre, precio: producto.precio, cuotas,
      modelo: nombreModelo, estado: 'pendiente',
      fecha: new Date().toISOString(),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    });
    await setDoc(doc(db, 'inventario', producto.id), { ...producto, stock: producto.stock - 1 });
    setPedidoEnviado(producto.nombre);
    setSeleccionando(null);
    setTimeout(() => setPedidoEnviado(null), 3000);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    const p = productos.find(x => x.id === editando);
    await setDoc(doc(db, 'inventario', editando), {
      ...p, nombre: formEdit.nombre, categoria: formEdit.categoria,
      precio: Number(formEdit.precio), stock: Number(formEdit.stock)
    });
    setEditando(null); setFormEdit({});
  };

  const eliminar = async (id) => {
    await deleteDoc(doc(db, 'inventario', id));
    setConfirmando(null);
  };

  const alertas = productos.filter(p => p.stock <= STOCK_MINIMO);

  if (rol !== 'jefe' && rol !== 'tienda') {
    return <div style={s.vacio}>No tienes acceso a esta sección</div>;
  }

  // ── VISTA TIENDA (modelo) ──────────────────────────────────────────────────
  if (rol === 'tienda') {
    return (
      <div style={s.wrap}>
        {pedidoEnviado && <div style={s.alertaExito}>Pedido enviado — {pedidoEnviado}</div>}

        {/* Buscador tienda */}
        <div style={{ ...s.searchBox, marginBottom: 12 }}>
          <i className="ti ti-search" style={{ color: 'var(--text-dim)', fontSize: 16 }} />
          <input style={s.searchInput} placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>

        {/* Filtros categoría */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['Todos', ...CATEGORIAS].map(c => (
            <button key={c} style={{ ...s.filtroBtn, ...(filtrocat === c ? s.filtroActivo : {}) }} onClick={() => setFiltrocat(c)}>{c}</button>
          ))}
        </div>

        {productos.filter(p => p.stock > 0).length === 0 && <p style={s.vacio}>No hay productos disponibles</p>}

        {CATEGORIAS.filter(c => filtrocat === 'Todos' || filtrocat === c).map(cat => {
          const prods = productos.filter(p => p.categoria === cat && p.stock > 0 && p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
          if (prods.length === 0) return null;
          return (
            <div key={cat}>
              <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, marginTop: 20, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>{cat}</div>
              <div className="nm-grid-cards">
                {prods.map(p => (
                  <div key={p.id} style={s.card}>
                    {p.imagen && <img src={p.imagen} alt={p.nombre} style={s.imgTienda} />}
                    <div style={s.cardHeader}>
                      <div style={s.cardNombre}>{p.nombre}</div>
                      <div style={s.cardPrecio}>${p.precio.toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>Disponibles: {p.stock}</div>
                      <button style={s.btnPedir} onClick={() => setSeleccionando(seleccionando === p.id ? null : p.id)}>Pedir</button>
                    </div>
                    {seleccionando === p.id && (
                      <div style={s.cuotaBox}>
                        {p.precio > 100000 ? (
                          <>
                            <div style={s.cuotaTexto}>Este producto vale ${p.precio.toLocaleString()} — elige como pagarlo:</div>
                            <div style={s.cuotaBtns}>
                              <button style={s.cuotaBtn} onClick={() => hacerPedido(p, 1)}>Pago completo</button>
                              <button style={s.cuotaBtn} onClick={() => hacerPedido(p, 2)}>2 cuotas de ${Math.ceil(p.precio / 2).toLocaleString()}</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={s.cuotaTexto}>Confirmar pedido de {p.nombre} por ${p.precio.toLocaleString()}</div>
                            <div style={s.cuotaBtns}>
                              <button style={s.cuotaBtn} onClick={() => hacerPedido(p, 1)}>Confirmar</button>
                              <button style={{ ...s.cuotaBtn, color: 'var(--text-sub)' }} onClick={() => setSeleccionando(null)}>Cancelar</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── VISTA JEFE ─────────────────────────────────────────────────────────────
  const totalProductos = productos.length;
  const stockBajoCount = alertas.length;
  const totalUnidades = productos.reduce((a, p) => a + (p.stock || 0), 0);
  const valorTotal = productos.reduce((a, p) => a + ((p.stock || 0) * (p.precio || 0)), 0);

  const prodsFiltrados = productos.filter(p =>
    (filtrocat === 'Todos' || p.categoria === filtrocat) &&
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getBarraColor = (stock, minimo) => {
    const pct = Math.min(100, (stock / Math.max(minimo * 4, 20)) * 100);
    if (pct <= 25) return '#d85a30';
    if (pct <= 60) return '#C9924A';
    return '#1d9e75';
  };

  return (
    <div style={s.wrap}>

      {/* Tarjetas resumen */}
      <div style={s.resumenGrid} className="nm-hide-mobile">
        <div style={s.resumenCard}>
          <div style={{ ...s.resumenIcono, background: 'rgba(201,146,74,0.15)' }}>📦</div>
          <div>
            <div style={s.resumenVal}>{totalProductos}</div>
            <div style={s.resumenLabel}>Productos activos</div>
          </div>
        </div>
        <div style={s.resumenCard}>
          <div style={{ ...s.resumenIcono, background: 'rgba(216,90,48,0.15)' }}>⚠️</div>
          <div>
            <div style={{ ...s.resumenVal, color: stockBajoCount > 0 ? '#d85a30' : 'var(--text)' }}>{stockBajoCount}</div>
            <div style={s.resumenLabel}>Stock bajo</div>
            {stockBajoCount > 0 && <div style={{ color: '#d85a30', fontSize: 10 }}>Requieren compra</div>}
          </div>
        </div>
        <div style={s.resumenCard}>
          <div style={{ ...s.resumenIcono, background: 'rgba(29,158,117,0.15)' }}>📊</div>
          <div>
            <div style={s.resumenVal}>{totalUnidades}</div>
            <div style={s.resumenLabel}>Unidades totales</div>
          </div>
        </div>
        <div style={s.resumenCard}>
          <div style={{ ...s.resumenIcono, background: 'rgba(201,146,74,0.15)' }}>💰</div>
          <div>
            <div style={{ ...s.resumenVal, fontSize: 16 }}>${valorTotal.toLocaleString()}</div>
            <div style={s.resumenLabel}>Valor inventario</div>
          </div>
        </div>
      </div>

      {/* Alerta stock bajo */}
      {alertas.length > 0 && (
        <div style={s.alertaCard}>
          <div>
            <div style={s.alertaTexto}>⚠️ {alertas.length} producto{alertas.length > 1 ? 's' : ''} requiere{alertas.length === 1 ? '' : 'n'} compra</div>
            <div style={s.alertaSub}>{alertas.map(p => `${p.nombre} · ${p.stock} unidades`).join('  —  ')}</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={s.toolbar}>
        {modo === null && (
          <button style={s.btnNuevo} onClick={() => setModo('nuevo')}>+ Agregar producto</button>
        )}
        <div style={s.searchBox}>
          <i className="ti ti-search" style={{ color: 'var(--text-dim)', fontSize: 16 }} />
          <input style={s.searchInput} placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div style={s.toggleVista}>
          <button style={{ ...s.toggleBtn, ...(vistaGrid ? s.toggleBtnActivo : {}) }} onClick={() => setVistaGrid(true)}>⊞</button>
          <button style={{ ...s.toggleBtn, ...(!vistaGrid ? s.toggleBtnActivo : {}) }} onClick={() => setVistaGrid(false)}>☰</button>
        </div>
      </div>

      {/* Filtros categoría */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['Todos', ...CATEGORIAS].map(c => (
          <button key={c} style={{ ...s.filtroBtn, ...(filtrocat === c ? s.filtroActivo : {}) }} onClick={() => setFiltrocat(c)}>{c}</button>
        ))}
      </div>

      {/* Formulario nuevo producto */}
      {modo === 'nuevo' && (
        <div style={s.form}>
          <label style={s.label}>Nombre del producto</label>
          <input style={s.input} placeholder="Ej: Lubricante X" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          <label style={s.label}>Categoria</label>
          <select style={s.select} value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
            <option value="">Seleccionar</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={s.label}>Precio (pesos)</label>
          <input style={s.input} type="number" placeholder="Ej: 25000" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} />
          <label style={s.label}>Stock inicial</label>
          <input style={s.input} type="number" placeholder="Ej: 10" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
          <label style={s.label}>Imagen del producto</label>
          {imagenPreview && <img src={imagenPreview} alt="preview" style={s.imgPreview} />}
          <label style={s.uploadBox}>
            {imagenArchivo ? '✓ Imagen seleccionada — cambiar' : '📷 Seleccionar imagen'}
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setImagenArchivo(f); setImagenPreview(URL.createObjectURL(f)); }}} style={{ display: 'none' }} />
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.btnGuardar} onClick={guardar} disabled={subiendo}>{subiendo ? 'Guardando...' : 'Guardar'}</button>
            <button style={s.btnCancelar} onClick={() => { setModo(null); setImagenArchivo(null); setImagenPreview(null); }}>Cancelar</button>
          </div>
        </div>
      )}

      {prodsFiltrados.length === 0 && modo === null && <p style={s.vacio}>No hay productos</p>}

      {/* Lista de productos por categoría */}
      {CATEGORIAS.filter(c => filtrocat === 'Todos' || filtrocat === c).map(cat => {
        const prodsCat = prodsFiltrados.filter(p => p.categoria === cat);
        if (prodsCat.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div style={s.turnoLabel}>{cat}</div>
            {vistaGrid ? (
              <div className="nm-grid-cards">
                {prodsCat.map(p => renderCardGrid(p))}
              </div>
            ) : (
              <div>
                {prodsCat.map(p => renderCardLista(p))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  function renderCardGrid(p) {
    const pct = Math.min(100, (p.stock / Math.max((p.stockMinimo || STOCK_MINIMO) * 4, 20)) * 100);
    const color = getBarraColor(p.stock, p.stockMinimo || STOCK_MINIMO);
    return (
      <div key={p.id} style={s.card}>
        {editando === p.id ? renderFormEdit(p) : (
          <>
            <div style={s.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {p.imagen && <img src={p.imagen} alt={p.nombre} style={s.imgInventario} />}
                <div>
                  <div style={s.cardNombre}>{p.nombre}</div>
                  <div style={s.cardCategoria}>{p.categoria}</div>
                </div>
              </div>
              <div style={s.cardPrecio}>${p.precio.toLocaleString()}</div>
            </div>
            <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>Stock actual</div>
            <div style={{ color: color, fontSize: 13, fontWeight: 600 }}>{p.stock} unidades {p.stock <= (p.stockMinimo || STOCK_MINIMO) ? '⚠️' : '✓'}</div>
            <div style={s.barraWrap}>
              <div style={{ ...s.barraFill, width: `${pct}%`, background: color }} />
            </div>
            <div style={s.stockControls}>
              <button style={s.btnStk} onClick={() => ajustarStock(p, -1)}>−</button>
              <span style={s.stockNum}>{p.stock}</span>
              <button style={{ ...s.btnStk, color: '#1d9e75' }} onClick={() => ajustarStock(p, 1)}>+</button>
              <button style={{ ...s.btnStk, fontSize: 12, width: 'auto', padding: '0 10px' }} onClick={() => ajustarStock(p, 5)}>+5</button>
              <button style={{ ...s.btnStk, fontSize: 12, width: 'auto', padding: '0 10px' }} onClick={() => ajustarStock(p, 10)}>+10</button>
            </div>
            <div style={s.accionRow}>
              <button style={s.btnEditar} onClick={() => { setEditando(p.id); setFormEdit({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, stock: p.stock }); }}>Editar</button>
              {confirmando === p.id ? (
                <>
                  <button style={s.btnConfirmar} onClick={() => eliminar(p.id)}>¿Confirmar?</button>
                  <button style={s.btnCancelar} onClick={() => setConfirmando(null)}>No</button>
                </>
              ) : (
                <button style={s.btnEliminar} onClick={() => setConfirmando(p.id)}>Eliminar</button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderCardLista(p) {
    const pct = Math.min(100, (p.stock / Math.max((p.stockMinimo || STOCK_MINIMO) * 4, 20)) * 100);
    const color = getBarraColor(p.stock, p.stockMinimo || STOCK_MINIMO);
    return (
      <div key={p.id} style={s.listaCard}>
        {p.imagen && <img src={p.imagen} alt={p.nombre} style={{ ...s.imgInventario, width: 42, height: 42 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={s.cardNombre}>{p.nombre}</div>
            <div style={s.cardPrecio}>${p.precio.toLocaleString()}</div>
          </div>
          <div style={s.barraWrap}>
            <div style={{ ...s.barraFill, width: `${pct}%`, background: color }} />
          </div>
          <div style={{ color, fontSize: 11, marginTop: 3 }}>{p.stock} unidades</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button style={s.btnStk} onClick={() => ajustarStock(p, -1)}>−</button>
          <span style={{ ...s.stockNum, fontSize: 13 }}>{p.stock}</span>
          <button style={{ ...s.btnStk, color: '#1d9e75' }} onClick={() => ajustarStock(p, 1)}>+</button>
          <button style={{ ...s.btnEditar, padding: '4px 10px' }} onClick={() => { setEditando(p.id); setFormEdit({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, stock: p.stock }); }}>Editar</button>
          <button style={{ ...s.btnEliminar, padding: '4px 10px' }} onClick={() => setConfirmando(p.id)}>✕</button>
        </div>
        {confirmando === p.id && (
          <div style={{ position: 'absolute', background: 'var(--bg2)', borderRadius: 10, padding: 10, border: '1px solid var(--border2)', display: 'flex', gap: 8 }}>
            <button style={s.btnConfirmar} onClick={() => eliminar(p.id)}>¿Confirmar?</button>
            <button style={s.btnCancelar} onClick={() => setConfirmando(null)}>No</button>
          </div>
        )}
      </div>
    );
  }

  function renderFormEdit(p) {
    return (
      <>
        <label style={s.label}>Nombre</label>
        <input style={s.input} value={formEdit.nombre || ''} onChange={e => setFormEdit(f => ({ ...f, nombre: e.target.value }))} />
        <label style={s.label}>Categoría</label>
        <select style={s.select} value={formEdit.categoria || ''} onChange={e => setFormEdit(f => ({ ...f, categoria: e.target.value }))}>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={s.label}>Precio</label>
        <input style={s.input} type="number" value={formEdit.precio || ''} onChange={e => setFormEdit(f => ({ ...f, precio: e.target.value }))} />
        <label style={s.label}>Stock</label>
        <input style={s.input} type="number" value={formEdit.stock || ''} onChange={e => setFormEdit(f => ({ ...f, stock: e.target.value }))} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.btnGuardar} onClick={guardarEdicion}>Guardar</button>
          <button style={s.btnCancelar} onClick={() => { setEditando(null); setFormEdit({}); }}>Cancelar</button>
        </div>
      </>
    );
  }
}