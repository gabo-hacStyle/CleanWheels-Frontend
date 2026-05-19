import { useEffect, useState, useRef } from "react";
import "./Reservas.css";
import ModalServicios from "../servicios/ModalServicios";
import ModalFormReserva from "../formreserva/ModalFormReserva";

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateInputValue(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMondayFromDate(dateValue) {
  const date = typeof dateValue === "string" ? parseDateInputValue(dateValue) : new Date(dateValue);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return formatDateInputValue(date);
}

function addDaysToDateInput(dateValue, days) {
  const date = parseDateInputValue(dateValue);
  date.setDate(date.getDate() + days);
  return formatDateInputValue(date);
}

function formatDateRange(startValue, endValue) {
  const start = parseDateInputValue(startValue);
  const end = parseDateInputValue(endValue);
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("es-CO", opts)} — ${end.toLocaleDateString("es-CO", opts)}`;
}

function formatCalendarDay(dateValue) {
  const date = parseDateInputValue(dateValue);
  const weekday = date.toLocaleDateString("es-CO", { weekday: "short" });
  return `${weekday} ${pad(date.getDate())}`;
}

function parseHourValue(hour) {
  const [hours, minutes] = hour.split(":").map(Number);
  return hours * 60 + minutes;
}

function isPastSlot(dateValue, hourValue) {
  const today = new Date();
  const selectedDate = parseDateInputValue(dateValue);
  const currentDateValue = formatDateInputValue(today);
  const selectedDateValue = formatDateInputValue(selectedDate);

  if (selectedDateValue < currentDateValue) {
    return true;
  }

  if (selectedDateValue > currentDateValue) {
    return false;
  }

  return parseHourValue(hourValue) < today.getHours() * 60 + today.getMinutes();
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
  const today = formatDateInputValue(new Date());
  const [weekStart, setWeekStart] = useState(() => getMondayFromDate(today));
  const [calendar, setCalendar] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [errorCalendar, setErrorCalendar] = useState(null);
  const [modal, setModal] = useState(null);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [timeSelected, setTimeSelected] = useState(null);
  const weekPickerInputRef = useRef(null);

  const weekEnd = addDaysToDateInput(weekStart, 4);
  const days = calendar?.days ?? [];
  const hours = days[0]?.slots?.map((slot) => slot.hour) ?? [];
  const fetchCalendar = async () => {
    try {
      setLoadingCalendar(true);
      setErrorCalendar(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/booking/reservations/calendar/week?week_start=${weekStart}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error("Respuesta no exitosa");
      }

      setCalendar(json.data);
    } catch (error) {
      setErrorCalendar(error.message);
    } finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [weekStart]);

  const handleWeekChange = (event) => {
    setWeekStart(getMondayFromDate(event.target.value));
    // Mantener el picker abierto después de seleccionar
    if (weekPickerInputRef.current) {
      setTimeout(() => {
        weekPickerInputRef.current?.showPicker?.();
      }, 50);
    }
  };

  const handleGoPreviousWeek = () => {
    setWeekStart((currentWeekStart) => addDaysToDateInput(currentWeekStart, -7));
  };

  const handleGoNextWeek = () => {
    setWeekStart((currentWeekStart) => addDaysToDateInput(currentWeekStart, 7));
  };

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
  };

  if (errorCalendar) {
    return <div className="reservas-container">Error: {errorCalendar}</div>;
  }

  return (
    <div className="reservas-container">
      <h1 className="reservas-title">Reservar horario</h1>
      <p className="reservas-subtitle">Maneja las reservas</p>

      <div className="reservas-controls">
        <div className="reservas-daterange">
          <CalendarIcon />
          <div className="week-picker">
            <span className="week-picker-label">Semana del lunes</span>
            <input
              ref={weekPickerInputRef}
              type="date"
              className="week-picker-input"
              value={weekStart}
              step={7}
              onChange={handleWeekChange}
              aria-label="Seleccionar lunes de la semana"
            />
          </div>
        </div>
        <button className="btn-agendar" onClick={() => handleOpenServices(null)}>
          Agendar
        </button>
      </div>

      <div className="reservas-week-range">{formatDateRange(weekStart, weekEnd)}</div>

      <div className="reservas-grid-wrapper">
        <button className="arrow-btn" onClick={handleGoPreviousWeek}>‹</button>
        <div className={`reservas-grid ${!loadingCalendar ? 'loaded' : ''}`}>
          <div className="cell header-cell time-col">Hora | Día</div>
          {days.map((day) => (
            <div key={day.date} className="cell header-cell day-col">
              <span>{formatCalendarDay(day.date)}</span>
            </div>
          ))}
          {hours.map((hour) => {
            return (
              <div key={hour} className="row-group">
                <div className="cell time-cell">{hour}</div>
                {days.map((day) => {
                  const slot = day.slots.find((item) => item.hour === hour);
                  const occupied = Boolean(slot?.full);
                  const disabledByDate = isPastSlot(day.date, hour);
                  const disabled = occupied || disabledByDate;
                  const slotSelectedTime = { date: day.date, hour };

                  if (!slot) {
                    return <div key={`${day.date}-${hour}`} className="cell slot empty" />;
                  }

                  return (
                    <button
                      key={`${day.date}-${hour}`}
                      type="button"
                      className={`cell slot slot-button ${disabled ? "unavailable" : "available"} ${disabledByDate ? "past-slot" : ""}`}
                      disabled={disabled}
                      onClick={() => handleOpenServices(slotSelectedTime)}
                    >
                      <span className="slot-title">{disabled ? "No disponible" : "Disponible"}</span>
                      <span className="slot-cupos">
                        {occupied
                          ? "Cupos llenos"
                          : disabledByDate
                            ? "Horario pasado"
                            : "Click para agendar"}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <button className="arrow-btn" onClick={handleGoNextWeek}>›</button>
      </div>

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
            // Refrescar calendario para mostrar el nuevo estado del slot
            fetchCalendar();
            console.log("Reserva creada:", reserva);
          }}
        />
      )}
    </div>
  );
}