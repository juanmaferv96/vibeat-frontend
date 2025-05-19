import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Collapse, ListGroup } from 'react-bootstrap';
import axios from 'axios';

function MisEventos() {
  const [eventos, setEventos] = useState([]);
  const [mostrarTerminados, setMostrarTerminados] = useState(false);
  const [eventosVisibles, setEventosVisibles] = useState([]);
  const [tipoUsuario, setTipoUsuario] = useState('usuario');

  useEffect(() => {
    const tipo = localStorage.getItem('tipoUsuario');
    const id = localStorage.getItem('entidad_id');
    setTipoUsuario(tipo);

    const fetchEventos = async () => {
      try {
        const url = tipo === 'empresa'
        ? '/api/eventos-oficiales'
        : '/api/eventos-no-oficiales';

        

        const response = await axios.get(url);
        const filtrados = response.data.filter(evento =>
          (tipo === 'empresa' ? evento.empresaId : evento.usuarioId) === parseInt(id)
        );

        const ordenados = filtrados.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
        setEventos(ordenados);
      } catch (error) {
        console.error('Error al cargar eventos:', error);
      }
    };

    fetchEventos();
  }, []);

  useEffect(() => {
    const ahora = new Date();
    const visibles = eventos.filter(e => mostrarTerminados || new Date(e.fechaFin) >= ahora);
    setEventosVisibles(visibles);
  }, [eventos, mostrarTerminados]);

  return (
    <Container className="py-5" style={{ backgroundColor: '#eaf2fb' }}>
      <h2 className="text-primary text-center mb-4">Mis eventos</h2>

      <div className="mb-4">
        <h4>Eventos propios</h4>
        {eventos.length === 0 ? (
          <p className="text-muted">Aún no has creado ningún evento</p>
        ) : (
          <>
            {eventos.some(e => new Date(e.fechaFin) < new Date()) && (
              <Button
                variant="outline-primary"
                size="sm"
                className="mb-3"
                onClick={() => setMostrarTerminados(!mostrarTerminados)}
              >
                {mostrarTerminados ? 'Ocultar eventos terminados' : 'Mostrar eventos terminados'}
              </Button>
            )}

            <ListGroup>
              {eventosVisibles.map((evento, index) => (
                <ListGroup.Item key={index} className="d-flex flex-column align-items-start">
                  <strong>{evento.nombre} - {evento.lugar} ({new Date(evento.fechaInicio).toLocaleDateString()} - {new Date(evento.fechaFin).toLocaleDateString()})</strong>
                  <small className="text-muted mt-1">{evento.descripcion}</small>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </div>

      <div>
        <h4>Entradas para eventos</h4>
        <p className="text-muted">Aún no has adquirido ninguna entrada</p>
      </div>
    </Container>
  );
}

export default MisEventos;
