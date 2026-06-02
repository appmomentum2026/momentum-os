import React, { useState } from 'react';

const PLATAFORMAS = ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate', 'FNP', 'Otras'];

export default function GoogleSheets() {
  const [vista, setVista] = useState('horario');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarDatos = async (tipo) => {
    setCargando(true);
    setError(null);
    setDatos(null);
    setVista(tipo);
    try {
      const res = await fetch(`/api/sheets?sheet=${tipo}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cargar datos');
      }
      const json = await res.json();
      setDatos(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const s = {
    wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
    botones: { display: 'flex', gap: 10, marginBottom: 4, flexWrap: 'wrap' },
    btn: { padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'var(--bg2)', color: 'var(--text-sub)', border: '1px solid var(--border)' },
    btnActivo: { background: 'var(--bg2)', color: 'var(--gold)', borderBottom: '2px solid var(--gold)' },
    card: { background: 'var(--bg2)', borderRadius: 14, padding: 20, border: '1px solid var(--border)' },
    titulo: { color: 'var(--gold)', fontSize: 14, fontWeight: 500, marginBottom: 14 },
    tabla: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { textAlign: 'left', padding: '8px 10px', color: 'var(--gold)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)' },
    td: { padding: '9px 10px', color: 'var(--text)', fontSize: 13, borderBottom: '1px solid var(--border)' },
    badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(201,146,74,0.15)', color: 'var(--gold)' },
    fila: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' },
    label: { color: 'var(--text-sub)', fontSize: 13 },
    valor: { color: 'var(--text)', fontSize: 13 },
    vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 32, fontSize: 13 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.botones}>
        <button
          style={{ ...s.btn, ...(vista === 'horario' ? s.btnActivo : {}) }}
          onClick={() => cargarDatos('horario')}>
          🕐 Horario S1
        </button>
        <button
          style={{ ...s.btn, ...(vista === 'registro' ? s.btnActivo : {}) }}
          onClick={() => cargarDatos('registro')}>
          💰 Registro Tokens
        </button>
      </div>

      {cargando && (
        <div style={s.card}>
          <div style={s.vacio}>Consultando Sheet...</div>
        </div>
      )}

      {error && (
        <div style={{ ...s.card, borderColor: '#C0614A' }}>
          <div style={{ ...s.vacio, color: '#C0614A' }}>⚠️ {error}</div>
        </div>
      )}

      {!cargando && !error && !datos && (
        <div style={s.card}>
          <div style={s.vacio}>Selecciona una hoja para cargar los datos</div>
        </div>
      )}

      {datos && vista === 'horario' && (
        <div style={s.card}>
          <div style={s.titulo}>Horario S1 — {datos.totalModelos} modelos</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.tabla}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Nombre</th>
                  <th style={s.th}>Nick</th>
                  <th style={s.th}>Entrada</th>
                  <th style={s.th}>Salida</th>
                </tr>
              </thead>
              <tbody>
                {datos.modelos.map((m, i) => (
                  <tr key={i}>
                    <td style={s.td}>{m.numero}</td>
                    <td style={s.td}>{m.nombre}</td>
                    <td style={{ ...s.td, color: 'var(--gold)' }}>{m.modelo}</td>
                    <td style={s.td}>{m.horaEntrada || '—'}</td>
                    <td style={s.td}>{m.horaSalida || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {datos && vista === 'registro' && (
        <div style={s.wrap}>
          {datos.modelos.map((m, i) => (
            <div key={i} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>{m.nombre}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>{m.nickModelo}</div>
                </div>
                <div style={s.badge}>{m.porcentaje}%</div>
              </div>
              {PLATAFORMAS.map(plat => {
                const data = m.plataformas[plat];
                if (!data || data.tokens === 0) return null;
                return (
                  <div key={plat} style={s.fila}>
                    <div style={{ ...s.label, color: 'var(--gold)', width: 100 }}>{plat}</div>
                    <div style={s.valor}>{data.tokens.toLocaleString()} tkns</div>
                    <div style={s.valor}>${data.usd} USD</div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 8 }}>
                <div style={s.label}>Total: {m.totalTokens.toLocaleString()} tkns · ${m.totalUSD} USD</div>
                <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 15 }}>${m.pagoUSD} USD</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}