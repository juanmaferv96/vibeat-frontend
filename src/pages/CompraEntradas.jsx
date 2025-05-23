import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

function CompraEntradas() {
  const { tipo, eventoId, nombreEntrada } = useParams();
  const location = useLocation();
  const [evento, setEvento] = useState(null);
  const [tipoEntrada, setTipoEntrada] = useState(null);
  const [comprador, setComprador] = useState({
    nombre: '',
    apellidos: '',
    fechaNacimiento: null,
    dni: '',
    email: '',
    telefono: ''
  });

  const tipoUsuario = localStorage.getItem('tipoUsuario');

  useEffect(() => {
    setEvento(null);
    setTipoEntrada(null);

    const fetchEvento = async () => {
      try {
        const endpoint = tipo === 'oficial'
          ? `/api/eventos-oficiales/${eventoId}`
          : `/api/eventos-no-oficiales/${eventoId}`;
        const { data } = await axios.get(endpoint);

        setEvento({
          ...data.evento,
          creador: data.empresa || data.usuario
        });

        const entradaSeleccionada = data.evento.tiposEntrada.find(te => te.nombre === decodeURIComponent(nombreEntrada));
        setTipoEntrada(entradaSeleccionada || null);
      } catch (err) {
        console.error('Error al cargar evento:', err);
      }
    };

    fetchEvento();
  }, [tipo, eventoId, nombreEntrada]);

  useEffect(() => {
    const entidad = JSON.parse(localStorage.getItem('entidad')) || {};
    const tipoUsuario = localStorage.getItem('tipoUsuario');

    if (tipoUsuario === 'usuario') {
      setComprador({
        nombre: entidad.nombre || '',
        apellidos: entidad.apellidos || '',
        fechaNacimiento: null,
        dni: entidad.dni || '',
        email: entidad.email || '',
        telefono: entidad.telefono || ''
      });
    } else {
      setComprador({
        nombre: entidad.nombre || '',
        apellidos: '',
        fechaNacimiento: null,
        dni: '',
        email: entidad.email || '',
        telefono: entidad.telefono || ''
      });
    }
  }, []);

  if (!evento || !tipoEntrada) return <div className="text-center py-5">Cargando información del evento...</div>;

  return (
    <Container className="py-5" style={{ backgroundColor: '#eaf2fb' }}>
      <h2 className="mb-1 text-primary fw-bold">{evento.nombre}</h2>
      <p className="text-muted mb-3">Por: {evento.creador?.user}</p>

      <h4 className="mb-1">Entrada: {tipoEntrada.nombre}</h4>
      <p className="text-muted">{tipoEntrada.descripcion}</p>

      <h5 className="fw-bold text-decoration-underline mt-4 mb-3">Información del comprador</h5>
      <Form>
        <Row className="mb-3">
          <Col>
            <Form.Label>Nombre del comprador</Form.Label>
            <Form.Control
              value={comprador.nombre}
              onChange={(e) => setComprador({ ...comprador, nombre: e.target.value })}
            />
          </Col>
          <Col>
            <Form.Label>Apellidos del comprador</Form.Label>
            <Form.Control
              value={comprador.apellidos}
              onChange={(e) => setComprador({ ...comprador, apellidos: e.target.value })}
            />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Label>Fecha de nacimiento</Form.Label>
            <DatePicker
              selected={comprador.fechaNacimiento}
              onChange={(date) => setComprador({ ...comprador, fechaNacimiento: date })}
              dateFormat="yyyy-MM-dd"
              className="form-control"
            />
          </Col>
          <Col>
            <Form.Label>DNI del comprador</Form.Label>
            <Form.Control
              value={comprador.dni}
              onChange={(e) => setComprador({ ...comprador, dni: e.target.value })}
            />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Label>Email del comprador</Form.Label>
            <Form.Control
              type="email"
              value={comprador.email}
              onChange={(e) => setComprador({ ...comprador, email: e.target.value })}
            />
          </Col>
          <Col>
            <Form.Label>Teléfono del comprador</Form.Label>
            <Form.Control
              value={comprador.telefono}
              onChange={(e) => setComprador({ ...comprador, telefono: e.target.value })}
            />
          </Col>
        </Row>

        <div className="text-end">
          <p className="fw-bold">Precio: {tipoEntrada.precio} €</p>
          <Button variant="success">Comprar</Button>
        </div>
      </Form>
    </Container>
  );
}

export default CompraEntradas;
