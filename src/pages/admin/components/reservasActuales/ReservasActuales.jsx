import React, { useState, useEffect } from 'react';
import './ReservasActuales.css';

export default function ReservasActuales() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [completing, setCompleting] = useState(false);

  // Obtener el token bearer del localStorage
  const getToken = () => {
    return localStorage.getItem('token') || '';
  };

  // Fetch de reservas en progreso
  const fetchReservasEnProgreso = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(
        'http://localhost:8080/api/booking/reservations/in-progress',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setReservas(data.data);
        setError(null);
      } else {
        setReservas([]);
      }
    } catch (err) {
      console.error('Error al obtener reservas:', err);
      setError('No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  // Completar una reserva
  const handleCompletarReserva = async () => {
    if (!selectedReserva) return;

    try {
      setCompleting(true);
      const token = getToken();
      const response = await fetch(
        `http://localhost:8080/api/booking/reservations/${selectedReserva.id}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payment_method: 'efectivo'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Cierra el modal y recarga las reservas
      setModalOpen(false);
      setSelectedReserva(null);
      await fetchReservasEnProgreso();
    } catch (err) {
      console.error('Error al completar reserva:', err);
      alert('Error al completar la reserva');
    } finally {
      setCompleting(false);
    }
  };

  // Abre el modal de confirmación
  const abrirModalConfirmacion = (reserva) => {
    setSelectedReserva(reserva);
    setModalOpen(true);
  };

  // Cierra el modal
  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedReserva(null);
  };

  // Carga inicial
  useEffect(() => {
    fetchReservasEnProgreso();
  }, []);

  if (loading) {
    return <div className="reservas-container"><p>Cargando reservas...</p></div>;
  }

  return (
    <div className="reservas-container">
      <h2 className="reservas-titulo">Reservas en Progreso</h2>

      {error && <div className="reservas-error">{error}</div>}

      {reservas.length === 0 ? (
        <p className="reservas-vacio">No hay reservas en progreso</p>
      ) : (
        <div className="reservas-lista">
          {reservas.map((reserva) => (
            <div key={reserva.id} className="reserva-item">
              {/* Indicador parpadeante */}
              <div className="reserva-indicador">
                <div className="indicador-circulo"></div>
              </div>

              {/* Contenido principal */}
              <div className="reserva-contenido">
                <div className="reserva-header">
                  <div className="reserva-info">
                    <p className="reserva-placa">{reserva.placa}</p>
                    <p className="reserva-vehiculo">
                      {reserva.marca} {reserva.modelo}
                    </p>
                    <p className="reserva-datetime">
                      {reserva.date} - {reserva.time}
                    </p>
                  </div>
                </div>

                <div className="reserva-servicios">
                  <strong>Servicios:</strong>
                  <ul className="servicios-lista">
                    {reserva.services && reserva.services.length > 0 ? (
                      reserva.services.map((service, index) => (
                        <li key={index}>{service.name}</li>
                      ))
                    ) : (
                      <li>Sin servicios</li>
                    )}
                  </ul>
                </div>

                <div className="reserva-detalles">
                  <p className="reserva-duracion">
                    Duración: {reserva.total_duration} min
                  </p>
                  <p className="reserva-precio">
                    Total: ${parseFloat(reserva.total_price).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {/* Botón de acción */}
              <button
                className="btn-completar"
                onClick={() => abrirModalConfirmacion(reserva)}
              >
                Completar Reserva
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {modalOpen && selectedReserva && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar Completar Reserva</h3>
            <p>¿Estás seguro de que deseas completar esta reserva?</p>

            <div className="modal-resumen">
              <p>
                <strong>Placa del Vehículo:</strong> {selectedReserva.placa}
              </p>
              <p>
                <strong>Vehículo:</strong> {selectedReserva.marca} {selectedReserva.modelo}
              </p>
              <p>
                <strong>Precio Total:</strong> $
                {parseFloat(selectedReserva.total_price).toLocaleString('es-CO')}
              </p>
              <p>
                <strong>Método de Pago:</strong> Efectivo
              </p>
            </div>

            <div className="modal-botones">
              <button
                className="btn-cancelar"
                onClick={cerrarModal}
                disabled={completing}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar"
                onClick={handleCompletarReserva}
                disabled={completing}
              >
                {completing ? 'Completando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
