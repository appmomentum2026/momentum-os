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

// TÍTULO de la push según el tipo de notificación interna
const TITULOS_NOTIF = {
  pedido: "Nuevo pedido",
  novedad: "Nueva novedad",
};

// Se dispara cuando se crea un doc en "notificaciones" (ver src/Notificaciones.js -> crearNotificacion)
// y envía la push por FCM a los tokens guardados en "tokens_notificacion".
// Nota: "tokens_notificacion/{id}" guarda { token, usuario, id, actualizado }, donde "usuario" es
// el rol genérico ('jefe' | 'monitor' | 'modelo') y "id" es el identificador específico (nombre del
// monitor/modelo, o la variante de jefe). El campo "destinatario" de la notificación puede ser
// 'jefe' (coincide con el campo "usuario" de las 3 variantes de jefe) o el nombre de un monitor
// (coincide con el campo "id" de su token) — por eso se busca por ambos campos.
exports.enviarNotificacion = functions.firestore
  .document("notificaciones/{notifId}")
  .onCreate(async (snap) => {
    const notif = snap.data();
    const destinatario = notif.destinatario;
    if (!destinatario) return null;

    const titulo = TITULOS_NOTIF[notif.tipo] || "Momentum Studio";
    const body = notif.mensaje || "";

    const [porUsuario, porId] = await Promise.all([
      db.collection("tokens_notificacion").where("usuario", "==", destinatario).get(),
      db.collection("tokens_notificacion").where("id", "==", destinatario).get(),
    ]);

    const tokenDocs = new Map();
    porUsuario.forEach((d) => tokenDocs.set(d.id, d));
    porId.forEach((d) => tokenDocs.set(d.id, d));
    if (tokenDocs.size === 0) return null;

    await Promise.all(Array.from(tokenDocs.values()).map(async (d) => {
      const token = d.data().token;
      if (!token) return;
      try {
        await admin.messaging().send({ token, notification: { title: titulo, body } });
      } catch (err) {
        // Token expirado o inválido: lo eliminamos para no reintentar en el futuro
        if (
          err.code === "messaging/registration-token-not-registered" ||
          err.code === "messaging/invalid-registration-token"
        ) {
          await db.collection("tokens_notificacion").doc(d.id).delete();
        }
      }
    }));

    return null;
  });