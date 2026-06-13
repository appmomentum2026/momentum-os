import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CATEGORIAS = ['Lubricantes', 'Juguetes', 'Limpiadores', 'Otros'];
const STOCK_MINIMO = 5;

const s = {
  wrap: { display: 'block' },
  alertaCard: { background: '#d85a3022', borderRadius: 14, padding: 16, border: '1px solid #d85a30', marginBottom: 8 },
  alertaTitulo: { color: '#d85a30', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  alertaItem: { color: '#d85a30', fontSize: 13, padding: '4px 0' },
  card: { background: 'var(--bg2)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-out)', marginBottom: 8 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardNombre: { color: 'var(--gold)', fontSize: 13, fontWeight: 500 },
  cardCategoria: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' },
  filaLabel: { color: 'var(--text-sub)', fontSize: 12 },
  filaValor: { color: 'var(--text)', fontSize: 12 },
  stockBajo: { color: '#d85a30', fontSize: 12, fontWeight: 500 },
  stockOk: { color: '#1d9e75', fontSize: 12, fontWeight: 500 },
  btnRow: { display: 'flex', gap: 8, marginTop: 10 },
  btnMas: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#1d9e75', padding: '6px 14px', fontSize: 13, cursor: 'pointer' },
  btnMenos: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '6px 14px', fontSize: 13, cursor: 'pointer' },
  btnNuevo: { background: 'var(--bg)', border: 'none', borderRadius: 12, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '12px 20px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 8 },
  btnPedir: { background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#141414', padding: '9px 20px', fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' },
  form: { background: 'var(--bg2)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-out)', marginBottom: 8 },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14 },
  select: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14 },
  btnGuardar: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '10px', fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
  btnCancelar: { background: 'transparent', border: 'none', color: 'var(--text-sub)', padding: '10px', fontSize: 13, cursor: 'pointer' },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  exito: { background: '#1d9e7522', borderRadius: 14, padding: 16, border: '1px solid #1d9e75', color: '#1d9e75', fontSize: 13 },
  cuotaBox: { background: 'var(--bg)', borderRadius: 10, padding: 12, boxShadow: 'var(--shadow-in)', marginTop: 8 },
  cuotaTexto: { color: 'var(--text-sub)', fontSize: 12, marginBottom: 10 },
  cuotaBtns: { display: 'flex', gap: 8 },
  cuotaBtn: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '8px', fontSize: 12, cursor: 'pointer' },
  imgTienda: { width: '100%', height: 200, objectFit: 'contain', borderRadius: 10, marginBottom: 12, background: 'var(--bg3)' },
  imgInventario: { width: 50, height: 50, objectFit: 'cover', borderRadius: 8, background: 'var(--bg3)', flexShrink: 0 },
  uploadBox: { display: 'block', border: '1px dashed var(--border2)', borderRadius: 10, padding: '16px', textAlign: 'center', cursor: 'pointer', marginBottom: 20, marginTop: 4, color: 'var(--text-sub)', fontSize: 12 },
  imgPreview: { width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 10 },
  turnoLabel: { color: 'var(--gold)', fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' },
  accionRow: { display: 'flex', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' },
  btnEditar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  btnEliminar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  btnConfirmar: { background: '#d85a3022', border: '1px solid #d85a30', borderRadius: 8, color: '#d85a30', padding: '6px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 },
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

  const seleccionarImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenArchivo(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

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
      } catch (err) {
        console.error('Error subiendo imagen:', err);
      }
    }

    await setDoc(doc(db, 'inventario', id), {
      nombre: form.nombre,
      categoria: form.categoria,
      precio: Number(form.precio),
      stock: Number(form.stock),
      stockMinimo: STOCK_MINIMO,
      imagen: urlImagen
    });
    setModo(null);
    setForm({ nombre: '', categoria: '', precio: '', stock: '' });
    setImagenArchivo(null);
    setImagenPreview(null);
    setSubiendo(false);
  };

  const ajustarStock = async (producto, cantidad) => {
    const nuevoStock = Math.max(0, producto.stock + cantidad);
    await setDoc(doc(db, 'inventario', producto.id), { ...producto, stock: nuevoStock });
  };

  const hacerPedido = async (producto, cuotas) => {
    await addDoc(collection(db, 'pedidos'), {
      producto: producto.nombre,
      precio: producto.precio,
      cuotas: cuotas,
      modelo: nombreModelo,
      estado: 'pendiente',
      fecha: new Date().toISOString(),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    });
    await setDoc(doc(db, 'inventario', producto.id), { ...producto, stock: producto.stock - 1 });
    setPedidoEnviado(producto.nombre);
    setSeleccionando(null);
    setTimeout(() => setPedidoEnviado(null), 3000);
  };

  const iniciarEdicion = (p) => {
    setEditando(p.id);
    setFormEdit({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, stock: p.stock });
    setConfirmando(null);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    const p = productos.find(x => x.id === editando);
    await setDoc(doc(db, 'inventario', editando), {
      ...p,
      nombre: formEdit.nombre,
      categoria: formEdit.categoria,
      precio: Number(formEdit.precio),
      stock: Number(formEdit.stock)
    });
    setEditando(null);
    setFormEdit({});
  };

  const eliminar = async (id) => {
    await deleteDoc(doc(db, 'inventario', id));
    setConfirmando(null);
  };

  const alertas = productos.filter(p => p.stock <= STOCK_MINIMO);

  // Solo el jefe puede gestionar el inventario
  if (rol !== 'jefe' && rol !== 'tienda') {
    return <div style={s.vacio}>No tienes acceso a esta sección</div>;
  }
  if (rol === 'tienda') {
    return (
      <div style={s.wrap}>
        {pedidoEnviado && (
          <div style={s.exito}>Pedido enviado — {pedidoEnviado}</div>
        )}
        {productos.filter(p => p.stock > 0).length === 0 && (
          <p style={s.vacio}>No hay productos disponibles</p>
        )}
        {CATEGORIAS.map(cat => {
          const prods = productos.filter(p => p.categoria === cat && p.stock > 0);
          if (prods.length === 0) return null;
          return (
            <div key={cat}>
              <div style={{ color: 'var(--text)', fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 16 }}>{cat}</div>
              <div className="nm-grid-cards">
                {prods.map(p => (
                  <div key={p.id} style={s.card}>
                    {p.imagen && <img src={p.imagen} alt={p.nombre} style={s.imgTienda} />}
                    <div style={s.cardHeader}>
                      <div style={s.cardNombre}>{p.nombre}</div>
                      <div style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 500 }}>${p.precio.toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>Disponibles: {p.stock}</div>
                      <button style={s.btnPedir} onClick={() => setSeleccionando(seleccionando === p.id ? null : p.id)}>
                        Pedir
                      </button>
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

  return (
    <div style={s.wrap}>
      {alertas.length > 0 && (
        <div style={s.alertaCard}>
          <div style={s.alertaTitulo}>Stock bajo — necesitas comprar</div>
          {alertas.map(p => (
            <div key={p.id} style={s.alertaItem}>{p.nombre} — {p.stock} unidades</div>
          ))}
        </div>
      )}

      {modo === null && (
        <button style={s.btnNuevo} onClick={() => setModo('nuevo')}>+ Agregar producto</button>
      )}

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
            <input type="file" accept="image/*" onChange={seleccionarImagen} style={{ display: 'none' }} />
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.btnGuardar} onClick={guardar} disabled={subiendo}>{subiendo ? 'Guardando...' : 'Guardar'}</button>
            <button style={s.btnCancelar} onClick={() => { setModo(null); setImagenArchivo(null); setImagenPreview(null); }}>Cancelar</button>
          </div>
        </div>
      )}

      {productos.length === 0 && modo === null && <p style={s.vacio}>No hay productos en inventario</p>}

      {CATEGORIAS.map(cat => {
        const prodsCat = productos.filter(p => p.categoria === cat);
        if (prodsCat.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div style={s.turnoLabel}>{cat}</div>
            <div className="nm-grid-cards">
            {prodsCat.map(p => (
              <div key={p.id} style={s.card}>
                {editando === p.id ? (
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
                ) : (
                  <>
                    <div style={s.cardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.imagen && <img src={p.imagen} alt={p.nombre} style={s.imgInventario} />}
                        <div>
                          <div style={s.cardNombre}>{p.nombre}</div>
                          <div style={s.cardCategoria}>{p.categoria}</div>
                        </div>
                      </div>
                      <div style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 500 }}>${p.precio.toLocaleString()}</div>
                    </div>
                    <div style={s.fila}>
                      <div style={s.filaLabel}>Stock actual</div>
                      <div style={p.stock <= STOCK_MINIMO ? s.stockBajo : s.stockOk}>{p.stock} unidades {p.stock <= STOCK_MINIMO ? '⚠️' : '✓'}</div>
                    </div>
                    <div style={s.btnRow}>
                      <button style={s.btnMas} onClick={() => ajustarStock(p, 1)}>+ 1</button>
                      <button style={s.btnMas} onClick={() => ajustarStock(p, 5)}>+ 5</button>
                      <button style={s.btnMas} onClick={() => ajustarStock(p, 10)}>+ 10</button>
                      <button style={s.btnMenos} onClick={() => ajustarStock(p, -1)}>- 1</button>
                    </div>
                    <div style={s.accionRow}>
                      <button style={s.btnEditar} onClick={() => iniciarEdicion(p)}>Editar</button>
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
            ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}