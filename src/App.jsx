import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Welcome from './pages/Welcome';
import Register from './pages/Register';
import Login from './pages/Login';
import NavigationBar from './components/NavigationBar';
import FormularioEventoOficial from './pages/FormularioEventoOficial';
import FormularioEventoNoOficial from './pages/FormularioEventoNoOficial';
import MisEventos from './pages/MisEventos';
import InformacionEvento from './pages/InformacionEvento';
import CompraEntradas from './pages/CompraEntradas';

import { Container } from 'react-bootstrap';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sesionActiva = localStorage.getItem('usuario');

    if (!sesionActiva && !['/', '/register', '/login'].includes(location.pathname)) {
      navigate('/login');
    }

    if (sesionActiva && ['/', '/register', '/login'].includes(location.pathname)) {
      navigate('/home');
    }
  }, [navigate, location]);

  const sesionActiva = localStorage.getItem('usuario');

  return (
    <div className="app-container d-flex flex-column vh-100">
      {sesionActiva && <NavigationBar />}
      <div className="flex-grow-1">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Welcome />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/formulario-evento-oficial" element={<FormularioEventoOficial />} />
          <Route path="/formulario-evento-no-oficial" element={<FormularioEventoNoOficial />} />
          <Route path="/mis-eventos" element={<MisEventos />} />
          <Route path="/informacion-evento/:tipo/:id" element={<InformacionEvento />} />
          <Route
            path="/compra-entrada/:tipo/:eventoId/:nombreEntrada"
            element={<CompraEntradas />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
