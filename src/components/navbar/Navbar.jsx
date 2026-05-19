import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import Logo from '../../assets/CleanWheels.svg'
import './Navbar.css'

const Navbar = () => {
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
        <nav className="navbar">
            <div className="navbar-left">
                <div className="logo" onClick={() => navigate("/")}>
                    <img src={Logo} alt="Logo" />
                </div>
            </div>  
            <div className="navbar-middle">
                <ul className="nav-links">
                    <li
                        className={active === "Inicio" ? "active" : ""}
                        onClick={() => { setActive("Inicio"); navigate("/"); }}
                    >
                        Inicio
                    </li>
                </ul>
            </div>
            <div className="navbar-right">
                <div className="btn-catalogo" onClick={() => navigate("/catalog")}>
                    <p>Catalogo</p>
                </div>
                <div className="btn-login" onClick={handleAgendar}>
                    <p>Agendar</p>
                </div>
            </div>
        </nav>
    )
}

export default Navbar