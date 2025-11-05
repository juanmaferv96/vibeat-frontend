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
import ResumenCompraEntrada from './pages/ResumenCompraEntrada';

// Pequeño wrapper visual para garantizar 100% de alto/ancho de cada pantalla sin tocar su lógica
const FullHeight = ({ children }) => (
  <div
    className="d-flex flex-column w-100 h-100"
    style={{ minHeight: '100%', minWidth: '100%' }}
  >
    {children}
  </div>
);

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mantiene el flujo de navegación existente
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

  // Ajustes puramente visuales de layout para ocupar ancho/alto completo y evitar scroll horizontal
  useEffect(() => {
    // Guardamos estilos previos para restaurar al desmontar
    const prevHtmlOverflowX = document.documentElement.style.overflowX;
    const prevBodyOverflowX = document.body.style.overflowX;
    const prevBodyWidth = document.body.style.width;
    const prevBodyMargin = document.body.style.margin;

    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.body.style.width = '100%';
    document.body.style.margin = '0';

    return () => {
      document.documentElement.style.overflowX = prevHtmlOverflowX;
      document.body.style.overflowX = prevBodyOverflowX;
      document.body.style.width = prevBodyWidth;
      document.body.style.margin = prevBodyMargin;
    };
  }, []);

  return (
    <div
      className="app-container d-flex flex-column"
      // 100svh trata mejor las barras del navegador móvil; minWidth y overflowX evitan desplazamiento lateral
      style={{
        minHeight: '100svh',
        minWidth: '100%',
        width: '100%',
        overflowX: 'hidden'
      }}
    >
      {sesionActiva && <NavigationBar />}

      {/* Este contenedor crece para llenar el alto restante debajo de la barra */}
      <div className="flex-grow-1 d-flex" style={{ minHeight: 0 }}>
        {/* Este wrapper asegura que las rutas ocupen TODO el alto y ancho disponibles */}
        <div className="flex-grow-1 d-flex flex-column w-100 h-100" style={{ minHeight: '100%' }}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<FullHeight><Welcome /></FullHeight>} />
            <Route path="/register" element={<FullHeight><Register /></FullHeight>} />
            <Route path="/login" element={<FullHeight><Login /></FullHeight>} />
            <Route path="/home" element={<FullHeight><Home /></FullHeight>} />
            <Route
              path="/formulario-evento-oficial"
              element={<FullHeight><FormularioEventoOficial /></FullHeight>}
            />
            <Route
              path="/formulario-evento-no-oficial"
              element={<FullHeight><FormularioEventoNoOficial /></FullHeight>}
            />
            <Route path="/mis-eventos" element={<FullHeight><MisEventos /></FullHeight>} />
            <Route
              path="/informacion-evento/:tipo/:id"
              element={<FullHeight><InformacionEvento /></FullHeight>}
            />
            <Route
              path="/compra-entrada/:tipo/:eventoId/:nombreEntrada"
              element={<FullHeight><CompraEntradas /></FullHeight>}
            />
            <Route
              path="/resumen-compra"
              element={<FullHeight><ResumenCompraEntrada /></FullHeight>}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
