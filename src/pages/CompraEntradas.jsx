import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Row, Col, Modal, Alert, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import apiClient from '../api/apiClient';

function CompraEntradas() {
  const { tipo, eventoId, nombreEntrada } = useParams(); // tipo: 'oficial' | 'no-oficial'
  const location = useLocation();
  const navigate = useNavigate();

  const [evento, setEvento] = useState(null);
  const [tipoEntrada, setTipoEntrada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [comprador, setComprador] = useState({
    nombre: '',
    apellidos: '',
    fechaNacimiento: null,
    dni: '',
    email: '',
    telefono: ''
  });

  // UI/confirmación
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Helpers fecha
  const parseFechaNacimiento = (valor) => {
    if (!valor) return null;
    // Soportar 'YYYY-MM-DD' o ISO estándar
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      const [y, m, d] = valor.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(valor);
    return isNaN(d.getTime()) ? null : d;
  };

  const toLocalDate = (d) => {
    if (!d) return null;
    const pad = (n) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}-${m}-${day}`;
  };

  // Autorrelleno comprador desde localStorage
  useEffect(() => {
    try {
      const tipoUsuario = localStorage.getItem('tipoUsuario'); // 'usuario' | 'empresa'
      const entidadRaw = localStorage.getItem('entidad'); // JSON con datos de usuario/empresa
      const entidad = entidadRaw ? JSON.parse(entidadRaw) : {};

      if (tipoUsuario === 'usuario') {
        setComprador((prev) => ({
          ...prev,
          nombre: entidad.nombre || '',
          apellidos: entidad.apellidos || '',
          fechaNacimiento: entidad.fechaNacimiento ? parseFechaNacimiento(entidad.fechaNacimiento) : null,
          dni: entidad.dni || '',
          email: entidad.email || '',
          telefono: entidad.telefono || ''
        }));
      } else if (tipoUsuario === 'empresa') {
        setComprador((prev) => ({
          ...prev,
          nombre: entidad.nombre || '',
          apellidos: '',
          fechaNacimiento: entidad.fechaNacimiento ? parseFechaNacimiento(entidad.fechaNacimiento) : null,
          dni: '',
          email: entidad.email || '',
          telefono: entidad.telefono || ''
        }));
      }
    } catch {
      // ignorar errores de parseo
    }
  }, []);

  // Cargar evento y tipo de entrada
  useEffect(() => {
    let mounted = true;

    const fetchEvento = async () => {
      setLoading(true);
      setLoadError(null);
      setEvento(null);
      setTipoEntrada(null);
      try {
        const endpoint = tipo === 'oficial'
          ? `/eventos-oficiales/${eventoId}`
          : `/eventos-no-oficiales/${eventoId}`;

        const { data } = await apiClient.get(endpoint);

        const eventoObj = data?.evento || data; // soportar {evento, empresa/usuario} o evento directo
        const creador = data?.empresa || data?.usuario || eventoObj?.creador || {};

        const tipos = eventoObj?.tiposEntrada || eventoObj?.tipos_entrada || [];
        const te = tipos.find(t => t?.nombre === decodeURIComponent(nombreEntrada));

        if (!mounted) return;

        setEvento({ ...eventoObj, creador });
        setTipoEntrada(te || null);
      } catch (err) {
        if (!mounted) return;
        console.error('Error al cargar evento:', err);
        setLoadError('No se pudo cargar el evento. Inténtalo más tarde.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEvento();
    return () => { mounted = false; };
  }, [tipo, eventoId, nombreEntrada]);

  // Validación de formulario (todos los campos obligatorios)
  const isFormValid = () => {
    const e = {};
    if (!comprador.nombre) e.nombre = 'Requerido';
    if (!comprador.apellidos) e.apellidos = 'Requerido';
    if (!comprador.fechaNacimiento) e.fechaNacimiento = 'Requerido';
    if (!comprador.dni) e.dni = 'Requerido';
    if (!comprador.email) e.email = 'Requerido';
    if (!comprador.telefono) e.telefono = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const allFilled = comprador.nombre && comprador.apellidos && comprador.fechaNacimiento
    && comprador.dni && comprador.email && comprador.telefono;

  const handleComprarClick = () => {
    if (!isFormValid()) return;
    setShowConfirm(true);
  };

  const handleConfirmAdquirir = async () => {
    if (!isFormValid()) return;
    setSubmitting(true);
    try {
      const payload = {
        eventoId: evento?.id || Number(eventoId),
        usuarioId: parseInt(localStorage.getItem('entidad_id')), // el ID de la entidad en sesión
        tipoEntrada: tipoEntrada?.nombre || decodeURIComponent(nombreEntrada),
        nombreComprador: comprador.nombre,
        apellidosComprador: comprador.apellidos,
        fechaNacimientoComprador: toLocalDate(comprador.fechaNacimiento),
        dniComprador: comprador.dni,
        emailComprador: comprador.email,
        telefonoComprador: comprador.telefono
      };

      const endpoint = (tipo === 'oficial')
        ? '/entradas-oficiales'
        : '/entradas-no-oficiales';

      const { data } = await apiClient.post(endpoint, payload);

      setShowConfirm(false);
      // Navega a la pantalla de resumen llevando la entrada y el evento
      navigate('/resumen-compra', { state: { tipo, entrada: data, evento, tipoEntrada } });
    } catch (err) {
      console.error(err);
      alert('No se pudo completar la compra. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderError = (key) => errors[key] ? (
    <div className="text-danger small mt-1">{errors[key]}</div>
  ) : null;

  if (loading) {
    return (
      <Container className="py-5 d-flex justify-content-center align-items-center">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Cargando…</span>
      </Container>
    );
  }

  if (loadError || !evento) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{loadError || 'No se encontró el evento.'}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ backgroundColor: '#eaf2fb' }}>
      <h2 className="mb-1 text-primary fw-bold">{evento.nombre}</h2>
      <p className="text-muted mb-3">Por: {evento.creador?.user || evento.creador?.nombre || '—'}</p>

      {tipoEntrada && (
        <>
          <h4 className="mb-1">Entrada: {tipoEntrada.nombre}</h4>
          <p className="text-muted">{tipoEntrada.descripcion}</p>
        </>
      )}

      <h5 className="fw-bold text-decoration-underline mt-4 mb-3">Información del comprador</h5>
      <Form>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Nombre del comprador</Form.Label>
            <Form.Control
              value={comprador.nombre}
              onChange={(e) => setComprador({ ...comprador, nombre: e.target.value })}
              onBlur={() => isFormValid()}
            />
            {renderError('nombre')}
          </Col>
          <Col md={6}>
            <Form.Label>Apellidos del comprador</Form.Label>
            <Form.Control
              value={comprador.apellidos}
              onChange={(e) => setComprador({ ...comprador, apellidos: e.target.value })}
              onBlur={() => isFormValid()}
            />
            {renderError('apellidos')}
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Fecha de nacimiento</Form.Label>
            <div>
              <DatePicker
                selected={comprador.fechaNacimiento}
                onChange={(date) => setComprador({ ...comprador, fechaNacimiento: date })}
                dateFormat="yyyy-MM-dd"
                className="form-control"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                scrollableYearDropdown
                yearDropdownItemNumber={120}
                maxDate={new Date()}
                minDate={new Date(1900, 0, 1)}
                placeholderText="Selecciona la fecha"
              />
            </div>
            {renderError('fechaNacimiento')}
          </Col>
          <Col md={6}>
            <Form.Label>DNI</Form.Label>
            <Form.Control
              value={comprador.dni}
              onChange={(e) => setComprador({ ...comprador, dni: e.target.value })}
              onBlur={() => isFormValid()}
            />
            {renderError('dni')}
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={comprador.email}
              onChange={(e) => setComprador({ ...comprador, email: e.target.value })}
              onBlur={() => isFormValid()}
            />
            {renderError('email')}
          </Col>
          <Col md={6}>
            <Form.Label>Teléfono</Form.Label>
            <Form.Control
              value={comprador.telefono}
              onChange={(e) => setComprador({ ...comprador, telefono: e.target.value })}
              onBlur={() => isFormValid()}
            />
            {renderError('telefono')}
          </Col>
        </Row>

        <div className="text-end">
          <p className="fw-bold">Precio: {tipoEntrada?.precio ?? '—'} €</p>
          <Button
            variant="success"
            onClick={handleComprarClick}
            disabled={!allFilled}
            title={!allFilled ? 'Completa todos los campos para continuar' : 'Comprar'}
          >
            Comprar
          </Button>
        </div>
      </Form>

      {/* Modal de confirmación */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Verifica que los datos son correctos antes de adquirir tu entrada</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <p><strong>Nombre:</strong> {comprador.nombre}</p>
              <p><strong>Apellidos:</strong> {comprador.apellidos}</p>
              <p><strong>Fecha de nacimiento:</strong> {comprador.fechaNacimiento ? comprador.fechaNacimiento.toLocaleDateString() : '-'}</p>
            </Col>
            <Col md={6}>
              <p><strong>DNI:</strong> {comprador.dni}</p>
              <p><strong>Email:</strong> {comprador.email}</p>
              <p><strong>Teléfono:</strong> {comprador.telefono}</p>
            </Col>
          </Row>
          <p className="fw-bold mt-2" style={{ color: '#dc3545' }}>
            Recuerda que las entradas adquiridas habrá que pagarlas en la entrada del evento en caso de ser necesario.
          </p>
          <p className="mt-2"><strong>Precio:</strong> {tipoEntrada?.precio ?? '—'} €</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowConfirm(false)} disabled={submitting}>Cancelar</Button>
          <Button variant="success" onClick={handleConfirmAdquirir} disabled={submitting}>
            {submitting ? 'Adquiriendo…' : 'Adquirir'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CompraEntradas;
