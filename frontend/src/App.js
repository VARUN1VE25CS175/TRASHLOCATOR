import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MapView from "@/components/MapView";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Check if admin is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const handleAdminLogin = (token) => {
    localStorage.setItem('adminToken', token);
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminAuthenticated(false);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route 
            path="/admin/login" 
            element={
              isAdminAuthenticated ? 
                <Navigate to="/admin/dashboard" /> : 
                <AdminLogin onLogin={handleAdminLogin} />
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              isAdminAuthenticated ? 
                <AdminDashboard onLogout={handleAdminLogout} /> : 
                <Navigate to="/admin/login" />
            } 
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;