import React,{useState} from 'react'
import { useNavigate } from "react-router-dom"
import './Herobanner.css'


const Herobanner = () => {
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
    <div className='hero-section'>
        <div className='hero-left'>
            <h1>El cuidado que tu vehiculo necesita</h1>
            <span>Limpieza, lavado, encerado y mucho mas</span>
            <button className='agendar' onClick={handleAgendar}>Agendar ya</button>
        </div>
        <div className='hero-right'>
            <img src="src/assets/gt_car.jpeg" alt="reactlogo" />
        </div>
    </div>
  )
}

export default Herobanner