import loginImg from "../../assets/bluehellcat.jpg";
import Navbar from "../../components/navbar/Navbar";
import "./Login.css";
import googleLogo from "../../assets/google_icon.svg";
import { useState } from "react";
import {BACKEND_URL} from "../../url";

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/google/url`);

      if (!response.ok) {
        throw new Error("Error al obtener la URL de Google");
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("URL inválida");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar sesión con Google");
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="login_container">
        <div className="img_container">
          <img src={loginImg} alt="Login" className="login_img" />
        </div>

        <div className="aouth_container">
          <h1 className="login_title">Bienvenido :D</h1>

          <p>
            El mejor servicio para tu vehículo lo puedes encontrar aquí.
            Para acceder, inicia sesión con tu cuenta de Google.
          </p>

          {error && (
            <p style={{ color: "red", fontSize: "0.85rem" }}>
              {error}
            </p>
          )}

          <button
            className="login_btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img
              src={googleLogo}
              alt="Google"
              className="google_icon_fa"
            />

            <span>
              {loading ? "Redirigiendo..." : "Continuar con Google"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

export default Login;