import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CATEGORIAS = ['Lubricantes', 'Juguetes', 'Limpiadores', 'Otros'];
const STOCK_MINIMO = 5;
const CATEGORIAS_ESTUDIO = ['Limpieza', 'Lencería', 'Higiene', 'Otros'];

// Id de quincena en formato YYYY-MM-Q1/Q2, usado para rastrear cuotas de pedidos
function quincenaIdActual() {
  const hoy = new Date();
  const anioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  return hoy.getDate() <= 15 ? `${anioMes}-Q1` : `${anioMes}-Q2`;
}

const s = {
  wrap: { display: 'block' },
  // Tarjetas resumen
  resumenGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 },
  resumenCard: { display: 'flex', alignItems: 'center', gap: 14 },
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
  card: {},
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardNombre: { color: 'var(--gold)', fontSize: 13, fontWeight: 600 },
  cardCategoria: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  cardPrecio: { color: 'var(--gold)', fontSize: 14, fontWeight: 600 },
  // Lista
  listaCard: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 },
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
  form: { marginBottom: 12 },
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
  btnPedir: { background: 'var(--gold)', border: 'none', borderRadius: 10, color: '#FFF', padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  cuotaBox: { background: 'var(--bg)', borderRadius: 10, padding: 12, boxShadow: 'var(--shadow-in)', marginTop: 8 },
  cuotaTexto: { color: 'var(--text-sub)', fontSize: 12, marginBottom: 10 },
  cuotaBtns: { display: 'flex', gap: 8 },
  cuotaBtn: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '8px', fontSize: 12, cursor: 'pointer' },
  // Tabs principales + gráfico
  tabsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' },
  tabsPrincipal: { display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' },
  tabPrincipalBtn: { background: 'transparent', border: 'none', padding: '10px 18px', fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-sub)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, transition: 'color 0.15s, border-color 0.15s' },
  tabPrincipalBtnActivo: { color: 'var(--gold)', borderBottom: '2px solid var(--gold)' },
  btnGrafico: { background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '10px 16px', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  badgeBajoStock: { background: 'rgba(216,90,48,0.15)', color: '#d85a30', fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap' },
  // Panel gráfico
  graficoOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  graficoPanel: { width: '100%', maxWidth: 640, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  graficoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  graficoTitulo: { color: 'var(--gold)', fontSize: 15, fontWeight: 700 },
  graficoCerrar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--text-sub)', width: 30, height: 30, cursor: 'pointer', fontSize: 14 },
  graficoBody: { padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 },
  graficoFila: { display: 'flex', flexDirection: 'column', gap: 6 },
  graficoFilaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  graficoNombre: { color: 'var(--text)', fontSize: 12 },
  graficoOrigen: { color: 'var(--text-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  graficoBarraWrap: { position: 'relative', background: 'var(--bg3)', borderRadius: 20, height: 10, overflow: 'hidden' },
  graficoBarra: { height: '100%', borderRadius: 20, transition: 'width 0.4s' },
  graficoMarcaMinimo: { position: 'absolute', top: 0, bottom: 0, width: 2, background: 'var(--text)', opacity: 0.5 },
};

export default function Inventario2({ rol, nombreModelo }) {
  const [productos, setProductos] = useState([]);
  const [modo, setModo] = useState(null);
  const [form, setForm] = useState({ nombre: '', categoria: '', precio: '', stock: '', costo: '' });
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
  const [tabPrincipal, setTabPrincipal] = useState('modelos');
  const [graficoAbierto, setGraficoAbierto] = useState(false);
  const [insumosEstudio, setInsumosEstudio] = useState([]);
  const [modoEstudio, setModoEstudio] = useState(null);
  const [formEstudio, setFormEstudio] = useState({ nombre: '', categoria: '', cantidad: '', cantidadMinima: '', precioUnitario: '', fechaCompra: '' });
  const [editandoEstudio, setEditandoEstudio] = useState(null);
  const [formEditEstudio, setFormEditEstudio] = useState({});
  const [confirmandoEstudio, setConfirmandoEstudio] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventario'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setProductos(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'insumosEstudio'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setInsumosEstudio(data);
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
      stockMinimo: STOCK_MINIMO, imagen: urlImagen,
      costo: Number(form.costo || 0)
    });
    setModo(null);
    setForm({ nombre: '', categoria: '', precio: '', stock: '', costo: '' });
    setImagenArchivo(null); setImagenPreview(null); setSubiendo(false);
  };

  const ajustarStock = async (producto, cantidad) => {
    const nuevoStock = Math.max(0, producto.stock + cantidad);
    await setDoc(doc(db, 'inventario', producto.id), { ...producto, stock: nuevoStock });
  };

  const hacerPedido = async (producto, cuotas) => {
    await addDoc(collection(db, 'pedidos'), {
      producto: producto.nombre, productoId: producto.id, cantidad: 1,
      precio: producto.precio, cuotas,
      cuotasTotales: cuotas, cuotasPagadas: 0, quincenaInicio: quincenaIdActual(),
      modelo: nombreModelo, estado: 'pendiente',
      fecha: new Date().toISOString(),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    });
    // El stock se descuenta cuando el jefe aprueba el pedido (ver Pedidos.js), no al pedirlo
    setPedidoEnviado(producto.nombre);
    setSeleccionando(null);
    setTimeout(() => setPedidoEnviado(null), 3000);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    const p = productos.find(x => x.id === editando);
    await setDoc(doc(db, 'inventario', editando), {
      ...p, nombre: formEdit.nombre, categoria: formEdit.categoria,
      precio: Number(formEdit.precio), stock: Number(formEdit.stock),
      costo: Number(formEdit.costo || 0)
    });
    setEditando(null); setFormEdit({});
  };

  const eliminar = async (id) => {
    await deleteDoc(doc(db, 'inventario', id));
    setConfirmando(null);
  };

  const guardarInsumoEstudio = async () => {
    if (!formEstudio.nombre || !formEstudio.categoria || formEstudio.cantidad === '') return;
    const id = formEstudio.nombre.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
    await setDoc(doc(db, 'insumosEstudio', id), {
      nombre: formEstudio.nombre,
      categoria: formEstudio.categoria,
      cantidad: Number(formEstudio.cantidad),
      cantidadMinima: Number(formEstudio.cantidadMinima || 0),
      precioUnitario: Number(formEstudio.precioUnitario || 0),
      fechaCompra: formEstudio.fechaCompra || ''
    });
    setModoEstudio(null);
    setFormEstudio({ nombre: '', categoria: '', cantidad: '', cantidadMinima: '', precioUnitario: '', fechaCompra: '' });
  };

  const ajustarStockEstudio = async (item, cantidad) => {
    const nuevaCantidad = Math.max(0, item.cantidad + cantidad);
    await setDoc(doc(db, 'insumosEstudio', item.id), { ...item, cantidad: nuevaCantidad });
  };

  const guardarEdicionEstudio = async () => {
    if (!editandoEstudio) return;
    const item = insumosEstudio.find(x => x.id === editandoEstudio);
    await setDoc(doc(db, 'insumosEstudio', editandoEstudio), {
      ...item,
      nombre: formEditEstudio.nombre,
      categoria: formEditEstudio.categoria,
      cantidad: Number(formEditEstudio.cantidad),
      cantidadMinima: Number(formEditEstudio.cantidadMinima || 0),
      precioUnitario: Number(formEditEstudio.precioUnitario || 0),
      fechaCompra: formEditEstudio.fechaCompra || ''
    });
    setEditandoEstudio(null); setFormEditEstudio({});
  };

  const eliminarEstudio = async (id) => {
    await deleteDoc(doc(db, 'insumosEstudio', id));
    setConfirmandoEstudio(null);
  };

  const colorPorStock = (stock, minimo) => {
    if (stock <= minimo) return '#d85a30';
    if (stock <= minimo * 1.5) return '#C9924A';
    return '#1d9e75';
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
              <div style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, marginTop: 24, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>{cat}</div>
              <div className="nm-grid-cards">
                {prods.map(p => (
                  <div key={p.id} style={s.card} className="nm-card-elevated">
                    {p.imagen && <img src={p.imagen} alt={p.nombre} style={s.imgTienda} />}
                    <div style={s.cardHeader}>
                      <div style={s.cardNombre}>{p.nombre}</div>
                      <div style={s.cardPrecio}>${p.precio.toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>Disponibles: {p.stock}</div>
                      <button className="nm-btn-pedir" style={s.btnPedir} onClick={() => setSeleccionando(seleccionando === p.id ? null : p.id)}>Pedir</button>
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

  function renderInsumosModelos() {
    return (
    <div>

      {/* Tarjetas resumen */}
      <div style={s.resumenGrid} className="nm-resumen-inventario">
        <div style={s.resumenCard} className="nm-card-elevated">
          <div style={{ ...s.resumenIcono, background: 'rgba(201,146,74,0.15)' }}>📦</div>
          <div>
            <div style={s.resumenVal}>{totalProductos}</div>
            <div style={s.resumenLabel}>Productos activos</div>
          </div>
        </div>
        <div style={s.resumenCard} className="nm-card-elevated">
          <div style={{ ...s.resumenIcono, background: 'rgba(216,90,48,0.15)' }}>⚠️</div>
          <div>
            <div style={{ ...s.resumenVal, color: stockBajoCount > 0 ? '#d85a30' : 'var(--text)' }}>{stockBajoCount}</div>
            <div style={s.resumenLabel}>Stock bajo</div>
            {stockBajoCount > 0 && <div style={{ color: '#d85a30', fontSize: 10 }}>Requieren compra</div>}
          </div>
        </div>
        <div style={s.resumenCard} className="nm-card-elevated">
          <div style={{ ...s.resumenIcono, background: 'rgba(29,158,117,0.15)' }}>📊</div>
          <div>
            <div style={s.resumenVal}>{totalUnidades}</div>
            <div style={s.resumenLabel}>Unidades totales</div>
          </div>
        </div>
        <div style={s.resumenCard} className="nm-card-elevated">
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
        <div style={s.form} className="nm-card-elevated">
          <label style={s.label}>Nombre del producto</label>
          <input style={s.input} placeholder="Ej: Lubricante X" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          <label style={s.label}>Categoria</label>
          <select style={s.select} value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
            <option value="">Seleccionar</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={s.label}>Precio de venta (COP)</label>
          <input style={s.input} type="number" placeholder="Ej: 25000" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} />
          <label style={s.label}>Costo de compra (COP/unidad)</label>
          <input style={s.input} type="number" placeholder="Ej: 15000" value={form.costo} onChange={e => setForm(p => ({ ...p, costo: e.target.value }))} />
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
  }

  function renderCardGrid(p) {
    const pct = Math.min(100, (p.stock / Math.max((p.stockMinimo || STOCK_MINIMO) * 4, 20)) * 100);
    const color = getBarraColor(p.stock, p.stockMinimo || STOCK_MINIMO);
    return (
      <div key={p.id} style={s.card} className="nm-card-elevated">
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
              <button style={s.btnEditar} onClick={() => { setEditando(p.id); setFormEdit({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, stock: p.stock, costo: p.costo || 0 }); }}>Editar</button>
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
      <div key={p.id} style={s.listaCard} className="nm-card-elevated">
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
          <button style={{ ...s.btnEditar, padding: '4px 10px' }} onClick={() => { setEditando(p.id); setFormEdit({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, stock: p.stock, costo: p.costo || 0 }); }}>Editar</button>
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
        <label style={s.label}>Precio de venta (COP)</label>
        <input style={s.input} type="number" value={formEdit.precio || ''} onChange={e => setFormEdit(f => ({ ...f, precio: e.target.value }))} />
        <label style={s.label}>Costo de compra (COP/unidad)</label>
        <input style={s.input} type="number" value={formEdit.costo || ''} onChange={e => setFormEdit(f => ({ ...f, costo: e.target.value }))} />
        <label style={s.label}>Stock</label>
        <input style={s.input} type="number" value={formEdit.stock || ''} onChange={e => setFormEdit(f => ({ ...f, stock: e.target.value }))} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.btnGuardar} onClick={guardarEdicion}>Guardar</button>
          <button style={s.btnCancelar} onClick={() => { setEditando(null); setFormEdit({}); }}>Cancelar</button>
        </div>
      </>
    );
  }

  function renderInsumosEstudio() {
    const alertasEstudio = insumosEstudio.filter(i => i.cantidad <= (i.cantidadMinima || 0));
    const totalItems = insumosEstudio.length;
    const valorTotalEstudio = insumosEstudio.reduce((a, i) => a + (i.cantidad || 0) * (i.precioUnitario || 0), 0);

    return (
      <div>
        <div style={s.resumenGrid} className="nm-resumen-inventario">
          <div style={s.resumenCard} className="nm-card-elevated">
            <div style={{ ...s.resumenIcono, background: 'rgba(201,146,74,0.15)' }}>🧴</div>
            <div>
              <div style={s.resumenVal}>{totalItems}</div>
              <div style={s.resumenLabel}>Insumos registrados</div>
            </div>
          </div>
          <div style={s.resumenCard} className="nm-card-elevated">
            <div style={{ ...s.resumenIcono, background: 'rgba(216,90,48,0.15)' }}>⚠️</div>
            <div>
              <div style={{ ...s.resumenVal, color: alertasEstudio.length > 0 ? '#d85a30' : 'var(--text)' }}>{alertasEstudio.length}</div>
              <div style={s.resumenLabel}>Stock bajo</div>
            </div>
          </div>
          <div style={s.resumenCard} className="nm-card-elevated">
            <div style={{ ...s.resumenIcono, background: 'rgba(201,146,74,0.15)' }}>💰</div>
            <div>
              <div style={{ ...s.resumenVal, fontSize: 16 }}>${valorTotalEstudio.toLocaleString()}</div>
              <div style={s.resumenLabel}>Valor en insumos</div>
            </div>
          </div>
        </div>

        {alertasEstudio.length > 0 && (
          <div style={s.alertaCard}>
            <div>
              <div style={s.alertaTexto}>⚠️ {alertasEstudio.length} insumo{alertasEstudio.length > 1 ? 's' : ''} bajo{alertasEstudio.length === 1 ? '' : 's'} el mínimo</div>
              <div style={s.alertaSub}>{alertasEstudio.map(i => `${i.nombre} · ${i.cantidad} unidades`).join('  —  ')}</div>
            </div>
          </div>
        )}

        <div style={s.toolbar}>
          {modoEstudio === null && (
            <button style={s.btnNuevo} onClick={() => setModoEstudio('nuevo')}>+ Agregar insumo</button>
          )}
        </div>

        {modoEstudio === 'nuevo' && (
          <div style={s.form} className="nm-card-elevated">
            <label style={s.label}>Nombre del insumo</label>
            <input style={s.input} placeholder="Ej: Sábanas blancas" value={formEstudio.nombre} onChange={e => setFormEstudio(p => ({ ...p, nombre: e.target.value }))} />
            <label style={s.label}>Categoría</label>
            <select style={s.select} value={formEstudio.categoria} onChange={e => setFormEstudio(p => ({ ...p, categoria: e.target.value }))}>
              <option value="">Seleccionar</option>
              {CATEGORIAS_ESTUDIO.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={s.label}>Cantidad actual</label>
            <input style={s.input} type="number" placeholder="Ej: 20" value={formEstudio.cantidad} onChange={e => setFormEstudio(p => ({ ...p, cantidad: e.target.value }))} />
            <label style={s.label}>Cantidad mínima (alerta)</label>
            <input style={s.input} type="number" placeholder="Ej: 5" value={formEstudio.cantidadMinima} onChange={e => setFormEstudio(p => ({ ...p, cantidadMinima: e.target.value }))} />
            <label style={s.label}>Precio unitario (COP)</label>
            <input style={s.input} type="number" placeholder="Ej: 8000" value={formEstudio.precioUnitario} onChange={e => setFormEstudio(p => ({ ...p, precioUnitario: e.target.value }))} />
            <label style={s.label}>Fecha de compra</label>
            <input style={s.input} type="date" value={formEstudio.fechaCompra} onChange={e => setFormEstudio(p => ({ ...p, fechaCompra: e.target.value }))} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={s.btnGuardar} onClick={guardarInsumoEstudio}>Guardar</button>
              <button style={s.btnCancelar} onClick={() => { setModoEstudio(null); setFormEstudio({ nombre: '', categoria: '', cantidad: '', cantidadMinima: '', precioUnitario: '', fechaCompra: '' }); }}>Cancelar</button>
            </div>
          </div>
        )}

        {insumosEstudio.length === 0 && modoEstudio === null && <p style={s.vacio}>No hay insumos registrados</p>}

        {CATEGORIAS_ESTUDIO.map(cat => {
          const itemsCat = insumosEstudio.filter(i => i.categoria === cat);
          if (itemsCat.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={s.turnoLabel}>{cat}</div>
              <div className="nm-grid-cards">
                {itemsCat.map(i => renderCardEstudio(i))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderCardEstudio(i) {
    const minimo = i.cantidadMinima || 0;
    const bajoMinimo = i.cantidad <= minimo;
    return (
      <div key={i.id} className="nm-card-elevated" style={{ border: bajoMinimo ? '1px solid #d85a30' : '1px solid transparent' }}>
        {editandoEstudio === i.id ? renderFormEditEstudio(i) : (
          <>
            <div style={s.cardHeader}>
              <div>
                <div style={s.cardNombre}>{i.nombre}</div>
                <div style={s.cardCategoria}>{i.categoria}</div>
              </div>
              {bajoMinimo && <span style={s.badgeBajoStock}>⚠️ Bajo stock</span>}
            </div>
            <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>Cantidad actual</div>
            <div style={{ color: bajoMinimo ? '#d85a30' : 'var(--text)', fontSize: 13, fontWeight: 600 }}>{i.cantidad} unidades · mínimo {minimo}</div>
            {i.precioUnitario > 0 && <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 4 }}>${Number(i.precioUnitario).toLocaleString()} c/u{i.fechaCompra ? ` · comprado ${i.fechaCompra}` : ''}</div>}
            <div style={s.stockControls}>
              <button style={s.btnStk} onClick={() => ajustarStockEstudio(i, -1)}>−</button>
              <span style={s.stockNum}>{i.cantidad}</span>
              <button style={{ ...s.btnStk, color: '#1d9e75' }} onClick={() => ajustarStockEstudio(i, 1)}>+</button>
              <button style={{ ...s.btnStk, fontSize: 12, width: 'auto', padding: '0 10px' }} onClick={() => ajustarStockEstudio(i, 5)}>+5</button>
              <button style={{ ...s.btnStk, fontSize: 12, width: 'auto', padding: '0 10px' }} onClick={() => ajustarStockEstudio(i, 10)}>+10</button>
            </div>
            <div style={s.accionRow}>
              <button style={s.btnEditar} onClick={() => { setEditandoEstudio(i.id); setFormEditEstudio({ nombre: i.nombre, categoria: i.categoria, cantidad: i.cantidad, cantidadMinima: i.cantidadMinima || 0, precioUnitario: i.precioUnitario || 0, fechaCompra: i.fechaCompra || '' }); }}>Editar</button>
              {confirmandoEstudio === i.id ? (
                <>
                  <button style={s.btnConfirmar} onClick={() => eliminarEstudio(i.id)}>¿Confirmar?</button>
                  <button style={s.btnCancelar} onClick={() => setConfirmandoEstudio(null)}>No</button>
                </>
              ) : (
                <button style={s.btnEliminar} onClick={() => setConfirmandoEstudio(i.id)}>Eliminar</button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderFormEditEstudio() {
    return (
      <>
        <label style={s.label}>Nombre</label>
        <input style={s.input} value={formEditEstudio.nombre || ''} onChange={e => setFormEditEstudio(f => ({ ...f, nombre: e.target.value }))} />
        <label style={s.label}>Categoría</label>
        <select style={s.select} value={formEditEstudio.categoria || ''} onChange={e => setFormEditEstudio(f => ({ ...f, categoria: e.target.value }))}>
          {CATEGORIAS_ESTUDIO.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={s.label}>Cantidad actual</label>
        <input style={s.input} type="number" value={formEditEstudio.cantidad ?? ''} onChange={e => setFormEditEstudio(f => ({ ...f, cantidad: e.target.value }))} />
        <label style={s.label}>Cantidad mínima</label>
        <input style={s.input} type="number" value={formEditEstudio.cantidadMinima ?? ''} onChange={e => setFormEditEstudio(f => ({ ...f, cantidadMinima: e.target.value }))} />
        <label style={s.label}>Precio unitario (COP)</label>
        <input style={s.input} type="number" value={formEditEstudio.precioUnitario ?? ''} onChange={e => setFormEditEstudio(f => ({ ...f, precioUnitario: e.target.value }))} />
        <label style={s.label}>Fecha de compra</label>
        <input style={s.input} type="date" value={formEditEstudio.fechaCompra || ''} onChange={e => setFormEditEstudio(f => ({ ...f, fechaCompra: e.target.value }))} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.btnGuardar} onClick={guardarEdicionEstudio}>Guardar</button>
          <button style={s.btnCancelar} onClick={() => { setEditandoEstudio(null); setFormEditEstudio({}); }}>Cancelar</button>
        </div>
      </>
    );
  }

  const itemsGrafico = [
    ...productos.map(p => ({ key: 'm_' + p.id, nombre: p.nombre, origen: 'Modelos', stock: p.stock || 0, minimo: p.stockMinimo || STOCK_MINIMO })),
    ...insumosEstudio.map(i => ({ key: 'e_' + i.id, nombre: i.nombre, origen: 'Estudio', stock: i.cantidad || 0, minimo: i.cantidadMinima || 0 }))
  ].sort((a, b) => (a.stock - a.minimo) - (b.stock - b.minimo));

  return (
    <div style={s.wrap}>
      <div style={s.tabsRow}>
        <div style={s.tabsPrincipal}>
          <button type="button" style={{ ...s.tabPrincipalBtn, ...(tabPrincipal === 'modelos' ? s.tabPrincipalBtnActivo : {}) }} onClick={() => setTabPrincipal('modelos')}>Insumos Modelos</button>
          <button type="button" style={{ ...s.tabPrincipalBtn, ...(tabPrincipal === 'estudio' ? s.tabPrincipalBtnActivo : {}) }} onClick={() => setTabPrincipal('estudio')}>Insumos Estudio</button>
        </div>
        <button type="button" style={s.btnGrafico} onClick={() => setGraficoAbierto(true)}>📊 Ver gráfico</button>
      </div>

      {tabPrincipal === 'modelos' ? renderInsumosModelos() : renderInsumosEstudio()}

      {graficoAbierto && (
        <div style={s.graficoOverlay} onClick={() => setGraficoAbierto(false)}>
          <div style={s.graficoPanel} className="nm-card-elevated" onClick={e => e.stopPropagation()}>
            <div style={s.graficoHeader}>
              <span style={s.graficoTitulo}>📊 Stock actual vs mínimo</span>
              <button style={s.graficoCerrar} onClick={() => setGraficoAbierto(false)}>✕</button>
            </div>
            <div style={s.graficoBody}>
              {itemsGrafico.length === 0 && <p style={s.vacio}>No hay insumos para graficar</p>}
              {itemsGrafico.map(item => {
                const color = colorPorStock(item.stock, item.minimo);
                const escala = Math.max(item.stock, item.minimo * 1.5, 1);
                const pctStock = Math.min(100, (item.stock / escala) * 100);
                const pctMinimo = Math.min(100, (item.minimo / escala) * 100);
                return (
                  <div key={item.key} style={s.graficoFila}>
                    <div style={s.graficoFilaHeader}>
                      <span style={s.graficoNombre}>{item.nombre} <span style={s.graficoOrigen}>· {item.origen}</span></span>
                      <span style={{ color, fontSize: 11, fontWeight: 600 }}>{item.stock} / mín {item.minimo}</span>
                    </div>
                    <div style={s.graficoBarraWrap}>
                      <div style={{ ...s.graficoBarra, width: `${pctStock}%`, background: color }} />
                      <div style={{ ...s.graficoMarcaMinimo, left: `${pctMinimo}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}