const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

const db = admin.firestore();

const CLAVES_JEFE = {
  jefe: "1234",
  operativo: "oper1234",
  administrativo: "admin1234",
};

// Convierte una clave en hash irreversible
function hashClave(clave) {
  return crypto.createHash("sha256").update(String(clave)).digest("hex");
}

// LOGIN: verifica la clave
exports.verificarClave = functions.https.onCall(async (data, context) => {
  const { rol, clave } = data;

  if (!rol || !clave) {
    throw new functions.https.HttpsError("invalid-argument", "Faltan datos");
  }

  if (rol === "jefe" || rol === "operativo" || rol === "administrativo") {
    if (CLAVES_JEFE[rol] && clave === CLAVES_JEFE[rol]) {
      return { ok: true, rol, data: null };
    }
    throw new functions.https.HttpsError("permission-denied", "Clave incorrecta");
  }

  const coleccion = rol === "modelo" ? "modelos" : "monitores";
  const claveHash = hashClave(clave);
  const snap = await db.collection(coleccion).get();

  let encontrado = null;
  snap.forEach((doc) => {
    const d = doc.data();
    if (d.claveHash === claveHash) {
      encontrado = { id: doc.id, ...d };
      delete encontrado.claveHash;
    }
  });

  if (encontrado) {
    return { ok: true, rol, data: encontrado };
  }

  throw new functions.https.HttpsError("permission-denied", "Clave incorrecta");
});

// GUARDAR modelo o monitor con clave hasheada
exports.guardarUsuario = functions.https.onCall(async (data, context) => {
  const { coleccion, id, datos, clave } = data;

  if (!coleccion || !id || !datos) {
    throw new functions.https.HttpsError("invalid-argument", "Faltan datos");
  }

  const guardar = { ...datos };
  if (clave) {
    guardar.claveHash = hashClave(clave);
  }
  delete guardar.clave; // nunca guardar la clave en texto plano

  // Borra el campo 'clave' viejo (texto plano) si existiera
  guardar.clave = admin.firestore.FieldValue.delete();

  await db.collection(coleccion).doc(id).set(guardar, { merge: true });
  return { ok: true };
  });