import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/home/Home'
import Dashboard from './pages/dashboard/Dashboard'
import Login from './pages/login/Login'
import Catalog from './pages/catalog/Catalog'
import Admin from './pages/admin/Admin'
import Callback from './pages/callback/Callback'
import ProtectedRoute from './components/ProtectedRoute'
import FeedbackPage from "./pages/FeedbackPage/FeedbackPage";

export default function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      fetch("http://localhost:8080/api/auth/guest", { method: "POST" })
        .then(res => res.json())
        .then(data => {
          const token = data.token?.token || data.token;
          if (token) localStorage.setItem("token", token);
        })
        .catch(err => console.error("Error generando token guest:", err));
    }
  }, []);

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