import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Menu.css';

function Menu() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sesionActiva = sessionStorage.getItem('usuario');

    // Redirigir si intenta acceder a pantallas restringidas sin sesión
    if (!sesionActiva && !['/', '/register', '/login'].includes(location.pathname)) {
      navigate('/login');
    }

    // Redirigir usuarios con sesión activa si acceden a Welcome, Register o Login
    if (sesionActiva && ['/', '/register', '/login'].includes(location.pathname)) {
      navigate('/home');
    }
  }, [navigate, location]);

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const handleCerrarSesion = () => {
    sessionStorage.removeItem('usuario');
    navigate('/');
  };

  const sesionActiva = sessionStorage.getItem('usuario');
  if (!sesionActiva) return null;

  return (
    <div className="menu-wrapper">
      <button className="menu-button" onClick={toggleMenu} style={{ position: 'fixed', zIndex: 1100 }}>☰ Menú</button>
      <div className={`menu-lateral ${menuAbierto ? 'abierto' : 'cerrado'}`}>
        <button className="cerrar-sesion" onClick={handleCerrarSesion}>Cerrar Sesión</button>
      </div>
    </div>
  );
}

export default Menu;