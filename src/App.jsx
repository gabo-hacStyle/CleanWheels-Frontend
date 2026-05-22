import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/home/Home'
import Dashboard from './pages/dashboard/Dashboard'
import Login from './pages/login/Login'
import Catalog from './pages/catalog/Catalog'
import Admin from './pages/admin/Admin'
import Callback from './pages/callback/Callback'
import ProtectedRoute from './components/ProtectedRoute'
import FeedbackPage from "./pages/FeedbackPage/FeedbackPage";

import { BACKEND_URL as API_BASE } from './url';
export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          const res = await fetch(`${API_BASE}/auth/guest`, { method: "POST" });
          const data = await res.json();
          const newToken = data.token?.token || data.token;
          if (newToken) {
            localStorage.setItem("token", newToken);
          }
        }
      } catch (err) {
        console.error("Error generando token guest:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeToken();
  }, []);

  // No renderizar nada mientras se obtiene el token
  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/google/callback" element={<Callback />} />
        <Route path="/feedback/:id" element={<FeedbackPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["CLIENT"]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}