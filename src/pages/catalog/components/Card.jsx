import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
function Card(props) {
    const [active, setActive] = useState("Inicio");
    const navigate = useNavigate();

    const handleAgendar = () => {
        const token = localStorage.getItem("token")
        if (!token) {
            navigate("/login")
            return
        }
        try {
            const payload = JSON.parse(atob(token.split(".")[1]))
            if (payload.rol === "ADMIN") {
                navigate("/admin")
            } else if (payload.rol === "CLIENT") {
                navigate("/dashboard")
            } else {
                navigate("/login")
            }
        } catch {
            navigate("/login")
        }
    }
  return (
    <div className="tarjeta" onClick={handleAgendar}>
      <div className="tarjeta_img_container">
        <img src={props.imagen} alt={props.name} className="tarjeta_img" />
      </div>
      <div className="tarjeta_content">
        <h3>{props.name}</h3>
        <p>{props.description}</p>
        <p>Duración: {props.duration} min</p>
        <p className="tarjeta_precio">Precio: ${props.price}</p>
      </div>
    </div>
  );
}

export default Card;