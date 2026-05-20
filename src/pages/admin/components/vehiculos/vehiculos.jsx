import { useState } from "react";
import "./Vehiculos.css";

const API_BASE = "http://localhost:8080/api";
const getToken = () => localStorage.getItem("token") || "";

const TABS = ["Todos", "Confirmada", "Pendiente", "Finalizada", "Cancelada"];

const STATUS_MAP = {
  confirmada: { className: "status_confirmada", label: "Confirmada" },
  pendiente:  { className: "status_pendiente",  label: "Pendiente"  },
  finalizada: { className: "status_finalizada", label: "Finalizada" },
  completada: { className: "status_finalizada", label: "Completada" },
  cancelada:  { className: "status_cancelada",  label: "Cancelada"  },
};

const getStatus = (s = "") =>
  STATUS_MAP[s.toLowerCase()] ?? { className: "", label: s };

const fmt = (n) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function ServicesCell({ services }) {
  const [open, setOpen] = useState(false);
  if (!services?.length) return <span className="no_services">—</span>;
  return (
    <div className="services_cell">
      <button className="services_toggle" onClick={() => setOpen((o) => !o)}>
        {open ? "▲" : "▼"} {services.length} servicio{services.length !== 1 ? "s" : ""}
      </button>
      {open && (
        <div className="services_dropdown">
          {services.map((s) => (
            <div key={s.id} className="service_tag">
              <span className="service_name">{s.name}</span>
              <span className="service_meta">{fmt(s.price)} · {s.duration} min</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationRow({ r }) {
  const st = getStatus(r.status);

  return (
    <tr>
      <td>
        <span className="vehicle_plate">{r.placa}</span>
        <span className="vehicle_info">{r.marca} {r.modelo}</span>
      </td>
      <td>{r.date}</td>
      <td>{r.time}</td>
      <td>{fmt(r.total_price)}</td>
      <td>
        <span className={`status_badge ${st.className}`}>{st.label}</span>
      </td>
      <td className="services_col">
        <ServicesCell services={r.services} />
      </td>
    </tr>
  );
}

export default function Vehiculos() {
  const [search, setSearch]             = useState("");
  const [reservations, setReservations]   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [searched, setSearched]           = useState(false);
  const [activeTab, setActiveTab]         = useState("Todos");
  const [currentPlate, setCurrentPlate]   = useState("");

  const fetchReservations = async (plate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/booking/reservations/vehicle/${plate}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Error al obtener reservas");
      
      setReservations(json.data ?? []);
      setCurrentPlate(plate);
      setSearched(true);
      setActiveTab("Todos");
    } catch (e) {
      setError(e.message);
      setReservations([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const plate = search.trim().toUpperCase();
    if (!plate) return;
    fetchReservations(plate);
  };

  const handleClear = () => {
    setSearch("");
    setReservations([]);
    setSearched(false);
    setError(null);
    setCurrentPlate("");
    setActiveTab("Todos");
  };

  const count = (s) =>
    reservations.filter((r) => r.status?.toLowerCase() === s.toLowerCase()).length;

  const displayed = reservations.filter((r) =>
    activeTab === "Todos" ? true : r.status?.toLowerCase() === activeTab.toLowerCase()
  );

  return (
    <div className="vehiculos">
      <h1 className="vehiculos_titulo">Reservas por Vehículo</h1>

      <form className="vehiculos_search" onSubmit={handleSearch}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder="Buscar por placa..."
        />
        <button type="submit" className="vehiculos_btn_buscar" disabled={!search.trim() || loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
        {searched && (
          <button type="button" className="vehiculos_btn_limpiar" onClick={handleClear}>
            ✕ Limpiar
          </button>
        )}
      </form>

      {!searched && !loading && (
        <div className="vehiculos_empty">
          <p>Ingresa una placa para ver el historial de reservas del vehículo</p>
        </div>
      )}

      {error && <div className="vehiculos_error">{error}</div>}

      {searched && !error && (
        <>
          <p className="vehiculos_result_info">
            Placa: <strong>{currentPlate}</strong> — {reservations.length} reserva(s) encontrada(s)
          </p>

          <div className="vehiculos_stats">
            <div className="vehiculos_stat_card">
              <p className="vehiculos_stat_label">Total</p>
              <p className="vehiculos_stat_value">{reservations.length}</p>
            </div>
            <div className="vehiculos_stat_card">
              <p className="vehiculos_stat_label">Pendientes</p>
              <p className="vehiculos_stat_value pendiente">{count("pendiente")}</p>
            </div>
            <div className="vehiculos_stat_card">
              <p className="vehiculos_stat_label">Confirmadas</p>
              <p className="vehiculos_stat_value confirmada">{count("confirmada")}</p>
            </div>
            <div className="vehiculos_stat_card">
              <p className="vehiculos_stat_label">Finalizadas</p>
              <p className="vehiculos_stat_value finalizada">{count("finalizada")}</p>
            </div>
            <div className="vehiculos_stat_card">
              <p className="vehiculos_stat_label">Canceladas</p>
              <p className="vehiculos_stat_value cancelada">{count("cancelada")}</p>
            </div>
          </div>

          <div className="vehiculos_filtros">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`filtro_btn ${activeTab === tab ? "activo" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab !== "Todos" && (
                  <span className="filtro_btn_count">({count(tab)})</span>
                )}
              </button>
            ))}
          </div>

          <div className="vehiculos_table_wrapper">
            <table className="vehiculos_table">
              <thead>
                <tr>
                  {["Vehículo", "Fecha", "Hora", "Total", "Estado", "Servicios"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="vehiculos_table_empty">
                      No hay reservas con estado "{activeTab}"
                    </td>
                  </tr>
                ) : (
                  displayed.map((r) => (
                    <ReservationRow key={r.id} r={r} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}