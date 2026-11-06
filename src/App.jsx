import { useCallback, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import {
  collection, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, writeBatch,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { COSTO_ADOPCION, ESPECIES, NIVEL_MAX, REEMBOLSO_LIBERAR, costoNivel } from './data'
import Creature from './components/Creature'

const TEXTO_ESTADO = {
  guardado: 'Guardado en Firebase',
  pendiente: 'Cambios sin guardar',
  guardando: 'Guardando…',
  error: 'No se pudo guardar. Revisá tu conexión, vamos a reintentar.',
}

export default function App() {
  const [uid, setUid] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorInicio, setErrorInicio] = useState('')
  const [energia, setEnergia] = useState(0)
  const [clicks, setClicks] = useState(0)
  const [criaturas, setCriaturas] = useState([])
  const [estado, setEstado] = useState('guardado')
  const [aviso, setAviso] = useState(null)
  const [especie, setEspecie] = useState('hielo')
  const [nombre, setNombre] = useState('')
  const [ocupado, setOcupado] = useState(false)

  // Fuente de verdad local para los toques: evita guardar en Firebase en cada click.
  const datos = useRef({ energia: 0, clicks: 0, sucio: false })
  const timerAviso = useRef(null)

  const avisar = useCallback((tipo, texto) => {
    clearTimeout(timerAviso.current)
    setAviso({ tipo, texto })
    timerAviso.current = setTimeout(() => setAviso(null), 4000)
  }, [])

  // 1. Identidad: cada navegador entra con una sesión anónima de Firebase Auth.
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) return setUid(user.uid)
      try {
        await signInAnonymously(auth)
      } catch {
        setErrorInicio('No se pudo iniciar sesión. Revisá que Authentication → Anónimo esté habilitado en Firebase.')
        setCargando(false)
      }
    })
  }, [])

  // 2. CONSULTAR: perfil (getDoc) y criaturas (onSnapshot en tiempo real).
  useEffect(() => {
    if (!uid) return
    let activo = true
    ;(async () => {
      try {
        const ref = doc(db, 'users', uid)
        const snap = await getDoc(ref)
        if (!activo) return
        if (snap.exists()) {
          const d = snap.data()
          datos.current = { energia: d.energia ?? 0, clicks: d.clicks ?? 0, sucio: false }
          setEnergia(datos.current.energia)
          setClicks(datos.current.clicks)
        } else {
          await setDoc(ref, { energia: 0, clicks: 0, updatedAt: serverTimestamp() })
        }
      } catch {
        if (activo) setErrorInicio('No se pudo cargar tu progreso. Revisá las variables de entorno y las reglas de Firestore.')
      } finally {
        if (activo) setCargando(false)
      }
    })()

    const q = query(collection(db, 'users', uid, 'criaturas'), orderBy('creadaEn'))
    const cancelar = onSnapshot(
      q,
      (snap) => setCriaturas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => avisar('error', 'No se pudieron leer tus criaturas. Recargá la página.')
    )
    return () => { activo = false; cancelar() }
  }, [uid, avisar])

  // 3. MODIFICAR: la energía se guarda cada 3 segundos (si hubo toques) o al salir de la pestaña.
  useEffect(() => {
    if (!uid) return
    const guardar = async () => {
      const d = datos.current
      if (!d.sucio) return
      d.sucio = false
      setEstado('guardando')
      try {
        await setDoc(doc(db, 'users', uid),
          { energia: d.energia, clicks: d.clicks, updatedAt: serverTimestamp() }, { merge: true })
        setEstado(datos.current.sucio ? 'pendiente' : 'guardado')
      } catch {
        datos.current.sucio = true
        setEstado('error')
      }
    }
    const id = setInterval(guardar, 3000)
    const alOcultar = () => { if (document.hidden) guardar() }
    document.addEventListener('visibilitychange', alOcultar)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', alOcultar) }
  }, [uid])

  const poder = 1 + criaturas.reduce((suma, c) => suma + c.nivel, 0)

  const tocar = () => {
    const d = datos.current
    d.energia += poder
    d.clicks += 1
    d.sucio = true
    setEnergia(d.energia)
    setClicks(d.clicks)
    setEstado('pendiente')
  }

  // Cambio de criaturas + energía en una sola operación atómica (batch).
  async function ejecutar({ cambio, armar, ok, fallo }) {
    setOcupado(true)
    const d = datos.current
    try {
      const batch = writeBatch(db)
      armar(batch)
      batch.set(doc(db, 'users', uid),
        { energia: d.energia + cambio, clicks: d.clicks, updatedAt: serverTimestamp() }, { merge: true })
      await batch.commit()
      d.energia += cambio
      d.sucio = true
      setEnergia(d.energia)
      avisar('ok', ok)
      return true
    } catch {
      avisar('error', fallo)
      return false
    } finally {
      setOcupado(false)
    }
  }

  // AGREGAR
  const adoptar = async (ev) => {
    ev.preventDefault()
    const limpio = nombre.trim()
    if (limpio.length < 1 || limpio.length > 14) {
      return avisar('error', 'Escribí un nombre de 1 a 14 letras para tu criatura.')
    }
    const falta = COSTO_ADOPCION - datos.current.energia
    if (falta > 0) return avisar('error', `Te faltan ${falta} de energía. Tocá el orbe para juntar más.`)
    const ok = await ejecutar({
      cambio: -COSTO_ADOPCION,
      armar: (b) => b.set(doc(collection(db, 'users', uid, 'criaturas')),
        { nombre: limpio, elemento: especie, nivel: 1, creadaEn: Date.now() }),
      ok: `¡${limpio} se unió a tu criaturero!`,
      fallo: 'No se pudo adoptar. Revisá tu conexión y probá de nuevo.',
    })
    if (ok) setNombre('')
  }

  // MODIFICAR
  const subirNivel = async (c) => {
    const costo = costoNivel(c.nivel)
    const falta = costo - datos.current.energia
    if (falta > 0) return avisar('error', `Te faltan ${falta} de energía para subir de nivel a ${c.nombre}.`)
    await ejecutar({
      cambio: -costo,
      armar: (b) => b.update(doc(db, 'users', uid, 'criaturas', c.id), { nivel: c.nivel + 1 }),
      ok: `${c.nombre} subió al nivel ${c.nivel + 1}.`,
      fallo: `No se pudo subir de nivel a ${c.nombre}. Probá de nuevo.`,
    })
  }

  // ELIMINAR
  const liberar = async (c) => {
    if (!window.confirm(`¿Liberar a ${c.nombre}? Vas a recibir ${REEMBOLSO_LIBERAR} de energía.`)) return
    await ejecutar({
      cambio: REEMBOLSO_LIBERAR,
      armar: (b) => b.delete(doc(db, 'users', uid, 'criaturas', c.id)),
      ok: `${c.nombre} fue liberado.`,
      fallo: `No se pudo liberar a ${c.nombre}. Probá de nuevo.`,
    })
  }

  if (errorInicio) return <main className="centro"><p className="aviso error">{errorInicio}</p></main>
  if (cargando) return <main className="centro"><p>Cargando tu criaturero…</p></main>

  return (
    <main className="app">
      <header className="cabecera">
        <h1>Criaturero</h1>
        <p className={`estado ${estado}`} aria-live="polite">{TEXTO_ESTADO[estado]}</p>
      </header>

      <section className="panel energia">
        <p className="numero">{energia}</p>
        <p>de energía, {clicks} toques</p>
      </section>

      <button className="orbe" onClick={tocar}>
        Tocar<span>+{poder}</span>
      </button>

      <section className="panel">
        <h2>Adoptar una criatura</h2>
        <p className="ayuda">Cada adopción cuesta {COSTO_ADOPCION} de energía.</p>
        <div className="especies" role="radiogroup" aria-label="Elegí una especie">
          {Object.entries(ESPECIES).map(([clave, e]) => (
            <button
              type="button" key={clave} role="radio" aria-checked={especie === clave}
              className={`especie ${especie === clave ? 'activa' : ''}`}
              onClick={() => setEspecie(clave)}
            >
              <Creature elemento={clave} size={64} />
              <strong>{e.nombre}</strong>
              <small>{e.elemento}, {e.animal}</small>
            </button>
          ))}
        </div>
        <form className="adoptar" onSubmit={adoptar}>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre" value={nombre} maxLength={14} autoComplete="off"
            placeholder={ESPECIES[especie].nombre}
            onChange={(ev) => setNombre(ev.target.value)}
          />
          <button type="submit" disabled={ocupado}>Adoptar</button>
        </form>
      </section>

      <section className="panel">
        <h2>Mi criaturero</h2>
        {criaturas.length === 0 ? (
          <p className="vacio">Todavía no tenés criaturas. Juntá {COSTO_ADOPCION} de energía y adoptá la primera.</p>
        ) : (
          <ul className="lista">
            {criaturas.map((c) => {
              const e = ESPECIES[c.elemento]
              const enMaximo = c.nivel >= NIVEL_MAX
              return (
                <li key={c.id} className="criatura">
                  <Creature elemento={c.elemento} size={72} />
                  <div className="datos">
                    <strong>{c.nombre}</strong>
                    <span>{e.elemento}, {e.animal}</span>
                    <span>Nivel {c.nivel} de {NIVEL_MAX}</span>
                  </div>
                  <div className="acciones">
                    <button disabled={ocupado || enMaximo} onClick={() => subirNivel(c)}>
                      {enMaximo ? 'Nivel máximo' : `Subir de nivel (${costoNivel(c.nivel)})`}
                    </button>
                    <button className="suave" disabled={ocupado} onClick={() => liberar(c)}>Liberar</button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {aviso && <p className={`aviso ${aviso.tipo}`} role="status">{aviso.texto}</p>}
    </main>
  )
}
