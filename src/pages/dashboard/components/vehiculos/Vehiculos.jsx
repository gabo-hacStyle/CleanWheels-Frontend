import React, { useState, useEffect, useMemo } from "react";
import "./Vehiculos.css";
import ModalAgregarVehiculo from "./ModalAgregarVehiculo";
import ModalServicios from "../servicios/ModalServicios";
import ModalFormReserva from "../formreserva/ModalFormReserva";

function getVehiculoIcon(tipo) {
  // Si viene número
  if (tipo === 2) return "🏍️";
  if (tipo === 1) return "🚗";

  // Si viene texto
  const tipoLower = String(tipo).toLowerCase();

  if (
    tipoLower.includes("moto") ||
    tipoLower.includes("motocicleta")
  ) {
    return "🏍️";
  }

  return "🚗";
}

const STATUS_FILTERS = ["Todos", "pendiente", "completado", "cancelado"];
const PAGE_SIZE = 5;

const STATUS_LABELS = {
  pendiente: "Pendiente",
  completado: "Completado",
  cancelado: "Cancelado",
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

function ReservasTab() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "cancel",
    reservationId: null,
  });

  // Estados para el modal de agendar
  const [modal, setModal] = useState(null);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [timeSelected, setTimeSelected] = useState(null);

  const getStatusLabel = (status = "") => {
    const s = status.toLowerCase();
    if (s === "pendiente") return "Pendiente";
    if (s === "completado" || s === "completada") return "Completado";
    if (s === "cancelado" || s === "cancelada") return "Cancelado";
    return status;
  };

  const fetchReservas = () => {
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
        setReservas(json.data ?? []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  const abrirConfirmacionCancelar = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmar Cancelación",
      message: "¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer de forma automática.",
      type: "cancel",
      reservationId: id
    });
  };

  const abrirConfirmacionReactivar = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmar Reactivación",
      message: "¿Deseas reactivar esta reserva y agendarla nuevamente en el sistema?",
      type: "reactivate",
      reservationId: id
    });
  };

  const ejecutarAccionConfirmada = async () => {
    const { type, reservationId } = confirmModal;
    const token = localStorage.getItem("token");
    if (!reservationId) return;

    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setActionLoading(prev => ({ ...prev, [reservationId]: true }));

    const endpoint = type === "cancel" ? "cancel" : "reactivate";

    try {
      const res = await fetch(`http://localhost:8080/api/booking/reservations/${reservationId}/${endpoint}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || `No se pudo procesar la acción`);

      fetchReservas();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  // Handlers para el modal de agendar
  const handleOpenServices = (selectedTime = null) => {
    setTimeSelected(selectedTime);
    setModal("servicios");
  };

  const handleAgendar = (selArray, selectedTime = null) => {
    setServiciosSeleccionados(selArray);
    if (selectedTime) {
      setTimeSelected(selectedTime);
    }
    setModal("reserva");
  };

  const handleCerrarTodo = () => {
    setModal(null);
    setServiciosSeleccionados([]);
    setTimeSelected(null);
    // Refrescar reservas al cerrar
    fetchReservas();
  };

  const total = reservas.length;
  const pendientes = reservas.filter(r => r.status?.toLowerCase() === "pendiente").length;
  const completados = reservas.filter(r => ["completado", "completada"].includes(r.status?.toLowerCase())).length;
  const cancelados = reservas.filter(r => ["cancelado", "cancelada"].includes(r.status?.toLowerCase())).length;

  const filtered = useMemo(() => {
    return reservas.filter(r => {
      const statusLower = r.status?.toLowerCase() || "";

      let matchFilter = false;
      if (filter === "Todos") matchFilter = true;
      if (filter === "pendiente" && statusLower === "pendiente") matchFilter = true;
      if (filter === "completado" && ["completado", "completada"].includes(statusLower)) matchFilter = true;
      if (filter === "cancelado" && ["cancelado", "cancelada"].includes(statusLower)) matchFilter = true;

      const q = search.toLowerCase();
      return matchFilter && (
        !q ||
        r.placa?.toLowerCase().includes(q) ||
        r.marca?.toLowerCase().includes(q) ||
        r.modelo?.toLowerCase().includes(q) ||
        r.date?.includes(q) ||
        statusLower.includes(q) ||
        r.services?.some(s => s.name.toLowerCase().includes(q))
      );
    });
  }, [reservas, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goTo = p => setPage(Math.max(1, Math.min(p, totalPages)));
  const handleSearch = e => { setSearch(e.target.value); setPage(1); };
  
  if (loading) return <p className="vehiculos-hint">Cargando reservas...</p>;
  if (error) return <p className="vehiculos-error">{error}</p>;

  return (
    <>
      <div className="vehiculos-tab-header">
        <input
          className="vehiculos-search"
          type="text"
          placeholder="Buscar por placa"
          value={search}
          onChange={handleSearch}
          style={{ marginBottom: 0 }}
        />
        <button className="btn-agendar-reserva" onClick={() => handleOpenServices(null)}>
          + Agendar reserva
        </button>
      </div>

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
            onClick={() => { setFilter(f); setPage(1); }}
          >
            {f === "Todos" ? "Todos" : f === "pendiente" ? "Pendiente" : f === "completado" ? "Completado" : "Cancelado"}
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: "24px" }}>
                  Sin resultados
                </td>
              </tr>
            ) : (
              paginated.map(r => {
                const statusLower = r.status?.toLowerCase() || "";
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td>
                        <span className="vehiculo-placa">{r.placa}</span>
                        <span className="vehiculo-sub">{r.marca} {r.modelo}</span>
                      </td>
                      <td>{r.date}</td>
                      <td>{r.time}</td>
                      <td>{formatPrice(r.total_price)}</td>
                      <td>
                        <span className={`status-badge status-${statusLower}`}>
                          {getStatusLabel(r.status)}
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
                      <td>
                        <div className="acciones-cell" style={{ display: "flex", gap: "6px" }}>
                          {statusLower === "pendiente" && (
                            <button
                              className="btn-cancelar-reserva"
                              onClick={() => abrirConfirmacionCancelar(r.id)}
                              disabled={actionLoading[r.id]}
                              style={{ backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                            >
                              {actionLoading[r.id] ? "..." : "Cancelar"}
                            </button>
                          )}

                          {["cancelado", "cancelada"].includes(statusLower) && (() => {
                            const fechaReserva = new Date(`${r.date}T${r.time}:00`);
                            const ahora = new Date();
                            const esFutura = fechaReserva > ahora;

                            if (esFutura) {
                              return (
                                <button
                                  className="btn-reactivar-reserva"
                                  onClick={() => abrirConfirmacionReactivar(r.id)}
                                  disabled={actionLoading[r.id]}
                                  style={{ backgroundColor: "#10b981", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                                >
                                  {actionLoading[r.id] ? "..." : "Reactivar"}
                                </button>
                              );
                            } else {
                              return <span style={{ color: "#9ca3af", fontSize: "12px", fontStyle: "italic" }}>Expirada</span>;
                            }
                          })()}

                          {(["completado", "completada", "finalizada", "confirmada"].includes(statusLower) && statusLower !== "pendiente") && (
                            <span style={{ color: "#9ca3af", fontSize: "13px" }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expanded === r.id && (
                      <tr className="expanded-row">
                        <td colSpan={7}>
                          <div className="servicios-list">
                            {r.services?.map(s => (
                              <span key={s.id} className="servicio-chip">{s.name}</span>
                            ))}
                            <span className="duracion-chip">⏱ {r.total_duration} min</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
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

      {confirmModal.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-box">
            <div className={`custom-modal-header ${confirmModal.type}`}>
              <h3>{confirmModal.title}</h3>
            </div>
            <div className="custom-modal-body">
              <p>{confirmModal.message}</p>
            </div>
            <div className="custom-modal-actions">
              <button 
                className="custom-modal-btn btn-close" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                Volver
              </button>
              <button 
                className={`custom-modal-btn btn-confirm ${confirmModal.type}`} 
                onClick={ejecutarAccionConfirmada}
              >
                {confirmModal.type === "cancel" ? "Sí, Cancelar" : "Sí, Reactivar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de agendar reserva */}
      {modal === "servicios" && (
        <ModalServicios
          onClose={handleCerrarTodo}
          onAgendar={handleAgendar}
          timeSelected={timeSelected}
        />
      )}

      {modal === "reserva" && (
        <ModalFormReserva
          servicios={serviciosSeleccionados}
          timeSelected={timeSelected}
          onClose={handleCerrarTodo}
          onVolver={() => setModal("servicios")}
          onConfirmada={(reserva) => {
            handleCerrarTodo();
            console.log("Reserva creada:", reserva);
          }}
        />
      )}
    </>
  );
}

function VehiculosTab() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

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
        setVehiculos(json.data ?? []);
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
  if (error) return <p className="vehiculos-error">{error}</p>;

  return (
    <>
      <div className="vehiculos-tab-header">
        <input
          className="vehiculos-search"
          type="text"
          placeholder="Buscar vehículo por modelo"
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