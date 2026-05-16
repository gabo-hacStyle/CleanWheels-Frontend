import './Reportes.css'
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const getRangoFechas = (filtro) => {
  const hoy = new Date()
  const to = hoy.toISOString().split("T")[0]
  let from

  if (filtro === 'Día') {
    from = to
  } else if (filtro === 'Semana') {
    const d = new Date(hoy); d.setDate(hoy.getDate() - 7)
    from = d.toISOString().split("T")[0]
  } else if (filtro === 'Mes') {
    const d = new Date(hoy); d.setMonth(hoy.getMonth() - 1)
    from = d.toISOString().split("T")[0]
  } else {
    const d = new Date(hoy); d.setFullYear(hoy.getFullYear() - 1)
    from = d.toISOString().split("T")[0]
  }

  return { from, to }
}

const formatPeso = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)

const formatPesoCorto = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

const COLORES = ['#00E5FF', '#22c55e', '#f59e0b', '#ef4444']
const PERIODOS = ['Día', 'Semana', 'Mes', 'Año']

const CustomTooltipBarra = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip_custom">
      <p className="tooltip_label">{label}</p>
      <p className="tooltip_valor">{formatPeso(payload[0]?.value ?? 0)}</p>
      <p className="tooltip_sub">{payload[1]?.value ?? 0} reservas</p>
    </div>
  )
}

const CustomTooltipLinea = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip_custom">
      <p className="tooltip_label">{label}</p>
      <p className="tooltip_valor">{formatPeso(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

function Reportes() {
  const [filtro, setFiltro] = useState('Mes')
  const [stats, setStats] = useState(null)
  const [customFrom, setCustomFrom] = useState(() => getRangoFechas('Mes').from)
  const [customTo, setCustomTo] = useState(() => getRangoFechas('Mes').to)
  const [comparativa, setComparativa] = useState([])
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem("token")
  const headers = { "Authorization": `Bearer ${token}` }

  const fetchPeriodo = async (periodo) => {
    const { from, to } = getRangoFechas(periodo)
    const res = await fetch(
      `http://localhost:8080/api/admin/incomes?from=${from}T00:00:00.000Z&to=${to}T23:59:59.999Z`,
      { headers }
    )
    const data = await res.json()
    return { periodo, ...data.data }
  }

  const cargarIngresos = async () => {
    setLoading(true)
    let from, to

    if (filtro === 'Personalizado') {
      from = customFrom || getRangoFechas('Mes').from
      to = customTo || getRangoFechas('Mes').to
    } else {
      const r = getRangoFechas(filtro)
      from = r.from; to = r.to
    }

    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/incomes?from=${from}T00:00:00.000Z&to=${to}T23:59:59.999Z`,
        { headers }
      )
      const data = await res.json()
      setStats(data.data)

      setHistorico((prev) => {
        const label = filtro === 'Personalizado' ? `${from} → ${to}` : filtro
        const existe = prev.find((p) => p.label === label)
        if (existe) return prev
        const nuevo = [...prev, { label, ingresos: data.data?.total_incomes ?? 0 }]
        return nuevo.slice(-8)
      })
    } catch (err) {
      console.error("Error cargando ingresos:", err)
    } finally {
      setLoading(false)
    }
  }

  const cargarComparativa = async () => {
    try {
      const resultados = await Promise.all(PERIODOS.map(fetchPeriodo))
      setComparativa(resultados.map((r) => ({
        periodo: r.periodo,
        ingresos: r.total_incomes ?? 0,
        reservas: r.total_reservations ?? 0,
      })))
    } catch (err) {
      console.error("Error cargando comparativa:", err)
    }
  }

  useEffect(() => {
    cargarIngresos()
  }, [filtro])

  useEffect(() => {
    cargarComparativa()
  }, [])

  const promedioPorReserva = stats && stats.total_reservations > 0
    ? Math.round(stats.total_incomes / stats.total_reservations)
    : 0

  const diffDays = (() => {
    if (!stats) return 1
    const a = new Date(stats.from_date ?? `${customFrom}T00:00:00.000Z`)
    const b = new Date(stats.to_date ?? `${customTo}T23:59:59.999Z`)
    return Math.max(1, Math.ceil(Math.abs(b - a) / (1000 * 60 * 60 * 24)))
  })()

  const pieData = stats ? [
    { name: 'Promedio por reserva', value: promedioPorReserva },
    { name: 'Ingreso diario', value: Math.round((stats.total_incomes ?? 0) / diffDays) },
  ] : []

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
          <label>
            Hasta:&nbsp;
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </label>
          <button className="filtro_btn" onClick={cargarIngresos}>Aplicar</button>
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
          <p className="card_valor">{promedioPorReserva ? formatPeso(promedioPorReserva) : '—'}</p>
        </div>
        <div className="reporte_card">
          <p className="card_label">Ingreso diario promedio</p>
          <p className="card_valor">{stats ? formatPeso(Math.round((stats.total_incomes ?? 0) / diffDays)) : '—'}</p>
        </div>
      </div>

      <div className="reportes_graficas">

        <div className="grafica_card grafica_grande">
          <p className="grafica_titulo">Comparativa por período</p>
          <p className="grafica_sub">Ingresos y reservas: Día / Semana / Mes / Año</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comparativa} barGap={6}>
              <XAxis dataKey="periodo" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatPesoCorto} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltipBarra />} cursor={{ fill: 'rgba(0,229,255,0.06)' }} />
              <Bar dataKey="ingresos" fill="#00E5FF" radius={[6, 6, 0, 0]} maxBarSize={48} />
              <Bar dataKey="reservas" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grafica_leyenda">
            <span><span className="leyenda_dot" style={{ background: '#00E5FF' }} />Ingresos</span>
            <span><span className="leyenda_dot" style={{ background: '#22c55e' }} />Reservas</span>
          </div>
        </div>

        <div className="grafica_card grafica_chica">
          <p className="grafica_titulo">Distribución</p>
          <p className="grafica_sub">Promedio reserva vs ingreso diario</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORES[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatPeso(v)} />
                <Legend
                  formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grafica_empty">Sin datos</div>
          )}
        </div>

        <div className="grafica_card grafica_full">
          <p className="grafica_titulo">Histórico de consultas</p>
          <p className="grafica_sub">Ingresos acumulados por cada filtro aplicado en esta sesión</p>
          {historico.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historico}>
                <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatPesoCorto} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltipLinea />} cursor={{ stroke: 'rgba(0,229,255,0.3)' }} />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#00E5FF"
                  strokeWidth={2.5}
                  dot={{ fill: '#00E5FF', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="grafica_empty">Cambia entre filtros para ver la evolución</div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Reportes