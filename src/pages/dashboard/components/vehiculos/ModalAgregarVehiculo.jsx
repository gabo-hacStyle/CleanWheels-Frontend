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

const OTRA_MARCA = "OTRA_MARCA";

const MARCAS_CARROS = [
  "Chevrolet",
  "Renault",
  "Mazda",
  "Kia",
  "Toyota",
  "Hyundai",
  "Nissan",
  "Ford",
  "Volkswagen",
  "Honda",
  "Suzuki",
  "Mitsubishi",
  "Jeep",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Peugeot",
  "Fiat",
  "Subaru",
  "Tesla",
];

const MARCAS_MOTOS = [
  "Honda",
  "Yamaha",
  "Suzuki",
  "Kawasaki",
  "AKT",
  "TVS",
  "Hero",
  "Bajaj",
  "Royal Enfield",
  "KTM",
  "Ducati",
  "BMW",
  "Harley-Davidson",
  "Benelli",
  "CF Moto",
  "Bera",
  "Auteco",
  "UM",
  "Italika",
  "Piaggio",
];

function isPlacaCarroValida(placa) {
  return /^[A-Z]{3}[0-9]{3}$/.test(placa);
}

function isPlacaMotoValida(placa) {
  return /^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(placa);
}

export default function ModalAgregarVehiculo({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [tipo, setTipo] = useState(1);

  const [formData, setFormData] = useState({
    placa: "",
    marca: "",
    modelo: "",
  });

  const [otraMarca, setOtraMarca] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [marcaOpen, setMarcaOpen] = useState(false);

  const marcaRef = useRef(null);

  const MARCAS = [
    ...(tipo === 1 ? MARCAS_CARROS : MARCAS_MOTOS),
    OTRA_MARCA,
  ];

  useEffect(() => {
    const handler = (e) => {
      if (marcaRef.current && !marcaRef.current.contains(e.target)) {
        setMarcaOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetForm = () => {
    setFormData({
      placa: "",
      marca: "",
      modelo: "",
    });

    setOtraMarca("");
    setError("");
    setMarcaOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTipoChange = (nuevoTipo) => {
    setTipo(nuevoTipo);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handlePlacaChange = (e) => {
    const raw = e.target.value.toUpperCase();

    if (raw.length <= formData.placa.length) {
      setFormData(prev => ({
        ...prev,
        placa: raw.slice(0, 6),
      }));

      if (error) setError("");

      return;
    }

    const pos = formData.placa.length;
    const newChar = raw[raw.length - 1];

    let accepted = false;

    if (tipo === 1) {
      if (pos < 3 && /[A-Z]/.test(newChar)) accepted = true;
      if (pos >= 3 && pos < 6 && /[0-9]/.test(newChar)) accepted = true;
    } else {
      if (pos < 3 && /[A-Z]/.test(newChar)) accepted = true;
      if (pos >= 3 && pos < 5 && /[0-9]/.test(newChar)) accepted = true;
      if (pos === 5 && /[A-Z0-9]/.test(newChar)) accepted = true;
    }

    if (accepted) {
      setFormData(prev => ({
        ...prev,
        placa: prev.placa + newChar,
      }));
    }

    if (error) setError("");
  };

  const getPlacaHint = () => {
    if (tipo === 1) {
      return `3 letras + 3 números · Ej: ABC123 · ${formData.placa.length}/6`;
    }

    return `3 letras + 2 números + letra o número · Ej: ABC12D / ABC123 · ${formData.placa.length}/6`;
  };

  const getPlacaPlaceholder = () => {
    return tipo === 1
      ? "Ej: ABC123"
      : "Ej: ABC12D o ABC123";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.placa.trim()) {
      setError("La placa es requerida");
      return;
    }

    if (tipo === 1 && !isPlacaCarroValida(formData.placa)) {
      setError(
        "La placa de carro debe tener el formato ABC123 (3 letras y 3 números)"
      );
      return;
    }

    if (tipo === 2 && !isPlacaMotoValida(formData.placa)) {
      setError(
        "La placa de moto debe tener el formato ABC12D (3 letras, 2 números y 1 letra)"
      );
      return;
    }

    const marcaFinal =
      formData.marca === OTRA_MARCA
        ? otraMarca.trim()
        : formData.marca.trim();

    if (!marcaFinal) {
      setError("La marca es requerida");
      return;
    }

    if (!formData.modelo.trim()) {
      setError("El modelo es requerido");
      return;
    }

    const userId = getUserIdFromToken();

    if (!userId) {
      setError(
        "No se pudo identificar al usuario. Inicia sesión nuevamente."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getAuthToken();

      const response = await fetch(
        `${API_BASE}/vehicles/${userId}/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            placa: formData.placa.toUpperCase().trim(),
            marca: marcaFinal,
            modelo: formData.modelo.trim(),
            tipo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      if (!data.success) {
        throw new Error(
          data.message || "Error al registrar el vehículo"
        );
      }

      onSuccess?.(data.data);

      handleClose();
    } catch (err) {
      console.error("Error al agregar vehículo:", err);

      setError(
        err.message || "Ocurrió un error al registrar el vehículo"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Agregar Nuevo Vehículo</h2>

          <button
            className="modal-close"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="modal-error">{error}</div>
            )}

            <div className="form-group">
              <label>Tipo de vehículo</label>

              <div className="tipo-selector">
                <button
                  type="button"
                  className={`tipo-btn ${tipo === 1 ? "active" : ""}`}
                  onClick={() => handleTipoChange(1)}
                >
                  <span className="tipo-icon">🚗</span>
                  <span>Carro</span>
                </button>

                <button
                  type="button"
                  className={`tipo-btn ${tipo === 2 ? "active" : ""}`}
                  onClick={() => handleTipoChange(2)}
                >
                  <span className="tipo-icon">🏍️</span>
                  <span>Moto</span>
                </button>
              </div>
            </div>

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
                placeholder={getPlacaPlaceholder()}
                autoComplete="off"
                className={
                  error &&
                  error.toLowerCase().includes("placa")
                    ? "error-input"
                    : ""
                }
              />

              <small className="input-hint">
                {getPlacaHint()}
              </small>
            </div>

            <div className="form-group">
              <label>
                Marca <span className="required">*</span>
              </label>

              <div
                className={`marca-dropdown${
                  marcaOpen ? " open" : ""
                }${
                  error &&
                  error.toLowerCase().includes("marca")
                    ? " error-input"
                    : ""
                }`}
                ref={marcaRef}
              >
                <button
                  type="button"
                  className="marca-trigger"
                  onClick={() => setMarcaOpen(o => !o)}
                >
                  <span className={formData.marca ? "" : "placeholder"}>
                    {formData.marca === OTRA_MARCA
                      ? "Otra marca"
                      : formData.marca || "Selecciona una marca"}
                  </span>

                  <svg
                    className="marca-chevron"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {marcaOpen && (
                  <ul className="marca-list">
                    {MARCAS.map(m => (
                      <li
                        key={m}
                        className={`marca-option${
                          formData.marca === m
                            ? " selected"
                            : ""
                        }`}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            marca: m,
                          }));

                          if (m !== OTRA_MARCA) {
                            setOtraMarca("");
                          }

                          setMarcaOpen(false);

                          if (error) setError("");
                        }}
                      >
                        {m === OTRA_MARCA ? "Otra marca" : m}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {formData.marca === OTRA_MARCA && (
              <div className="form-group">
                <label htmlFor="otraMarca">
                  Escribe la marca
                  <span className="required">*</span>
                </label>

                <input
                  type="text"
                  id="otraMarca"
                  value={otraMarca}
                  onChange={(e) => {
                    setOtraMarca(e.target.value);

                    if (error) setError("");
                  }}
                  placeholder="Ej: McLaren, Aprilia, BYD..."
                  autoComplete="off"
                />
              </div>
            )}

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
                placeholder={
                  tipo === 1
                    ? "Ej: Corolla 2020, Civic, Spark"
                    : "Ej: CB 190R, FZ25, Pulsar NS200"
                }
                autoComplete="off"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading
                ? "Registrando..."
                : `Registrar ${tipo === 1 ? "Carro" : "Moto"}`}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}