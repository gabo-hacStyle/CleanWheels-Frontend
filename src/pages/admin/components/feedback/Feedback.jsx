import './Feedback.css'
import { useState, useEffect } from 'react'

const Estrellas = ({ cantidad }) => (
  <div className="estrellas">
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={i <= cantidad ? 'estrella activa' : 'estrella'}>★</span>
    ))}
  </div>
)

const getRangoFechas = (filtro) => {
  const hoy = new Date()
  const to = hoy.toISOString().split("T")[0]
  let from

  if (filtro === 'Día') {
    from = to
  } else if (filtro === 'Semana') {
    const inicio = new Date(hoy)
    inicio.setDate(hoy.getDate() - 7)
    from = inicio.toISOString().split("T")[0]
  } else {
    const inicio = new Date(hoy)
    inicio.setMonth(hoy.getMonth() - 1)
    from = inicio.toISOString().split("T")[0]
  }

  return { from, to }
}

function Feedback() {
  const [filtro, setFiltro] = useState('Mes')
  const [reseñas, setReseñas] = useState([])
  const [stats, setStats] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const porPagina = 6

  const getHeaders = () => ({ "Authorization": `Bearer ${localStorage.getItem("token")}` })

  const cargarFeedback = async (from, to) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/feedback?from=${from}&to=${to}`,
        { headers: getHeaders() }
      )

      if (!res.ok) {
        setReseñas([])
        setStats(null)
        return
      }

      const data = await res.json()

      const lista = data.comments || (data.data && data.data.comments) || []
      const estadisticas = data.comments ? data : data.data

      setReseñas(lista)
      setStats(estadisticas || null)
    } catch (err) {
      console.error(err)
      setReseñas([])
      setStats(null)
    }
  }

  useEffect(() => {
    if (filtro !== 'Custom') {
      const { from, to } = getRangoFechas(filtro)
      cargarFeedback(from, to)
      setPagina(1)
    }
  }, [filtro])

  const handleFiltroCustom = () => {
    if (!fechaDesde || !fechaHasta) return
    if (fechaDesde > fechaHasta) return
    console.log('Fechas enviadas:', { fechaDesde, fechaHasta })
    console.log('URL:', `/api/admin/feedback?from=${fechaDesde}&to=${fechaHasta}`)
    cargarFeedback(fechaDesde, fechaHasta)
    setPagina(1)
  }

  const total = Math.ceil(reseñas.length / porPagina)
  const reseñasPagina = reseñas.slice((pagina - 1) * porPagina, pagina * porPagina)

  return (
    <div className="feedback">
      <h1 className="feedback_titulo">Reseñas</h1>

      {stats && (
        <div className="feedback_stats">
          <span>⭐ Promedio: <strong>{stats.rating_average || 0}</strong></span>
          <span>💬 Total: <strong>{stats.total_reviews || 0}</strong></span>
        </div>
      )}

      <div className="feedback_filtros">
        {['Día', 'Semana', 'Mes', 'Personalizado'].map((f) => (
          <button
            key={f}
            className={`filtro_btn ${filtro === f ? 'activo' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {filtro === 'Personalizado' && (
        <div className="feedback_custom">
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
          />
          <span>—</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
          />
          <button className="btn_guardar" onClick={handleFiltroCustom}>Buscar</button>
        </div>
      )}

      {reseñas.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
          No hay reseñas para este período.
        </p>
      ) : (
        <>
          <div className="feedback_grid">
            {reseñasPagina.map((r, i) => (
              <div key={i} className="feedback_card">
                <div className="feedback_avatar">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
                <p className="feedback_nombre">{r.user_email}</p>
                <p className="feedback_placa">🚗 {r.vehicle_license_plate}</p>
                <p className="feedback_texto">{r.feedback}</p>
                <Estrellas cantidad={r.rating} />
              </div>
            ))}
          </div>

          <div className="feedback_paginacion">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i + 1}
                className={pagina === i + 1 ? 'activo' : ''}
                onClick={() => setPagina(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPagina(p => Math.min(total, p + 1))}>›</button>
          </div>
        </>
      )}
    </div>
  )
}

export default Feedback