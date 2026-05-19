import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Callback.css";

function Callback() {
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      setStatus("cancelled");
      return;
    }

    const fetchToken = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/auth/google/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();

        localStorage.setItem("token", data.token);
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        localStorage.setItem("user", JSON.stringify(payload));

        const redirect = localStorage.getItem("redirectAfterLogin");
        localStorage.removeItem("redirectAfterLogin");

        if (redirect) {
          navigate(redirect);
        } else if (payload.rol === "ADMIN") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        setStatus("error");
      }
    };

    fetchToken();
  }, []);

  if (status === "loading") {
    return (
      <div className="cb_page">
        <div className="cb_card">
          <div className="cb_spinner" />
          <p className="cb_title">Autenticando...</p>
          <p className="cb_sub">Estamos verificando tu cuenta de Google</p>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="cb_page">
        <div className="cb_card">
          <div className="cb_icon cb_icon_warn">✕</div>
          <p className="cb_title">Inicio de sesión cancelado</p>
          <p className="cb_sub">Cancelaste el acceso con Google. Puedes intentarlo de nuevo.</p>
          <button className="cb_btn" onClick={() => navigate("/login")}>
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="cb_page">
        <div className="cb_card">
          <div className="cb_icon cb_icon_err">!</div>
          <p className="cb_title">Error al iniciar sesión</p>
          <p className="cb_sub">Algo salió mal. Intenta de nuevo o contacta soporte.</p>
          <button className="cb_btn" onClick={() => navigate("/login")}>
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }
}

export default Callback;