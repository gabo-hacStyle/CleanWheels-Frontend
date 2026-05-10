import { useState } from "react";
import "./Reservas.css";
import ModalServicios from "../servicios/ModalServicios";
import ModalFormReserva from "../formreserva/ModalFormReserva";

const TIME_SLOTS = [
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "12:00 AM - 2:00 AM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM",
];

const MOCK_DATA = {
  "8:00 AM - 9:00 AM":   [true,  true,  true,  true,  true ],
  "9:00 AM - 10:00 AM":  [true,  true,  true,  true,  true ],
  "10:00 AM - 11:00 AM": [false, false, true,  true,  true ],
  "12:00 AM - 2:00 AM":  [null,  null,  null,  null,  null ],
  "2:00 PM - 3:00 PM":   [true,  true,  false, true,  false],
  "3:00 PM - 4:00 PM":   [true,  true,  false, true,  true ],
  "4:00 PM - 5:00 PM":   [true,  false, true,  false, true ],
  "5:00 PM - 6:00 PM":   [false, true,  true,  true,  false],
};

const MOCK_CUPOS = {
  "8:00 AM - 9:00 AM":   [2, 3, 2, 4, 2],
  "9:00 AM - 10:00 AM":  [1, 2, 2, 1, 2],
  "10:00 AM - 11:00 AM": [0, 0, 2, 2, 2],
  "12:00 AM - 2:00 AM":  [0, 0, 0, 0, 0],
  "2:00 PM - 3:00 PM":   [2, 1, 0, 2, 0],
  "3:00 PM - 4:00 PM":   [2, 3, 0, 2, 1],
  "4:00 PM - 5:00 PM":   [1, 0, 2, 0, 1],
  "5:00 PM - 6:00 PM":   [0, 2, 1, 1, 0],
};

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateRange(start, end) {
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("es-CO", opts)} — ${end.toLocaleDateString("es-CO", opts)}`;
}

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export default function Reservas() {
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [modal, setModal]         = useState(null); // null | "servicios" | "reserva"
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);

  const days   = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 4);

  const handleAgendar = (selArray) => {
    setServiciosSeleccionados(selArray);
    setModal("reserva");
  };

  const handleCerrarTodo = () => {
    setModal(null);
    setServiciosSeleccionados([]);
  };

  return (
    <div className="reservas-container">
      <h1 className="reservas-title">Reservaciones</h1>
      <p className="reservas-subtitle">Maneja las reservas</p>

      <div className="reservas-controls">
        <div className="reservas-daterange">
          <CalendarIcon />
          <span>{formatDateRange(weekStart, weekEnd)}</span>
        </div>
        <button className="btn-agendar" onClick={() => setModal("servicios")}>
          Agendar
        </button>
      </div>

      {/* Grid — sin cambios */}
      <div className="reservas-grid-wrapper">
        <button className="arrow-btn" onClick={() => setWeekStart(d => addDays(d, -7))}>‹</button>
        <div className="reservas-grid">
          <div className="cell header-cell time-col">Hora | Día</div>
          {days.map((d, i) => (
            <div key={i} className="cell header-cell day-col">{d.getDate()}</div>
          ))}
          {TIME_SLOTS.map((slot) => {
            const isBreak = slot === "12:00 AM - 2:00 AM";
            return (
              <div key={slot} className="row-group">
                <div className={`cell time-cell${isBreak ? " break-time" : ""}`}>{slot}</div>
                {days.map((_, col) => {
                  if (isBreak) return <div key={col} className="cell break-slot" />;
                  const available = MOCK_DATA[slot]?.[col];
                  const cupos     = MOCK_CUPOS[slot]?.[col] ?? 0;
                  if (available === null || available === undefined)
                    return <div key={col} className="cell slot empty" />;
                  return (
                    <div key={col} className={`cell slot ${available ? "available" : "unavailable"}`}>
                      <span className="slot-title">{available ? "Disponible" : "No Disponible"}</span>
                      <span className="slot-cupos">{available ? `Cupos : ${cupos}` : "Cupos Llenos"}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <button className="arrow-btn" onClick={() => setWeekStart(d => addDays(d, 7))}>›</button>
      </div>

      {modal === "servicios" && (
        <ModalServicios
          onClose={handleCerrarTodo}
          onAgendar={handleAgendar}
        />
      )}

      {modal === "reserva" && (
        <ModalFormReserva
          servicios={serviciosSeleccionados}
          onClose={handleCerrarTodo}
          onVolver={() => setModal("servicios")}
          onConfirmada={(reserva) => {
            handleCerrarTodo();
            console.log("Reserva creada:", reserva);
          }}
        />
      )}
    </div>
  );
}