import Sidebar from "./components/sidebar/Sidebar.jsx"
import Reservas from "../dashboard/components/reservas/Reservas.jsx"
import Vehiculos from "./components/vehiculos/vehiculos.jsx"
import Reportes from "./components/reportes/Reportes.jsx"
import Feedback from "./components/feedback/Feedback.jsx"
import Servicios from "./components/servicios/Servicios.jsx"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Admin.css"

const PAGES = {
  reservas: <Reservas />,
  vehiculos: <Vehiculos />,
  reportes: <Reportes />,
  feedback: <Feedback />,
  servicios: <Servicios />
}

export default function Admin() {
  const [activePage, setActivePage] = useState("reservas")
  const navigate = useNavigate()

  const handleLogout = async () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    try {
      const res = await fetch("http://localhost:8080/api/auth/guest", { method: "POST" })
      const data = await res.json()
      const token = data.token?.token || data.token
      if (token) localStorage.setItem("token", token)
    } catch (err) {
      console.error("Error generando token guest:", err)
    }

    navigate("/")
  }

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} />
      <main className="app-main">
        {PAGES[activePage]}
      </main>
    </div>
  )
}