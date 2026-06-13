# Momentum OS — Studio Management App

App de gestión operativa para un estudio. Permite a jefes, monitores y modelos consultar y registrar información en tiempo real.

## Stack

- **React 19** (Create React App, sin TypeScript)
- **Firebase 12**: Firestore (tiempo real), Storage (imágenes), Messaging (push notifications)
- **Deploy**: Vercel
- **Iconos**: Tabler Icons via CDN (`ti ti-*` classes en `<i>`)
- **Sin librerías de UI** — todo el diseño es propio

## Comandos

```bash
npm start    # dev server en localhost:3000
npm run build
```

## Roles de usuario

Hay 5 valores de `usuario` en el estado de `App.js`, agrupados en 3 experiencias:

| Valor | Experiencia | Autenticación |
|---|---|---|
| `jefe` | `AppJefe` (acceso total) | Clave fija `1234` |
| `operativo` | `AppJefe` con prop `soloLectura` | Clave fija `oper1234` |
| `administrativo` | `AppJefe` con prop `soloAdmin` | Clave fija `admin1234` |
| `monitor` | `AppMonitor` | Clave individual en colección `monitores` |
| `modelo` | `AppModelo` | Clave individual en colección `modelos` |

Las claves fijas están en `CLAVES` (App.js:21). El login muestra "Jefe" como botón único que despliega un submenú con los tres subroles.

## Estructura de archivos

```
src/
  App.js              # Login, routing por rol, MapaHabitaciones, layout components
  App.css             # Todos los estilos globales y clases nm-*
  firebase.js         # Inicialización de db y storage
  Notificaciones.js   # FCM: solicitarPermiso(), escucharNotificaciones()
  Asistencia.js       # Registro de asistencia por monitor
  CierreTurno.js      # Cierre de turno (monitor y jefe)
  Novedades.js        # Incidencias del turno
  Nomina.js           # Nómina quincenal de modelo
  Metas.js            # Metas por modelo
  ResumenJefe.js      # Resumen quincenal agregado
  ResumenMonitores.js # Gestión y resumen de monitores
  GestionModelos.js   # CRUD de modelos
  ImportarModelos.js  # Importación masiva de modelos
  ImportMonitores.js  # Importación masiva de monitores
  Inventario2.js      # Inventario + tienda de insumos
  Pedidos.js          # Pedidos de inventario (con quincenas)
  DiasLibres.js       # Días libres para modelo, monitor y jefe (3 exports nombrados)
  GoogleSheets.js     # Integración nómina con Google Sheets
  EnviarNotif.js      # Envío manual de push notifications
```

## Diseño — tema neumórfico

El tema alterna entre `body.oscuro` y `body.claro` mediante `document.body.className`. Todas las variables CSS están en `App.css`:

```
--bg / --bg2 / --bg3     capas de fondo
--gold / --gold-dim      acento principal (dorado)
--text / --text-sub / --text-dim
--shadow-out / --shadow-in   sombras neumórficas
--border / --border2
--green / --red
```

**Regla:** botones y tarjetas elevadas usan `box-shadow: var(--shadow-out)`; campos de entrada usan `box-shadow: var(--shadow-in)`.

## Convención de estilos en componentes

Cada componente declara un objeto `const s = { ... }` al nivel del módulo con todos sus estilos inline. Se aplica como `style={s.card}`, `style={s.label}`, etc. No se usan archivos CSS por componente ni CSS modules.

```js
const s = {
  card: { background: 'var(--bg)', borderRadius: 14, boxShadow: 'var(--shadow-out)', ... },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  input: { background: 'var(--bg)', border: 'none', boxShadow: 'var(--shadow-in)', ... },
};
```

Las clases CSS (`nm-*`) solo se usan en los componentes de layout de `App.js` (Sidebar, BottomBar, NavLayout, Login).

## Convención de layout

`NavLayout` en `App.js` renderiza dos variantes en paralelo y CSS las alterna:
- **Desktop**: `div.nm-layout-desktop` → sidebar izquierdo + contenido
- **Móvil**: `div.nm-layout-mobile` → header + contenido + bottom bar

Cada `App*` (AppJefe, AppMonitor, AppModelo) define su propio array `items` con `{ id, label, icon }` y los pasa a `NavLayout`.

## Firestore — colecciones principales

| Colección | Uso |
|---|---|
| `habitaciones` | Estado en vivo del mapa (libre/ocupada/fuera) |
| `modelos` | Datos y claves de modelos |
| `monitores` | Datos y claves de monitores |
| `novedades` | Incidencias de turno |
| `asistencia` | Registros de asistencia |
| `cierres` | Cierres de turno |
| `inventario` | Productos del inventario |
| `pedidos` | Pedidos de inventario |
| `tokens_notificacion` | Tokens FCM por usuario |

La mayoría de componentes usan `onSnapshot` para datos en tiempo real. Las escrituras usan `setDoc` (con ID conocido) o `addDoc` (auto-ID).

## Lógica de quincenas

Varios módulos (Pedidos, Nomina, ResumenJefe) calculan la quincena actual con una función `getQuincena()` local: días 1–15 = primera quincena, días 16–fin de mes = segunda. Las fechas se guardan como strings ISO (`YYYY-MM-DD` o ISO completo).

## Push Notifications (FCM)

`Notificaciones.js` exporta `solicitarPermiso(usuario, id)` y `escucharNotificaciones(callback)`. Al hacer login, cada rol solicita permiso y guarda su token en `tokens_notificacion/{id}`. Las notificaciones en-app se muestran como un toast flotante en `App.js` con auto-cierre a los 5 segundos.
