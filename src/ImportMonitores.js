import React, { useState } from 'react';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const MONITORES_DATA = [
  { nombre: 'Daniela', turno: 'Manana', clave: 'dani1234', modelas: ['Ashly Naibel Burgos Machado', 'Ana Sofia Ospina Ortega', 'Tatiana Andrea Rios Hurtado', 'Luz Magnolia Salazar Garcia', 'Vanessa Arroyave', 'Valentina Osorno Alvarez', 'Sara Arango Zuleta', 'Valentina Zapata Azcuntar'] },
  { nombre: 'Ramon', turno: 'Manana', clave: 'ramon1234', modelas: ['Alejandra Rojas Vargas', 'Maye Catalina Insuasty Saldariaga', 'Juliana Ospina Jimenez', 'Liliana Castillo Salgado', 'Nicoll Pulgarin Nohava', 'Alison Daniela Zapata Estrada', 'Evelyn Tamayo Zapata'] },
  { nombre: 'Santiago', turno: 'Tarde', clave: 'santi1234', modelas: ['Valentina Marquez Pino', 'Susana Pelaez', 'Ivonne Camila Zuluaga Prieto', 'Evelin Saday Ricardo Solis', 'Luisa Fernanda Osorio Jimenez'] },
  { nombre: 'Monica', turno: 'Tarde', clave: 'moni1234', modelas: ['Natalia Hernandez Llano', 'Maria Camila Correa Munoz', 'Nataly Cardenas Moreno', 'Dayannis Tobon Acosta', 'Diana Luz Agamez Gonzalez', 'Asoryana Ramos Briseno', 'Yesmi Diaz Ruiz'] },
  { nombre: 'Juan', turno: 'Noche', clave: 'juan1234', modelas: ['Andrea Carolina Gomez Rodelo', 'Viviana Marcela Zambrano Mosquera', 'Sofia del Pilar Herrera Celis', 'Angie Marcela Villa Carmona', 'Isabela Gutierrez Rivera', 'Alexa Rivera Montoya'] },
  { nombre: 'Cesar', turno: 'Noche', clave: 'cesar1234', modelas: ['Yeimy Viviana Osorio Rojas', 'Maria Jose Lopez Mejia', 'Sara Paulina Mejia Marin', 'Luisa Fernanda Rodriguez Calderon'] }
];

export default function ImportMonitores() {
  const [estado, setEstado] = useState('');
  const [hecho, setHecho] = useState(false);

  const importar = async () => {
    setEstado('Importando...');
    for (const monitor of MONITORES_DATA) {
      await setDoc(doc(db, 'monitores', monitor.nombre.toLowerCase()), monitor);
    }
    setEstado('Listo! 6 monitores importados.');
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
      <div style={s.texto}>Importa todos los monitores a Firebase con sus claves y modelas asignadas.</div>
      {!hecho && <button style={s.btn} onClick={importar}>Importar monitores</button>}
      {estado && <div style={s.estado}>{estado}</div>}
    </div>
  );
}