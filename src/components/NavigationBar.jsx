import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Button, Container, Form, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';

function NavigationBar() {
  const navigate = useNavigate();
  const sesionActiva = localStorage.getItem('usuario');
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    const buscarEventos = async () => {
      if (busqueda.trim() === '') {
        setResultados([]);
        return;
      }
      try {
        const [oficiales, noOficiales] = await Promise.all([
          axios.get('/api/eventos-oficiales'),
          axios.get('/api/eventos-no-oficiales')
        ]);


        const coincidencias = [...oficiales.data, ...noOficiales.data].filter(evento =>
          evento.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );

        setResultados(coincidencias);
      } catch (error) {
        console.error('Error al buscar eventos:', error);
      }
    };
    buscarEventos();
  }, [busqueda]);

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('entidad_id');
    localStorage.removeItem('tipoUsuario');
    navigate('/');
  };

  if (!sesionActiva) return null;

  return (
    <Navbar bg="light" expand="lg" className="mb-4 border-bottom px-3">
      <Container fluid>
        <Navbar.Brand style={{ color: '#4a90e2', cursor: 'pointer' }} onClick={() => navigate('/home')}>
          Vibeat
        </Navbar.Brand>

        <Form className="mx-auto w-50">
          <Form.Control
            type="search"
            placeholder="Buscar eventos por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && resultados.length > 0 && (
            <div className="position-absolute bg-white border rounded w-50 mt-1 z-3">
              {resultados.map((evento, idx) => (
                <div key={idx} className="px-3 py-2 border-bottom">
                  {evento.nombre}
                </div>
              ))}
            </div>
          )}
        </Form>

        <Dropdown align="end">
          <Dropdown.Toggle variant="light" id="dropdown-user">
            <FaUserCircle size={28} color="#4a90e2" />
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={() => navigate('/perfil')}>Mi perfil</Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/mis-eventos')}>Mis eventos</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleCerrarSesion}>Cerrar sesión</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;