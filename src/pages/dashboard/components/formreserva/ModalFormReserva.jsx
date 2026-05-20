import { useState, useEffect } from "react";
import "./ModalFormReserva.css";
import ModalAgregarVehiculo from "../vehiculos/ModalAgregarVehiculo";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function vehiculoMatchTipo(vehiculo, tipoVehiculo) {
  if (tipoVehiculo === "moto") return vehiculo.tipo === 2;
  return vehiculo.tipo === 1;
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekStart(date) {
  const d = typeof date === "string" ? parseDateValue(date) : new Date(date);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return formatDateInputValue(d);
}

function formatDateLabel(dateStr) {
  const date = parseDateValue(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  return `${DIAS[date.getDay()]} ${day} ${MESES[date.getMonth()]}`;
}

function toDateObj(dateStr) {
  return parseDateValue(dateStr);
}

function parseHourValue(hour) {
  const [hours, minutes] = hour.split(":").map(Number);
  return hours * 60 + minutes;
}

function isSlotInThePast(dateStr, hour) {
  const today = new Date();
  const selectedDate = parseDateValue(dateStr);
  const currentDate = formatDateInputValue(today);
  const selectedDateValue = formatDateInputValue(selectedDate);

  if (selectedDateValue < currentDate) return true;
  if (selectedDateValue > currentDate) return false;

  return parseHourValue(hour) < today.getHours() * 60 + today.getMinutes();
}

function formatPrice(price) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(price));
}

