import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar";
import Reservas from "./components/reservas/Reservas";
import Vehiculos from "./components/vehiculos/Vehiculos";
import "./Dashboard.css";

const PAGES = {
  reservas: <Reservas />,
  dashboard: <Vehiculos />,
};

export default function Dashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();

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
  );
}