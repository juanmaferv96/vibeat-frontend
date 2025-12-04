import React, { useState } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
//import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FormularioEventoNoOficial() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [lugar, setLugar] = useState('');
  const [descripcionEvento, setDescripcionEvento] = useState('');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [numeroTiposEntrada, setNumeroTiposEntrada] = useState(1);
  const [tiposEntrada, setTiposEntrada] = useState([
    {
      nombre: '',
      precio: '',
      totalEntradas: '',
      numeroPremiadas: '',
      descripcion: '',
      tipoSorteo: 'NO',
      nombrePremio: ''
    }
  ]);
  const [numeroAtencionCliente, setNumeroAtencionCliente] = useState('');
  const [emailAtencionCliente, setEmailAtencionCliente] = useState('');
  const [error, setError] = useState('');

  const handleTipoEntradaChange = (index, field, value) => {
    const nuevasEntradas = [...tiposEntrada];
    nuevasEntradas[index][field] = value;

    if (field === 'numeroPremiadas') {
      nuevasEntradas[index]['tipoSorteo'] = parseInt(value) > 0 ? 'MANUAL' : 'NO';
    }

    // Reset nombrePremio si ya no es AUTOMATICO
    if (field === 'tipoSorteo' && value !== 'AUTOMATICO') {
      nuevasEntradas[index]['nombrePremio'] = '';
    }

    setTiposEntrada(nuevasEntradas);
  };

  const handleNumeroTiposChange = (e) => {
    const cantidad = parseInt(e.target.value);
    setNumeroTiposEntrada(cantidad);
    const nuevasEntradas = Array.from({ length: cantidad }, (_, i) =>
      tiposEntrada[i] || {
        nombre: '',
        precio: '',
        totalEntradas: '',
        numeroPremiadas: '',
        descripcion: '',
        tipoSorteo: 'NO',
        nombrePremio: ''
      }
    );
    setTiposEntrada(nuevasEntradas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const telefonoRegex = /^[0-9]{9,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nombre || !lugar || !fechaInicio || !fechaFin || !numeroAtencionCliente || !emailAtencionCliente || !descripcionEvento) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (descripcionEvento.length > 500) {
      setError('La descripción del evento no puede superar los 500 caracteres.');
      return;
    }

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (!telefonoRegex.test(numeroAtencionCliente)) {
      setError('El número de atención al cliente debe contener solo números y tener entre 9 y 15 dígitos.');
      return;
    }

    if (!emailRegex.test(emailAtencionCliente)) {
      setError('Introduce un correo electrónico válido.');
      return;
    }

    for (let i = 0; i < tiposEntrada.length; i++) {
      const entrada = tiposEntrada[i];
      if (!entrada.nombre || !entrada.precio || !entrada.totalEntradas || !entrada.numeroPremiadas || !entrada.descripcion) {
        setError(`Todos los campos del tipo de entrada ${i + 1} deben estar completos.`);
        return;
      }
      if (isNaN(entrada.precio) || isNaN(entrada.totalEntradas) || isNaN(entrada.numeroPremiadas)) {
        setError(`Precio, número total de entradas y entradas premiadas del tipo ${i + 1} deben ser valores numéricos.`);
        return;
      }
      if (parseInt(entrada.numeroPremiadas) > parseInt(entrada.totalEntradas)) {
        setError(`Las entradas premiadas no pueden ser mayores que el total de entradas en el tipo ${i + 1}.`);
        return;
      }
      if (entrada.tipoSorteo === 'AUTOMATICO' && !entrada.nombrePremio.trim()) {
        setError(`Debes indicar el nombre del premio para el tipo de entrada ${i + 1} con sorteo AUTOMATICO.`);
        return;
      }
    }

    const tiposEntradaProcesados = tiposEntrada.map((entrada) => ({
      ...entrada,
      entradasDisponibles: parseInt(entrada.totalEntradas),
      // CAMBIO: premiosEntregados -> premiosDisponibles (inicializa con numeroPremiadas)
      premiosDisponibles: parseInt(entrada.numeroPremiadas) || 0
    }));

    const evento = {
      nombre,
      lugar,
      descripcion: descripcionEvento,
      fechaInicio,
      fechaFin,
      numeroTiposEntrada,
      numeroAtencionCliente,
      emailAtencionCliente,
      tiposEntrada: tiposEntradaProcesados,
      usuarioId: parseInt(localStorage.getItem('entidad_id'))
    };

    try {
      await apiClient.post('/eventos-no-oficiales', evento);
      navigate('/mis-eventos');
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Error al crear el evento');
      } else {
        setError('Error al crear el evento');
      }
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center flex-grow-1 py-5" style={{ backgroundColor: '#eaf2fb' }}>
      <div className="border rounded p-5 shadow mx-auto w-100" style={{ maxWidth: '800px', backgroundColor: '#cfe2f3' }}>
        <h2 className="text-center mb-4" style={{ color: '#2c5aa0' }}>Formulario para Evento No Oficial</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* ... resto del formulario idéntico ... */}
          <Form.Group className="mb-3">
            <Form.Label>Nombre del Evento</Form.Label>
            <Form.Control value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Lugar</Form.Label>
            <Form.Control value={lugar} onChange={(e) => setLugar(e.target.value)} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descripción del Evento</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={501}
              value={descripcionEvento}
              onChange={(e) => setDescripcionEvento(e.target.value)}
              className={descripcionEvento.length > 500 ? 'is-invalid' : ''}
            />
            <div className={`text-end small ${descripcionEvento.length > 500 ? 'text-danger' : ''}`}>{descripcionEvento.length}/500</div>
          </Form.Group>

          <Row>
            <Col>
              <Form.Label>Fecha Inicio</Form.Label>
              <DatePicker
                selected={fechaInicio}
                onChange={(date) => setFechaInicio(date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="Pp"
                className="form-control"
              />
            </Col>
            <Col>
              <Form.Label>Fecha Fin</Form.Label>
              <DatePicker
                selected={fechaFin}
                onChange={(date) => setFechaFin(date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="Pp"
                className="form-control"
              />
            </Col>
          </Row>

          <Form.Group className="mt-4 mb-3">
            <Form.Label>Número de Tipos de Entrada</Form.Label>
            <Form.Select value={numeroTiposEntrada} onChange={e => setNumeroTiposEntrada(parseInt(e.target.value))}>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </Form.Select>
          </Form.Group>

          {tiposEntrada.map((entrada, i) => (
            <div key={i} className="border rounded p-3 mb-3" style={{ backgroundColor: '#ffffff' }}>
              <h5 className="text-primary">Tipo de entrada {i + 1}</h5>
              <Row className="mb-2">
                <Col><Form.Control placeholder="Nombre" value={entrada.nombre} onChange={(e) => handleTipoEntradaChange(i, 'nombre', e.target.value)} /></Col>
                <Col><Form.Control type="number" placeholder="Precio" value={entrada.precio} onChange={(e) => handleTipoEntradaChange(i, 'precio', e.target.value)} /></Col>
              </Row>
              <Row className="mb-2">
                <Col><Form.Control type="number" placeholder="Total entradas" value={entrada.totalEntradas} onChange={(e) => handleTipoEntradaChange(i, 'totalEntradas', e.target.value)} /></Col>
                <Col><Form.Control type="number" placeholder="Entradas premiadas" value={entrada.numeroPremiadas} onChange={(e) => handleTipoEntradaChange(i, 'numeroPremiadas', e.target.value)} /></Col>
              </Row>
              <Row className="mb-2">
                <Col>
                  <Form.Select
                    value={entrada.tipoSorteo}
                    onChange={(e) => handleTipoEntradaChange(i, 'tipoSorteo', e.target.value)}
                    disabled={parseInt(entrada.numeroPremiadas) === 0}
                  >
                    <option value="NO">NO</option>
                    <option value="MANUAL">MANUAL - Se elegirá el premio en el momento del sorteo</option>
                    <option value="AUTOMATICO">AUTOMATICO - El premio se elegirá ahora y será el mismo premio para todas las entradas de este tipo</option>
                  </Form.Select>
                </Col>
              </Row>
              {entrada.tipoSorteo === 'AUTOMATICO' && (
                <Row className="mb-2">
                  <Col>
                    <Form.Control
                      placeholder="Nombre del premio"
                      value={entrada.nombrePremio}
                      onChange={(e) => handleTipoEntradaChange(i, 'nombrePremio', e.target.value)}
                    />
                  </Col>
                </Row>
              )}
              <Form.Control as="textarea" rows={2} placeholder="Descripción" value={entrada.descripcion} onChange={(e) => handleTipoEntradaChange(i, 'descripcion', e.target.value)} />
            </div>
          ))}

          <Form.Group className="mb-3">
            <Form.Label>Número de Atención al Cliente</Form.Label>
            <Form.Control type="tel" inputMode="numeric" pattern="[0-9]*" value={numeroAtencionCliente} onChange={(e) => setNumeroAtencionCliente(e.target.value)} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email de Atención al Cliente</Form.Label>
            <Form.Control type="email" value={emailAtencionCliente} onChange={(e) => setEmailAtencionCliente(e.target.value)} />
          </Form.Group>

          <Button type="submit" variant="primary" className="w-100 mt-3">Crear evento</Button>
        </Form>
      </div>
    </Container>
  );
}

export default FormularioEventoNoOficial;
