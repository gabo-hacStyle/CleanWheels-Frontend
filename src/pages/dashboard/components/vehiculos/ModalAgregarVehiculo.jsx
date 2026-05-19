import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./ModalAgregarVehiculo.css";

const getAuthToken = () => localStorage.getItem("token");

const getUserIdFromToken = () => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || payload.id || payload.sub;
  } catch (e) {
    console.error("Error decodificando token:", e);
    return null;
  }
};

const API_BASE = "http://localhost:8080/api/booking";

const MARCAS_POPULARES = [
  "Chevrolet", "Renault", "Mazda", "Kia", "Toyota",
  "Hyundai", "Nissan", "Ford", "Volkswagen", "Honda",
  "Suzuki", "Mitsubishi", "Jeep", "BMW", "Mercedes-Benz",
  "Audi", "Peugeot", "Fiat", "Subaru", "Tesla",
];

export default function ModalAgregarVehiculo({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData]     = useState({ placa: "", marca: "", modelo: "" });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [marcaOpen, setMarcaOpen]   = useState(false);
  const marcaRef                    = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (marcaRef.current && !marcaRef.current.contains(e.target)) {
        setMarcaOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetForm = () => { setFormData({ placa: "", marca: "", modelo: "" }); setError(""); };
  const handleClose = () => { resetForm(); onClose(); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Placa: exactamente 3 letras seguidas de 3 números (ej: ABC123)
  const handlePlacaChange = (e) => {
    const raw = e.target.value.toUpperCase();

    // Separar lo que ya hay en el estado actual
    const currentLetters = formData.placa.slice(0, 3);
    const currentDigits  = formData.placa.slice(3);

    // Si el nuevo valor es más corto (el usuario borró), recortar normalmente
    if (raw.length <= formData.placa.length) {
      setFormData(prev => ({ ...prev, placa: raw.slice(0, 6) }));
      if (error) setError("");
      return;
    }

    // Caracter nuevo que se está agregando
    const newChar = raw[raw.length - 1];

    if (currentLetters.length < 3) {
      // Posición de letras: solo aceptar A-Z
      if (/[A-Z]/.test(newChar)) {
        setFormData(prev => ({ ...prev, placa: currentLetters + newChar + currentDigits }));
      }
    } else {
      // Posición de números: solo aceptar 0-9
      if (/[0-9]/.test(newChar) && currentDigits.length < 3) {
        setFormData(prev => ({ ...prev, placa: currentLetters + currentDigits + newChar }));
      }
    }

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.placa.trim())  { setError("La placa es requerida"); return; }
    if (!/^[A-Z]{3}[0-9]{3}$/.test(formData.placa)) { setError("La placa debe tener el formato ABC123 (3 letras y 3 números)"); return; }
    if (!formData.marca.trim())  { setError("La marca es requerida"); return; }
    if (!formData.modelo.trim()) { setError("El modelo es requerido"); return; }

    const userId = getUserIdFromToken();
    if (!userId) { setError("No se pudo identificar al usuario. Inicia sesión nuevamente."); return; }

    setLoading(true);
    setError("");

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/vehicles/${userId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          placa:  formData.placa.toUpperCase().trim(),
          marca:  formData.marca.trim(),
          modelo: formData.modelo.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Error ${response.status}`);
      if (!data.success) throw new Error(data.message || "Error al registrar el vehículo");

      onSuccess?.(data.data);
      handleClose();
    } catch (err) {
      console.error("Error al agregar vehículo:", err);
      setError(err.message || "Ocurrió un error al registrar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2>Agregar Nuevo Vehículo</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="modal-error">{error}</div>}

            {/* Placa */}
            <div className="form-group">
              <label htmlFor="placa">
                Placa <span className="required">*</span>
              </label>
              <input
                type="text"
                id="placa"
                name="placa"
                value={formData.placa}
                onChange={handlePlacaChange}
                placeholder="Ej: ABC123"
                autoComplete="off"
                className={error && error.toLowerCase().includes("placa") ? "error-input" : ""}
              />
              <small className="input-hint">
                3 letras + 3 números · {formData.placa.length}/6
              </small>
            </div>

            {/* Marca — dropdown custom (siempre abre hacia abajo) */}
            <div className="form-group">
              <label>Marca <span className="required">*</span></label>
              <div
                className={`marca-dropdown${marcaOpen ? " open" : ""}${error && error.toLowerCase().includes("marca") ? " error-input" : ""}`}
                ref={marcaRef}
              >
                <button
                  type="button"
                  className="marca-trigger"
                  onClick={() => setMarcaOpen(o => !o)}
                >
                  <span className={formData.marca ? "" : "placeholder"}>
                    {formData.marca || "Selecciona una marca"}
                  </span>
                  <svg className="marca-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {marcaOpen && (
                  <ul className="marca-list">
                    {MARCAS_POPULARES.map(m => (
                      <li
                        key={m}
                        className={`marca-option${formData.marca === m ? " selected" : ""}`}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, marca: m }));
                          setMarcaOpen(false);
                          if (error) setError("");
                        }}
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Modelo */}
            <div className="form-group">
              <label htmlFor="modelo">
                Modelo <span className="required">*</span>
              </label>
              <input
                type="text"
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ej: Corolla 2020, Civic, Model X"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Vehículo"}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}