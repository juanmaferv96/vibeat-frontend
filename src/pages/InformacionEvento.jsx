import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { FaCog } from 'react-icons/fa';
import axios from 'axios';

function InformacionEvento() {
  const { id, tipo } = useParams();
  const [evento, setEvento] = useState(null);
  const usuario = localStorage.getItem('usuario');
  const entidadId = parseInt(localStorage.getItem('entidad_id'));
  const tipoUsuario = localStorage.getItem('tipoUsuario');

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const endpoint = tipo === 'oficial'
          ? `/api/eventos-oficiales/${id}`
          : `/api/eventos-no-oficiales/${id}`;
        const { data } = await axios.get(endpoint);

        setEvento({
          ...data.evento,
          creador: data.empresa || data.usuario
        });
      } catch (error) {
        console.error('Error cargando el evento:', error);
        setEvento(null);
      }
    };
    fetchEvento();
  }, [id, tipo]);

  if (!evento) return <div className="text-center py-5">Cargando evento...</div>;

  const esCreador = (tipoUsuario === 'empresa' && evento.empresaId === entidadId) ||
                    (tipoUsuario === 'usuario' && evento.usuarioId === entidadId);
  const esEscaneador = evento.escaneadores?.includes(usuario);
  const esRRPP = evento.rrpp?.includes(usuario);

  return (
    <Container className="py-5" style={{ backgroundColor: '#eaf2fb' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="text-primary">{evento.nombre}</h2>
        {esCreador && <FaCog style={{ cursor: 'pointer' }} />}
      </div>

      <p className="text-muted mb-1">
        Por: {evento.creador?.nombre || 'Desconocido'} ({evento.creador?.user || 'usuario'}) </p>
      <p className="mb-1">
        <strong>Desde:</strong> {new Date(evento.fechaInicio).toLocaleString()} <br />
        <strong>Hasta:</strong> {new Date(evento.fechaFin).toLocaleString()}
      </p>
      <p className="mb-1"><strong>Lugar:</strong> {evento.lugar}</p>
      <p className="mb-1"><strong>Descripción:</strong> {evento.descripcion}</p>
      <p className="mb-1"><strong>Email contacto:</strong> {evento.emailAtencionCliente}</p>
      <p className="mb-4"><strong>Teléfono contacto:</strong> {evento.numeroAtencionCliente}</p>

      <div className="d-flex justify-content-between align-items-center">
        <h4 className="fw-bold">Entradas</h4>
        {(esCreador || esEscaneador) && <Button variant="primary">Escanear</Button>}
      </div>

      {evento.tiposEntrada.map((entrada, index) => (
        <Card key={index} className="mb-3 p-3" style={{ backgroundColor: '#ffffff' }}>
          <Row className="align-items-center mb-2">
            <Col md={8}>
              <h5 className="fw-bold mb-0">
                {entrada.nombre}{' '}
                {parseInt(entrada.numeroPremiadas) > 0 && (
                  <span className="text-success" style={{ fontSize: '0.9rem' }}>POSIBLES PREMIOS</span>
                )}
              </h5>
            </Col>
            <Col md={4} className="text-end">
              <span className="fw-bold">{entrada.precio} €</span>
            </Col>
          </Row>
          <p>{entrada.descripcion}</p>
          <div className="d-flex justify-content-end gap-2">
            {(esCreador || esRRPP) && <Button variant="outline-info">Ver ganadores</Button>}
            {esCreador && <Button variant="outline-warning">Sortear</Button>}
            <Button variant="success">Adquirir</Button>
          </div>
        </Card>
      ))}
    </Container>
  );
}

export default InformacionEvento;
