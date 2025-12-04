import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Button, Container, Form, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
//import axios from 'axios';
import apiClient from '../api/apiClient';

function NavigationBar() {
  const navigate = useNavigate();
  const sesionActiva = localStorage.getItem('usuario');
  const [busqueda, setBusqueda] = useState('');
  const [oficialesEncontrados, setOficialesEncontrados] = useState([]);
  const [noOficialesEncontrados, setNoOficialesEncontrados] = useState([]);

  useEffect(() => {
    const buscarEventos = async () => {
      if (busqueda.trim() === '') {
        setOficialesEncontrados([]);
        setNoOficialesEncontrados([]);
        return;
      }
      try {
        const [oficiales, noOficiales] = await Promise.all([
          apiClient.get('/eventos-oficiales'),
          apiClient.get('/eventos-no-oficiales')
        ]);

        const filtradosOficiales = oficiales.data.filter(evento =>
          evento.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
        const filtradosNoOficiales = noOficiales.data.filter(evento =>
          evento.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );

        setOficialesEncontrados(filtradosOficiales);
        setNoOficialesEncontrados(filtradosNoOficiales);
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

        <Form className="mx-auto w-50 position-relative">
          <Form.Control
            type="search"
            placeholder="Buscar eventos por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {(busqueda && (oficialesEncontrados.length > 0 || noOficialesEncontrados.length > 0)) && (
            <div className="position-absolute bg-white border rounded w-100 mt-1 z-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {oficialesEncontrados.length > 0 && (
                <>
                  <div
                    className="fw-bold px-3 py-2 border-bottom"
                    style={{ backgroundColor: '#e6f0ff', color: '#003366' }}
                  >
                    Eventos oficiales
                  </div>
                  {oficialesEncontrados.map((evento, idx) => (
                    <div
                      key={`of-${idx}`}
                      className="px-3 py-2 border-bottom"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        navigate(`/informacion-evento/oficial/${evento.id}`);
                        setBusqueda('');
                      }}
                    >
                      {evento.nombre}
                    </div>
                  ))}
                </>
              )}
              {noOficialesEncontrados.length > 0 && (
                <>
                  <div
                    className="fw-bold px-3 py-2 border-bottom"
                    style={{ backgroundColor: '#e6f0ff', color: '#003366' }}
                  >
                    Eventos no oficiales
                  </div>
                  {noOficialesEncontrados.map((evento, idx) => (
                    <div
                      key={`no-${idx}`}
                      className="px-3 py-2 border-bottom"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        navigate(`/informacion-evento/no-oficial/${evento.id}`);
                        setBusqueda('');
                      }}
                    >
                      {evento.nombre}
                    </div>
                  ))}
                </>
              )}
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
