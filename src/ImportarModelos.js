import React, { useState } from 'react';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const MODELOS_INICIALES = [
  { nombreReal: 'Ashly Naibel Burgos Machado', nombreModelo: '', monitor: 'Daniela', turno: 'Manana' },
  { nombreReal: 'Ana Sofia Ospina Ortega', nombreModelo: '', monitor: 'Daniela', turno: 'Manana' },
  { nombreReal: 'Tatiana Andrea Rios Hurtado', nombreModelo: '', monitor: 'Daniela', turno: 'Manana' },
  { nombreReal: 'Luz Magnolia Salazar Garcia', nombreModelo: '', monitor: 'Daniela', turno: 'Manana' },
  { nombreReal: 'Vanessa Arroyave', nombreModelo: '', monitor: 'Daniela', turno: 'Manana' },
  { nombreReal: 'Valentina Osorno Alvarez', nombreModelo: '', monitor: 'Daniela', turno: 'Manana' },
  { nombreReal: 'Sara Arango Zuleta', nombreModelo: '', monitor: 'Daniela', turno: 'Manana' },
  { nombreReal: 'Valentina Zapata Azcuntar', nombreModelo: '', monitor: 'Daniela', turno: 'Manana' },
  { nombreReal: 'Alejandra Rojas Vargas', nombreModelo: '', monitor: 'Ramon', turno: 'Manana' },
  { nombreReal: 'Maye Catalina Insuasty Saldariaga', nombreModelo: '', monitor: 'Ramon', turno: 'Manana' },
  { nombreReal: 'Juliana Ospina Jimenez', nombreModelo: '', monitor: 'Ramon', turno: 'Manana' },
  { nombreReal: 'Liliana Castillo Salgado', nombreModelo: '', monitor: 'Ramon', turno: 'Manana' },
  { nombreReal: 'Nicoll Pulgarin Nohava', nombreModelo: '', monitor: 'Ramon', turno: 'Manana' },
  { nombreReal: 'Alison Daniela Zapata Estrada', nombreModelo: '', monitor: 'Ramon', turno: 'Manana' },
  { nombreReal: 'Evelyn Tamayo Zapata', nombreModelo: '', monitor: 'Ramon', turno: 'Manana' },
  { nombreReal: 'Valentina Marquez Pino', nombreModelo: '', monitor: 'Santiago', turno: 'Tarde' },
  { nombreReal: 'Susana Pelaez', nombreModelo: '', monitor: 'Santiago', turno: 'Tarde' },
  { nombreReal: 'Ivonne Camila Zuluaga Prieto', nombreModelo: '', monitor: 'Santiago', turno: 'Tarde' },
  { nombreReal: 'Evelin Saday Ricardo Solis', nombreModelo: '', monitor: 'Santiago', turno: 'Tarde' },
  { nombreReal: 'Luisa Fernanda Osorio Jimenez', nombreModelo: '', monitor: 'Santiago', turno: 'Tarde' },
  { nombreReal: 'Natalia Hernandez Llano', nombreModelo: '', monitor: 'Monica', turno: 'Tarde' },
  { nombreReal: 'Maria Camila Correa Munoz', nombreModelo: '', monitor: 'Monica', turno: 'Tarde' },
  { nombreReal: 'Nataly Cardenas Moreno', nombreModelo: '', monitor: 'Monica', turno: 'Tarde' },
  { nombreReal: 'Dayannis Tobon Acosta', nombreModelo: '', monitor: 'Monica', turno: 'Tarde' },
  { nombreReal: 'Diana Luz Agamez Gonzalez', nombreModelo: '', monitor: 'Monica', turno: 'Tarde' },
  { nombreReal: 'Asoryana Ramos Briseno', nombreModelo: '', monitor: 'Monica', turno: 'Tarde' },
  { nombreReal: 'Yesmi Diaz Ruiz', nombreModelo: '', monitor: 'Monica', turno: 'Tarde' },
  { nombreReal: 'Andrea Carolina Gomez Rodelo', nombreModelo: '', monitor: 'Juan', turno: 'Noche' },
  { nombreReal: 'Viviana Marcela Zambrano Mosquera', nombreModelo: '', monitor: 'Juan', turno: 'Noche' },
  { nombreReal: 'Sofia del Pilar Herrera Celis', nombreModelo: '', monitor: 'Juan', turno: 'Noche' },
  { nombreReal: 'Angie Marcela Villa Carmona', nombreModelo: '', monitor: 'Juan', turno: 'Noche' },
  { nombreReal: 'Isabela Gutierrez Rivera', nombreModelo: '', monitor: 'Juan', turno: 'Noche' },
  { nombreReal: 'Alexa Rivera Montoya', nombreModelo: '', monitor: 'Juan', turno: 'Noche' },
  { nombreReal: 'Yeimy Viviana Osorio Rojas', nombreModelo: '', monitor: 'Cesar', turno: 'Noche' },
  { nombreReal: 'Maria Jose Lopez Mejia', nombreModelo: '', monitor: 'Cesar', turno: 'Noche' },
  { nombreReal: 'Sara Paulina Mejia Marin', nombreModelo: '', monitor: 'Cesar', turno: 'Noche' },
  { nombreReal: 'Luisa Fernanda Rodriguez Calderon', nombreModelo: '', monitor: 'Cesar', turno: 'Noche' }
];

export default function ImportarModelos() {
  const [estado, setEstado] = useState('');
  const [hecho, setHecho] = useState(false);

  const importar = async () => {
    setEstado('Importando...');
    for (const modelo of MODELOS_INICIALES) {
      const id = modelo.nombreReal.replace(/\s+/g, '_').toLowerCase();
      await setDoc(doc(db, 'modelos', id), { ...modelo, activa: true });
    }
    setEstado('Listo! ' + MODELOS_INICIALES.length + ' modelos importadas.');
    setHecho(true);
  };

  const s = {
    wrap: { background: 'var(--bg)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-out)', textAlign: 'center' },
    btn: { background: 'var(--bg)', border: 'none', borderRadius: 12, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '14px 24px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 16 },
    texto: { color: 'var(--text-sub)', fontSize: 13, marginBottom: 16 },
    estado: { color: 'var(--gold)', fontSize: 13, marginTop: 12 }
  };

  return (
    <div style={s.wrap}>
      <div style={s.texto}>Esto importa todas las modelos a Firebase de una sola vez. Solo necesitas hacerlo una vez.</div>
      {!hecho && <button style={s.btn} onClick={importar}>Importar todas las modelos</button>}
      {estado && <div style={s.estado}>{estado}</div>}
    </div>
  );
}