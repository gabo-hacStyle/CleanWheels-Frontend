import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./FeedbackPage.css";

const API_BASE = "http://localhost:8080/api";
const STARS = [1, 2, 3, 4, 5];
const LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "¡Excelente!"];

const getErrorType = (msg = "") => {
  if (!msg) return "generic";
  if (msg.includes("Debe iniciar sesión") || msg.includes(`type bigint: "anonymous"`)) {
    return "auth";
  }
  if (/Solo se puede dejar feedback en reservas finalizadas/i.test(msg)) return "state";
  if (/No tienes permisos/i.test(msg)) return "permission";
  if (/Ya existe un feedback/i.test(msg)) return "duplicate";
  return "generic";
};

const getFriendlyErrorMessage = (msg = "", type = "generic") => {
  switch (type) {
    case "auth":
      return "Debe iniciar sesión con la cuenta dueña de la reserva para hacer feedback.";
    case "permission":
      return "Tu cuenta actual no coincide con el usuario dueño de esta reserva. Por favor, verifica tu sesión.";
    case "state":
      return "Esta reserva aún no ha sido finalizada. Solo puedes calificar el servicio una vez que concluya.";
    case "duplicate":
      return "Ya has registrado una opinión previamente para esta reserva.";
    default:
      return msg || "Ocurrió un inconveniente al enviar tu opinión. Por favor, intenta de nuevo.";
  }
};

const ERROR_CONFIG = {
  auth: { icon: "🔒", title: "Acceso Restringido" },
  state: { icon: "⏳", title: "Reserva no finalizada" },
  permission: { icon: "🚫", title: "Sin permisos" },
  duplicate: { icon: "✓", title: "Ya enviaste tu feedback" },
  generic: { icon: "!", title: "Error al enviar" },
};

export default function FeedbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userRole = payload.rol || payload.role || payload.roles;
        if (userRole === "guest" || payload.username === "anonymous" || payload.sub === "anonymous") {
          setError("Debe iniciar sesión con la cuenta dueña de la reserva para hacer feedback.");
        }
      } catch (e) {
        console.error("Error al verificar token", e);
      }
    }
  }, []);

  const handleGoogleLoginRedirect = () => {
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    navigate("/login"); 
  };

  const handleSubmit = async () => {
    if (!rating || getErrorType(error) === "auth") return;
    setSubmitting(true);
    setError(null);
    
    const cleanComment = comment.trim();
    
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/booking/feedback/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          rating, 
          feedback: cleanComment === "" ? "Sin comentarios" : cleanComment 
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      let errorMessage = `Error ${res.status}`;
      const contentType = res.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        const json = await res.json();
        errorMessage = json.message || json.error || json.exception || errorMessage;
      } else {
        errorMessage = await res.text();
      }

      throw new Error(errorMessage);

    } catch (e) {
      if (e.message === "Failed to fetch") {
        setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      } else {
        setError(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fb_page">
        <div className="fb_card fb_success_card">
          <div className="fb_success_icon">✓</div>
          <h2 className="fb_success_title">¡Gracias por tu feedback!</h2>
          <p className="fb_success_sub">Tu opinión nos ayuda a mejorar. ¡Hasta la próxima!</p>
          <div className="fb_success_badge">Reserva #{id} · Feedback enviado</div>
        </div>
      </div>
    );
  }

  const currentErrorType = getErrorType(error);

  return (
    <div className="fb_page">
      <div className="fb_card">
        <div className="fb_header">
          <div className="fb_header_icon">🚗</div>
          <div>
            <p className="fb_header_label">Reserva #{id}</p>
            <h1 className="fb_header_title">¿Cómo fue tu experiencia?</h1>
            <p className="fb_header_sub">Tu opinión nos ayuda a mejorar el servicio</p>
          </div>
        </div>

        <div className="fb_divider" />

        <div className="fb_section">
          <p className="fb_section_label">Calificación</p>
          <div className="fb_stars">
            {STARS.map((s) => (
              <button
                key={s}
                className={`fb_star ${s <= (hovered || rating) ? "fb_star_active" : ""}`}
                onClick={() => currentErrorType !== "auth" && setRating(s)}
                onMouseEnter={() => currentErrorType !== "auth" && setHovered(s)}
                onMouseLeave={() => currentErrorType !== "auth" && setHovered(0)}
                disabled={currentErrorType === "auth"}
                aria-label={`${s} estrella${s > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="fb_rating_label">
            {currentErrorType === "auth" ? "Función deshabilitada" : (LABELS[hovered || rating] || "Selecciona una puntuación")}
          </p>
        </div>

        <div className="fb_section">
          <p className="fb_section_label">
            Comentario <span className="fb_optional">(opcional)</span>
          </p>
          <textarea
            className="fb_textarea"
            placeholder={currentErrorType === "auth" ? "Inicia sesión para escribir un comentario..." : "¿Qué te pareció el servicio? ¿Algo que podamos mejorar?"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={currentErrorType === "auth"}
            rows={4}
          />
        </div>

        {error && (() => {
          const cfg = ERROR_CONFIG[currentErrorType];
          const friendlyMessage = getFriendlyErrorMessage(error, currentErrorType);
          return (
            <>
              <div className={`fb_error_box fb_error_${currentErrorType}`}>
                <span className="fb_error_icon">{cfg.icon}</span>
                <div>
                  <p className="fb_error_title">{cfg.title}</p>
                  <p className="fb_error_sub">{friendlyMessage}</p>
                </div>
              </div>

              {(currentErrorType === "auth" || currentErrorType === "permission") && (
                <button 
                  type="button"
                  className="fb_google_btn"
                  onClick={handleGoogleLoginRedirect}
                >
                  <svg className="fb_google_icon" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.33 0 3.33 2.69 1.386 6.614l3.88 3.151z"/>
                    <path fill="#34A853" d="M16.04 15.345c-1.073.73-2.418 1.164-4.04 1.164a7.077 7.077 0 0 1-6.734-4.855L1.386 14.8C3.33 18.722 7.33 21.41 12 21.41c2.945 0 5.718-1.055 7.782-2.89l-3.742-3.175z"/>
                    <path fill="#4285F4" d="M23.49 12.275c0-.827-.073-1.627-.21-2.4H12v4.545h6.455a5.522 5.522 0 0 1-2.415 3.63l3.742 3.174c2.185-2.02 3.708-4.99 3.708-8.95z"/>
                    <path fill="#FBBC05" d="M5.266 14.235A7.013 7.013 0 0 1 4.91 12c0-.79.13-1.555.356-2.235L1.386 6.614A11.944 11.944 0 0 0 0 12c0 1.92.455 3.736 1.386 5.386l3.88-3.151z"/>
                  </svg>
                  Continuar con Google
                </button>
              )}
            </>
          );
        })()}

        <button
          className="fb_submit"
          onClick={handleSubmit}
          disabled={!rating || submitting || currentErrorType === "auth"}
        >
          {submitting ? "Enviando..." : "Enviar feedback"}
        </button>
      </div>
    </div>
  );
}