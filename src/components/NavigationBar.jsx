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
  const [noOficialesEncontrados, setNoOficialesEncontrados] = useState([]);

  // Función auxiliar para determinar el estado del evento
  const getEstadoEvento = (inicio, fin) => {
    const ahora = new Date();
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    if (ahora > fechaFin) return 'FINALIZADO';
    if (ahora >= fechaInicio && ahora <= fechaFin) return 'EN_CURSO';
    return 'FUTURO';
  };

  useEffect(() => {
    const buscarEventos = async () => {
      if (busqueda.trim() === '') {
        setNoOficialesEncontrados([]);
        return;
      }
      try {
        const response = await apiClient.get('/eventos-no-oficiales');
        
        // 1. Filtramos por nombre
        let filtrados = response.data.filter(evento =>
          evento.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );

        // 2. Ordenamos: En curso -> Futuros -> Finalizados
        filtrados.sort((a, b) => {
          const estadoA = getEstadoEvento(a.fechaInicio, a.fechaFin);
          const estadoB = getEstadoEvento(b.fechaInicio, b.fechaFin);

          const prioridades = {
            'EN_CURSO': 1,
            'FUTURO': 2,
            'FINALIZADO': 3
          };

          return prioridades[estadoA] - prioridades[estadoB];
        });

        setNoOficialesEncontrados(filtrados);
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

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
          
          {(busqueda && noOficialesEncontrados.length > 0) && (
            <div className="position-absolute bg-white border rounded w-100 mt-1 z-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {noOficialesEncontrados.map((evento, idx) => {
                const estado = getEstadoEvento(evento.fechaInicio, evento.fechaFin);
                
                // Determinar estilos y texto según estado
                let backgroundColor = 'white'; // Por defecto (FUTURO)
                let textoDerecha = null;

                if (estado === 'FINALIZADO') {
                  backgroundColor = '#ffe6e6'; // Rojo suave
                  textoDerecha = <span className="fw-bold text-danger">Finalizado</span>;
                } else if (estado === 'EN_CURSO') {
                  backgroundColor = '#fff3cd'; // Naranja/Amarillo suave
                  textoDerecha = <span className="fw-bold text-warning-emphasis">Evento en curso</span>;
                }

                return (
                  <div
                    key={`no-${idx}`}
                    className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center"
                    style={{ 
                      cursor: 'pointer', 
                      backgroundColor: backgroundColor 
                    }}
                    onClick={() => {
                      navigate(`/informacion-evento/no-oficial/${evento.id}`);
                      setBusqueda('');
                    }}
                  >
                    {/* Parte izquierda: Nombre - Fecha */}
                    <div>
                      <span className="fw-bold">{evento.nombre}</span> - {formatearFecha(evento.fechaInicio)}
                    </div>
                    
                    {/* Parte derecha: Estado (si corresponde) */}
                    {textoDerecha && (
                      <div className="ms-3">
                        {textoDerecha}
                      </div>
                    )}
                  </div>
                );
              })}
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