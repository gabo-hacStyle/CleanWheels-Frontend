import { useState, useEffect, useMemo } from "react";
import "./Vehiculos.css";
import ModalAgregarVehiculo from "./ModalAgregarVehiculo";

function getVehiculoIcon(tipo) {
  return tipo === 2 ? "🏍️" : "🚗";
}

const STATUS_FILTERS = ["Todos", "pendiente", "completado", "cancelado"];
const PAGE_SIZE = 5;

const STATUS_LABELS = {
  pendiente:  "Pendiente",
  completado: "Completado",
  cancelado:  "Cancelado",
  // fallback para otros valores
};

function formatPrice(price) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(price));
}

function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.id || payload.user_id || null;
  } catch {
    return null;
  }
}

// ── Tab: Reservas ────────────────────────────────────────────
function ReservasTab() {
  const [reservas, setReservas]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("Todos");
  const [page, setPage]           = useState(1);
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setError("No hay sesión iniciada"); setLoading(false); return; }

    const userId = getUserIdFromToken(token);
    if (!userId) { setError("No se pudo identificar el usuario"); setLoading(false); return; }

    fetch(`http://localhost:8080/api/booking/reservations/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then(json => {
        if (!json.success) throw new Error(json.message || "Error al cargar reservas");
        setReservas(json.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const total      = reservas.length;
  const pendientes = reservas.filter(r => r.status === "pendiente").length;
  const completados = reservas.filter(r => r.status === "completado").length;
  const cancelados = reservas.filter(r => r.status === "cancelado").length;

  const filtered = useMemo(() => {
    return reservas.filter(r => {
      const matchFilter = filter === "Todos" || r.status === filter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.placa?.toLowerCase().includes(q) ||
        r.marca?.toLowerCase().includes(q) ||
        r.modelo?.toLowerCase().includes(q) ||
        r.date?.includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        r.services?.some(s => s.name.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [reservas, search, filter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goTo        = p => setPage(Math.max(1, Math.min(p, totalPages)));
  const handleFilter = f => { setFilter(f); setPage(1); };
  const handleSearch = e => { setSearch(e.target.value); setPage(1); };

  if (loading) return <p className="vehiculos-hint">Cargando reservas...</p>;
  if (error)   return <p className="vehiculos-error">{error}</p>;

  return (
    <>
      <div className="vehiculos-stats">
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value neutral">{total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pendientes</span>
          <span className="stat-value amber">{pendientes}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completados</span>
          <span className="stat-value green">{completados}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cancelados</span>
          <span className="stat-value red">{cancelados}</span>
        </div>
      </div>

      <div className="vehiculos-filters">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => handleFilter(f)}
          >
            {f === "Todos" ? "Todos" : STATUS_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      <div className="vehiculos-table-wrapper">
        <table className="vehiculos-table">
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Servicios</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: "24px" }}>
                  Sin resultados
                </td>
              </tr>
            ) : (
              paginated.map(r => (
                <>
                  <tr key={r.id}>
                    <td>
                      <span className="vehiculo-placa">{r.placa}</span>
                      <span className="vehiculo-sub">{r.marca} {r.modelo}</span>
                    </td>
                    <td>{r.date}</td>
                    <td>{r.time}</td>
                    <td>{formatPrice(r.total_price)}</td>
                    <td>
                      <span className={`status-badge status-${r.status}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="expand-btn"
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        title="Ver servicios"
                      >
                        {expanded === r.id ? "▲" : "▼"} {r.services?.length ?? 0} servicio{r.services?.length !== 1 ? "s" : ""}
                      </button>
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr key={`${r.id}-expanded`} className="expanded-row">
                      <td colSpan={6}>
                        <div className="servicios-list">
                          {r.services?.map(s => (
                            <span key={s.id} className="servicio-chip">{s.name}</span>
                          ))}
                          <span className="duracion-chip">⏱ {r.total_duration} min</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>

        <div className="vehiculos-pagination">
          <button className="page-btn" onClick={() => goTo(1)} disabled={currentPage === 1}>«</button>
          <button className="page-btn" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn ${p === currentPage ? "active" : ""}`}
              onClick={() => goTo(p)}
            >
              {p}
            </button>
          ))}
          <button className="page-btn" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
          <button className="page-btn" onClick={() => goTo(totalPages)} disabled={currentPage === totalPages}>»</button>
        </div>
      </div>
    </>
  );
}

// ── Tab: Vehículos ───────────────────────────────────────────
function VehiculosTab() {
  const [vehiculos, setVehiculos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]   = useState(false);

  const fetchVehiculos = () => {
    const token = localStorage.getItem("token");
    if (!token) { setError("No hay sesión iniciada"); setLoading(false); return; }

    const userId = getUserIdFromToken(token);
    if (!userId) { setError("No se pudo identificar el usuario"); setLoading(false); return; }

    setLoading(true);
    fetch(`http://localhost:8080/api/booking/vehicles/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then(json => {
        if (!json.success) throw new Error(json.message || "Error al cargar vehículos");
        setVehiculos(json.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVehiculos(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return vehiculos;
    return vehiculos.filter(v =>
      v.placa?.toLowerCase().includes(q) ||
      v.marca?.toLowerCase().includes(q) ||
      v.modelo?.toLowerCase().includes(q)
    );
  }, [vehiculos, search]);

  if (loading) return <p className="vehiculos-hint">Cargando vehículos...</p>;
  if (error)   return <p className="vehiculos-error">{error}</p>;

  return (
    <>
      <div className="vehiculos-tab-header">
        <input
          className="vehiculos-search"
          type="text"
          placeholder="Buscar vehículo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 0 }}
        />
        <button className="btn-agregar-vehiculo" onClick={() => setModalOpen(true)}>
          + Agregar vehículo
        </button>
      </div>

      <div className="vehiculos-stats" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <span className="stat-label">Total registrados</span>
          <span className="stat-value neutral">{vehiculos.length}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="vehiculos-hint">
          {vehiculos.length === 0 ? "No tienes vehículos registrados." : "Sin resultados para tu búsqueda."}
        </p>
      ) : (
        <div className="vehiculos-cards-grid">
          {filtered.map(v => (
            <div key={v.id} className="vehiculo-card">
              <div className="vehiculo-card-icon">{getVehiculoIcon(v.tipo)}</div>
              <div className="vehiculo-card-info">
                <span className="vehiculo-placa-big">{v.placa}</span>
                <span className="vehiculo-modelo-big">{v.marca} · {v.modelo}</span>
                <span className="vehiculo-fecha">
                  Registrado: {new Date(v.created_at).toLocaleDateString("es-CO")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalAgregarVehiculo
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchVehiculos(); }}
      />
    </>
  );
}

// ── Main component ───────────────────────────────────────────
export default function Vehiculos() {
  const [tab, setTab] = useState("reservas");

  return (
    <div className="vehiculos-container">
      <h1 className="vehiculos-title">Mi Cuenta</h1>

      <div className="vehiculos-tabs">
        <button
          className={`tab-btn ${tab === "reservas" ? "active" : ""}`}
          onClick={() => setTab("reservas")}
        >
          📅 Mis Reservas
        </button>
        <button
          className={`tab-btn ${tab === "vehiculos" ? "active" : ""}`}
          onClick={() => setTab("vehiculos")}
        >
          🚗 Mis Vehículos
        </button>
      </div>

      {tab === "reservas" ? <ReservasTab /> : <VehiculosTab />}
    </div>
  );
}