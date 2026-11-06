# Criaturero

Juego clicker hecho con React + Vite, Firebase (Authentication anónima y Cloud Firestore) y publicado en Vercel.
Tocás el orbe para juntar energía, adoptás criaturas de seis elementos (hielo, tierra, viento, agua, rayo y fuego) y las subís de nivel.

## Qué se guarda en Firebase

- `users/{uid}`: `energia`, `clicks`, `updatedAt`.
- `users/{uid}/criaturas/{id}`: `nombre`, `elemento`, `nivel`, `creadaEn`.

| Operación | Dónde |
|---|---|
| Consultar | `getDoc` y `onSnapshot` en `src/App.jsx` |
| Agregar | `adoptar()` |
| Modificar | `subirNivel()` y el guardado automático de energía |
| Eliminar | `liberar()` |

La conexión con Firebase está en `src/firebase.js`. Las reglas están en `firestore.rules`.

## Ejecutar en local

1. `npm install`
2. Copiá `.env.example` a `.env` y completá los valores de `firebaseConfig` (sin comas ni comillas).
3. `npm run dev`

Si cambiás `.env`, reiniciá el servidor.

## Configurar Firebase

1. En Firebase Console, creá un proyecto y registrá una app web con el botón `</>`.
2. Authentication → Método de acceso → habilitá **Anónimo**.
3. Firestore Database → creá la base `(default)`, edición Standard, región São Paulo, en modo producción.
4. Pestaña Reglas → pegá el contenido de `firestore.rules` y publicá. Las reglas no se despliegan con Vercel.

## Publicar en Vercel

1. Importá el repositorio. Preset Vite, build `npm run build`, salida `dist`.
2. En Settings → Environment Variables cargá las cuatro variables `VITE_FIREBASE_*` para Production.
3. Desplegá. Si cambiás variables después, usá Redeploy.

Cada identidad es anónima: abrir la app desde otro navegador o dispositivo muestra un criaturero nuevo.
