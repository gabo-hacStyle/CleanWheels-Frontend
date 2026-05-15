import './Reportes.css'
import { useState, useEffect } from 'react'

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
  } else if (filtro === 'Mes') {
    const inicio = new Date(hoy)
    inicio.setMonth(hoy.getMonth() - 1)
    from = inicio.toISOString().split("T")[0]
  } else {
    const inicio = new Date(hoy)
    inicio.setFullYear(hoy.getFullYear() - 1)
    from = inicio.toISOString().split("T")[0]
  }

  return { from, to }
}

const formatPeso = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor)

function Reportes() {
  const [filtro, setFiltro] = useState('Mes')
  const [stats, setStats] = useState(null)
  const [customFrom, setCustomFrom] = useState(() => getRangoFechas('Mes').from)
  const [customTo, setCustomTo] = useState(() => getRangoFechas('Mes').to)

  const token = localStorage.getItem("token")
  const headers = { "Authorization": `Bearer ${token}` }

  const cargarIngresos = async () => {
    let from, to
    if (filtro === 'Personalizado') {
      from = customFrom || getRangoFechas('Mes').from
      to = customTo || getRangoFechas('Mes').to
    } else {
      const rango = getRangoFechas(filtro)
      from = rango.from
      to = rango.to
    }
    try {
      const queryFrom = `${from}T00:00:00.000Z`
      const queryTo = `${to}T23:59:59.999Z`
      const res = await fetch(`http://localhost:8080/api/admin/incomes?from=${queryFrom}&to=${queryTo}`, { headers })
      const data = await res.json()
      setStats(data.data)
    } catch (err) {
      console.error("Error cargando ingresos:", err)
    }
  }

  useEffect(() => {
    cargarIngresos()
  }, [filtro])

  return (
    <div className="reportes">
      <h1 className="reportes_titulo">Finanzas</h1>

      <div className="reportes_filtros">
        {['Día', 'Semana', 'Mes', 'Año', 'Personalizado'].map((f) => (
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
        <div className="reportes_personalizado">
          <label>
            Desde:&nbsp;
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          </label>
          <label style={{ marginLeft: '12px' }}>
            Hasta:&nbsp;
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </label>
          <button className="filtro_btn" style={{ marginLeft: '12px' }} onClick={cargarIngresos}>Aplicar</button>
        </div>
      )}

      <div className="reportes_cards">
        <div className="reporte_card">
          <p className="card_label">Total ingresos</p>
          <p className="card_valor">{stats ? formatPeso(stats.total_incomes) : '—'}</p>
        </div>
        <div className="reporte_card">
          <p className="card_label">Total reservas</p>
          <p className="card_valor">{stats ? stats.total_reservations : '—'}</p>
        </div>
        <div className="reporte_card">
          <p className="card_label">Promedio por reserva</p>
          <p className="card_valor">{
            stats && stats.total_reservations > 0
              ? formatPeso(Math.round(stats.total_incomes / stats.total_reservations))
              : '—'
          }</p>
        </div>
        <div className="reporte_card">
          <p className="card_label">Ingreso diario promedio</p>
          <p className="card_valor">{
            stats ? (() => {
              const fromDate = new Date(stats.from_date || `${customFrom}T00:00:00.000Z`)
              const toDate = new Date(stats.to_date || `${customTo}T23:59:59.999Z`)
              const diffTime = Math.abs(toDate - fromDate)
              const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
              return formatPeso(Math.round(stats.total_incomes / diffDays))
            })() : '—'
          }</p>
        </div>
      </div>

    </div>
  )
}

export default Reportes