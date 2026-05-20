import { useState, useEffect } from "react";
import "./ModalServicios.css";
import ModalFormReserva from "../formreserva/ModalFormReserva";

// Categorías que permiten selección múltiple — ajusta según tu backend
const CATEGORIAS_MULTIPLES = new Set(["Lavado Interior"]);

// Regex de palabra completa "moto" — no coincide con "motor", "motorola", etc.
const ES_MOTO = /\bmoto\b/i;

function formatPrice(price) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(price));
}

export default function ModalServicios({ onClose, onAgendar, timeSelected = null }) {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [seleccionados, setSeleccionados] = useState({});
  const [tipoVehiculo, setTipoVehiculo]   = useState("carro"); // "carro" | "moto"
  const [paso, setPaso]                   = useState("servicios"); // "servicios" | "reserva"

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:8080/api/booking/services/", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then(json => {
        if (!json.success) throw new Error("Respuesta no exitosa");
        setServicios(json.data.filter(s => s.is_active !== false));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtrar servicios según el tipo de vehículo seleccionado
  const serviciosFiltrados = servicios.filter(s => {
    const esMoto = ES_MOTO.test(s.name) || ES_MOTO.test(s.category_name || "");
    return tipoVehiculo === "moto" ? esMoto : !esMoto;
  });

  // Agrupar dinámicamente por category_name
  const categorias = serviciosFiltrados.reduce((acc, svc) => {
    const cat = svc.category_name || "Otros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  const handleTipoVehiculo = (tipo) => {
    setTipoVehiculo(tipo);
    setSeleccionados({});
  };

  const toggleServicio = (svc) => {
    const esMultiple = CATEGORIAS_MULTIPLES.has(svc.category_name);

    setSeleccionados(prev => {
      const next = { ...prev };

      if (next[svc.id]) {
        delete next[svc.id];
      } else {
        if (!esMultiple) {
          serviciosFiltrados
            .filter(s => s.category_name === svc.category_name)
            .forEach(s => delete next[s.id]);
        }
        next[svc.id] = svc;
      }

      return next;
    });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAgendar = () => {
    if (!selArray.length) return;
    setPaso("reserva");
  };

  const selArray = Object.values(seleccionados);
  const total    = selArray.reduce((acc, s) => acc + parseFloat(s.price), 0);
  const duracion = selArray.reduce((acc, s) => acc + s.duration, 0);

  // Si estamos en el paso de reserva, renderizar ModalFormReserva
  // pasándole tipoVehiculo directamente — sin pasar por el padre
  if (paso === "reserva") {
    return (
      <ModalFormReserva
        servicios={selArray}
        tipoVehiculo={tipoVehiculo}
        timeSelected={timeSelected}
        onClose={onClose}
        onVolver={() => setPaso("servicios")}
        onConfirmada={(data) => {
          onAgendar?.(selArray, timeSelected, data);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box">

        <div className="modal-header">
          <h2 className="modal-title">AGENDAR SERVICIOS</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* ── Toggle Carro / Moto ── */}
        <div className="modal-tipo-selector">
          <button
            className={`modal-tipo-btn ${tipoVehiculo === "carro" ? "active" : ""}`}
            onClick={() => handleTipoVehiculo("carro")}
          >
            <span className="modal-tipo-icon">🚗</span>
            Carro
          </button>
          <button
            className={`modal-tipo-btn ${tipoVehiculo === "moto" ? "active" : ""}`}
            onClick={() => handleTipoVehiculo("moto")}
          >
            <span className="modal-tipo-icon">🏍️</span>
            Moto
          </button>
        </div>

        {timeSelected && (
          <div className="modal-time-selected">
            <span className="modal-time-tag">Horario seleccionado</span>
            <strong>{timeSelected.date}</strong>
            <span>{timeSelected.hour}</span>
          </div>
        )}

        <div className="modal-body">
          {loading && <p className="modal-loading">Cargando servicios...</p>}
          {error   && <p className="modal-loading">Error: {error}</p>}

          {!loading && !error && Object.entries(categorias).map(([catName, items]) => {
            const esMultiple           = CATEGORIAS_MULTIPLES.has(catName);
            const haySeleccionadaEnCat = items.some(s => seleccionados[s.id]);

            return (
              <div key={catName} className="modal-category">
                <h3 className="modal-category-title">
                  {catName}
                  {esMultiple && <span className="badge-multiple">Selección múltiple</span>}
                </h3>
                <div className="modal-services-grid">
                  {items.map(svc => {
                    const estaSeleccionado = !!seleccionados[svc.id];
                    const deshabilitado    = !esMultiple && haySeleccionadaEnCat && !estaSeleccionado;

                    return (
                      <div
                        key={svc.id}
                        className={`service-card ${estaSeleccionado ? "selected" : ""} ${deshabilitado ? "disabled-card" : ""}`}
                        onClick={() => toggleServicio(svc)}
                      >
                        {svc.image_url && (
                          <div className="service-card-image-container">
                            <img 
                              src={svc.image_url} 
                              alt={svc.name}
                              className="service-card-image"
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="service-card-content">
                          <p className="service-card-name">{svc.name}</p>
                          <p className="service-card-desc">{svc.description}</p>
                          <p className="service-card-price">{formatPrice(svc.price)}</p>
                          <p className="service-card-duration">{svc.duration} min</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          {selArray.length > 0 && (
            <div className="modal-resumen">
              {selArray.map(s => (
                <span key={s.id} className="resumen-chip">{s.name}</span>
              ))}
              <span className="resumen-total">{formatPrice(total)} · {duracion} min</span>
            </div>
          )}
          <button
            className={`btn-modal-agendar ${selArray.length ? "enabled" : "disabled"}`}
            onClick={handleAgendar}
            disabled={!selArray.length}
          >
            Agendar
          </button>
        </div>

      </div>
    </div>
  );
}