export default function ModalFormReserva({
  servicios,
  tipoVehiculo = "carro",
  onClose,
  onConfirmada,
  onVolver,
  timeSelected = null
}) {
  const hoy = formatDateInputValue(new Date());
  const tieneHorarioFijo = Boolean(timeSelected?.date && timeSelected?.hour);

  const [weekStart, setWeekStart] = useState(getWeekStart(timeSelected?.date ?? hoy));
  const [calendario, setCalendario] = useState(null);
  const [loadingCal, setLoadingCal] = useState(true);
  const [errorCal, setErrorCal] = useState(null);

  const [vehiculos, setVehiculos] = useState([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(true);
  const [errorVehiculos, setErrorVehiculos] = useState(null);
  const [vehiculoId, setVehiculoId] = useState("");
  const [fechaSel, setFechaSel] = useState(tieneHorarioFijo ? timeSelected.date : null);
  const [horaSel, setHoraSel] = useState(tieneHorarioFijo ? timeSelected.hour : null);

  const [submitting, setSubmitting] = useState(false);
  const [errorPost, setErrorPost] = useState(null);
  const [validacionMsg, setValidacionMsg] = useState(null);

  const [modalVehiculoOpen, setModalVehiculoOpen] = useState(false);

  const fetchVehiculos = () => {
    setLoadingVehiculos(true);
    setErrorVehiculos(null);

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorVehiculos("No hay sesión iniciada");
      setLoadingVehiculos(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.sub;

      if (!userId) throw new Error("No se encontró ID de usuario en el token");

      fetch(`http://localhost:8080/api/booking/vehicles/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then(r => {
          if (!r.ok) throw new Error(`Error ${r.status}`);
          return r.json();
        })
        .then(json => {
          if (!json.success) throw new Error(json.message || "Error al cargar vehículos");

          setVehiculos(json.data);

          const filtrados = json.data.filter(v =>
            vehiculoMatchTipo(v, tipoVehiculo)
          );

          if (filtrados.length === 1) setVehiculoId(filtrados[0].id);
          else setVehiculoId("");
        })
        .catch(err => setErrorVehiculos(err.message))
        .finally(() => setLoadingVehiculos(false));
    } catch {
      setErrorVehiculos("Error al procesar el token");
      setLoadingVehiculos(false);
    }
  };

  useEffect(() => {
    fetchVehiculos();
  }, []);

  useEffect(() => {
    setVehiculoId("");

    const filtrados = vehiculos.filter(v =>
      vehiculoMatchTipo(v, tipoVehiculo)
    );

    if (filtrados.length === 1) setVehiculoId(filtrados[0].id);
  }, [tipoVehiculo, vehiculos]);

  useEffect(() => {
    if (tieneHorarioFijo) {
      setLoadingCal(false);
      setErrorCal(null);
      setCalendario(null);
      setWeekStart(getWeekStart(timeSelected.date));
      setFechaSel(timeSelected.date);
      setHoraSel(timeSelected.hour);
      return;
    }

    setLoadingCal(true);
    setErrorCal(null);
    setFechaSel(null);
    setHoraSel(null);

    const token = localStorage.getItem("token");

    fetch(`http://localhost:8080/api/booking/reservations/calendar/week?week_start=${weekStart}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then(json => {
        if (!json.success) throw new Error("Respuesta no exitosa");
        setCalendario(json.data);
      })
      .catch(err => setErrorCal(err.message))
      .finally(() => setLoadingCal(false));
  }, [weekStart, tieneHorarioFijo, timeSelected]);

  const irSemanaAnterior = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);

    const nueva = d.toISOString().split("T")[0];

    if (nueva >= getWeekStart(hoy)) setWeekStart(nueva);
  };

  const irSemanaSiguiente = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split("T")[0]);
  };

  const semanaAnteriorDeshabilitada = weekStart <= getWeekStart(hoy);

  const handleConfirmar = async () => {
    if (!vehiculoId || !fechaSel || !horaSel) {
      const partes = [];

      if (!vehiculoId) partes.push("un vehículo");
      if (!fechaSel || !horaSel) partes.push("un horario");

      setValidacionMsg(`Selecciona ${partes.join(" y ")} para continuar.`);
      return;
    }

    setValidacionMsg(null);
    setSubmitting(true);
    setErrorPost(null);

    const token = localStorage.getItem("token");

    const body = {
      vehicle_id: vehiculoId,
      date: fechaSel,
      time: horaSel,
      service_ids: servicios.map(s => String(s.id)),
    };

    try {
      const r = await fetch("http://localhost:8080/api/booking/reservations/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await r.json();

      if (
        json.error &&
        json.error.includes("(hora Colombia) no está disponible. Los 3 cupos están ocupados durante ese período.")
      ) {
        throw new Error(
          "Los servicios seleccionados alcanzan a tomar tiempo de un horario que ya está lleno. Por favor, elige otro horario o reduce la duración total de los servicios."
        );
      }

      if (r.status === 422) {
        throw new Error("El horario seleccionado ya no está disponible.");
      }

      if (!r.ok || !json.success) {
        throw new Error(json.message || json.error || `Error ${r.status}`);
      }

      onConfirmada?.(json.data);
      onClose();
    } catch (err) {
      setErrorPost(err.message || "No se pudo crear la reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const vehiculosFiltrados = vehiculos.filter(v =>
    vehiculoMatchTipo(v, tipoVehiculo)
  );

  const tipoLabel = tipoVehiculo === "moto" ? "moto" : "carro";

  const slotsDia = fechaSel
    ? calendario?.days.find(d => d.date === fechaSel)?.slots ?? []
    : [];

  const total = servicios.reduce(
    (acc, s) => acc + parseFloat(s.price),
    0
  );

  const duracion = servicios.reduce(
    (acc, s) => acc + s.duration,
    0
  );

  return (
    <>
      <div className="mfr-backdrop" onClick={handleBackdrop}>
        <div className="mfr-box">

          <div className="mfr-header">
            <div className="mfr-header-left">
              <button className="mfr-back" onClick={onVolver} title="Volver a servicios">
                ‹ Servicios
              </button>

              <h2 className="mfr-title">Crear Reservación</h2>
            </div>

            <button className="mfr-close" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>

          <div className="mfr-body">

            <section className="mfr-section">
              <p className="mfr-label">Servicios seleccionados</p>

              <div className="mfr-servicios-tabla">
                {servicios.map(s => (
                  <div key={s.id} className="mfr-servicio-fila">
                    <div className="mfr-servicio-info">
                      <span className="mfr-servicio-nombre">{s.name}</span>
                      <span className="mfr-servicio-duracion">{s.duration} min</span>
                    </div>

                    <span className="mfr-servicio-precio">
                      {formatPrice(s.price)}
                    </span>
                  </div>
                ))}

                <div className="mfr-servicios-total">
                  <div className="mfr-total-left">
                    <span>Total</span>
                    <span className="mfr-total-duracion">
                      {duracion} min
                    </span>
                  </div>

                  <span className="mfr-total-precio">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </section>

            <section className="mfr-section">
              <label className="mfr-label" htmlFor="vehiculo">
                Vehículo

                <span className={`mfr-tipo-badge mfr-tipo-badge--${tipoVehiculo}`}>
                  {tipoVehiculo === "moto" ? "🏍️ Moto" : "🚗 Carro"}
                </span>
              </label>

              {loadingVehiculos && (
                <p className="mfr-hint">Cargando vehículos...</p>
              )}

              {errorVehiculos && (
                <p className="mfr-error">{errorVehiculos}</p>
              )}

              {!loadingVehiculos &&
                !errorVehiculos &&
                vehiculosFiltrados.length === 0 && (
                  <div className="mfr-no-vehiculos">
                    <p className="mfr-hint">
                      No tienes {tipoLabel}s registrados.
                    </p>

                    <button
                      type="button"
                      className="mfr-btn-agregar-vehiculo"
                      onClick={() => setModalVehiculoOpen(true)}
                    >
                      + Agregar {tipoLabel}
                    </button>
                  </div>
                )}

              {!loadingVehiculos &&
                !errorVehiculos &&
                vehiculosFiltrados.length > 0 && (
                  <select
                    id="vehiculo"
                    className="mfr-select"
                    value={vehiculoId}
                    onChange={e => setVehiculoId(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecciona un {tipoLabel}
                    </option>

                    {vehiculosFiltrados.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.tipo === 2 ? "🏍️" : "🚗"} {v.placa} — {v.marca} {v.modelo}
                      </option>
                    ))}
                  </select>
                )}
            </section>

            {tieneHorarioFijo ? (
              <section className="mfr-section">
                <p className="mfr-label">Horario seleccionado</p>

                <div className="mfr-fixed-schedule">
                  <strong>{formatDateLabel(timeSelected.date)}</strong>
                  <span>{timeSelected.hour}</span>
                </div>
              </section>
            ) : (
              <>
                <section className="mfr-section">
                  <div className="mfr-cal-nav">
                    <button
                      className="mfr-nav-btn"
                      onClick={irSemanaAnterior}
                      disabled={semanaAnteriorDeshabilitada}
                    >
                      ‹
                    </button>

                    <span className="mfr-label" style={{ margin: 0 }}>
                      {calendario
                        ? `${formatDateLabel(calendario.week_start)} — ${formatDateLabel(calendario.week_end)}`
                        : "Cargando..."}
                    </span>

                    <button
                      className="mfr-nav-btn"
                      onClick={irSemanaSiguiente}
                    >
                      ›
                    </button>
                  </div>

                  {loadingCal && (
                    <p className="mfr-hint">Cargando disponibilidad...</p>
                  )}

                  {errorCal && (
                    <p className="mfr-error">{errorCal}</p>
                  )}

                  {!loadingCal && !errorCal && calendario && (
                    <div className="mfr-dias-grid">
                      {calendario.days.map(dia => {
                        const pasado = toDateObj(dia.date) < toDateObj(hoy);
                        const todosLlenos = dia.slots.every(s => s.full);

                        const deshabilitado = pasado || todosLlenos;
                        const seleccionado = fechaSel === dia.date;

                        return (
                          <button
                            key={dia.date}
                            className={`mfr-dia-btn ${seleccionado ? "sel" : ""} ${deshabilitado ? "dis" : ""}`}
                            disabled={deshabilitado}
                            onClick={() => {
                              setFechaSel(dia.date);
                              setHoraSel(null);
                            }}
                          >
                            {formatDateLabel(dia.date)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                {fechaSel && (
                  <section className="mfr-section">
                    <p className="mfr-label">Hora disponible</p>

                    <div className="mfr-horas-grid">
                      {slotsDia.map(slot => (
                        <button
                          key={slot.hour}
                          className={`mfr-hora-btn ${
                            horaSel === slot.hour ? "sel" : ""
                          } ${
                            slot.full || isSlotInThePast(fechaSel, slot.hour)
                              ? "dis"
                              : ""
                          }`}
                          disabled={
                            slot.full ||
                            isSlotInThePast(fechaSel, slot.hour)
                          }
                          onClick={() => setHoraSel(slot.hour)}
                        >
                          {slot.hour}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {errorPost && (
              <p className="mfr-error">{errorPost}</p>
            )}
          </div>

          <div className="mfr-footer">
            {validacionMsg && (
              <div className="mfr-validacion-alert">
                <span className="mfr-validacion-icon">⚠️</span>
                {validacionMsg}
              </div>
            )}

            <button
              className="mfr-btn-confirmar enabled"
              disabled={submitting}
              onClick={handleConfirmar}
            >
              {submitting
                ? "Confirmando..."
                : "Confirmar Reserva"}
            </button>
          </div>
        </div>
      </div>

      <ModalAgregarVehiculo
        isOpen={modalVehiculoOpen}
        onClose={() => setModalVehiculoOpen(false)}
        onSuccess={() => {
          setModalVehiculoOpen(false);
          fetchVehiculos();
        }}
      />
    </>
  );
}