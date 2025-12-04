import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Button, Alert } from 'react-bootstrap';
import QRCode from 'react-qr-code';
import apiClient from '../api/apiClient';

function ResumenCompraEntrada() {
  const { state } = useLocation();
  const entrada = state?.entrada;
  const tipo = state?.tipo;               // 'oficial' | 'no-oficial'
  const evento = state?.evento;
  const tipoEntrada = state?.tipoEntrada; // lo pasamos desde CompraEntradas

  if (!entrada || !tipo || !evento) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          No se encontraron datos de la compra. Vuelve a <Link to="/">Inicio</Link> o <Link to="/mis-entradas">Mis Entradas</Link>.
        </Alert>
      </Container>
    );
  }

  const fmt = (val) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d)) return String(val);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fechaInicio = evento.fechaInicio || evento.fecha_inicio || evento.fecha_inicio_evento;
  const fechaFin    = evento.fechaFin    || evento.fecha_fin    || evento.fecha_fin_evento;
  const direccion   = evento.lugar || evento.direccion || evento.direccion_evento || '-';
  const nombreEvento = evento.nombre || 'Evento';

  // username del usuario logueado (ajusta si tu app lo guarda con otra clave)
  const usuarioLogin =
    localStorage.getItem('username') ||
    localStorage.getItem('usuario') ||
    localStorage.getItem('nombreUsuario') ||
    '';

  const base = (tipo === 'oficial')
    ? `/api/entradas-oficiales/${entrada.id}/pdf`
    : `/api/entradas-no-oficiales/${entrada.id}/pdf`;

  const pdfUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set('eventoNombre', nombreEvento);
    if (usuarioLogin) params.set('usuarioLogin', usuarioLogin);
    if (tipoEntrada?.descripcion) params.set('tipoDesc', tipoEntrada.descripcion);
    return `${base}?${params.toString()}`;
  }, [base, nombreEvento, usuarioLogin, tipoEntrada?.descripcion]);

  return (
    <Container className="py-5" style={{ maxWidth: 900 }}>
      <h1 className="text-center fw-bold mb-3">Compra realizada</h1>
      <p className="text-center mb-4">
        Enhorabuena, aquí tienes tu entrada. También podrás verla en la sección{' '}
        <Link to="/mis-eventos" className="fw-bold">Mis Eventos</Link>.
      </p>

      <h2 className="text-center fw-bold mb-2">{nombreEvento}</h2>
      <p className="text-center mb-1">{direccion}</p>
      <p className="text-center mb-4">
        {fechaInicio ? <span>Inicio: {fmt(fechaInicio)}</span> : null}
        {fechaInicio && fechaFin ? ' - ' : null}
        {fechaFin ? <span>Fin: {fmt(fechaFin)}</span> : null}
      </p>

      <div className="d-flex justify-content-center my-4">
        <div className="p-3 bg-white rounded shadow">
          <QRCode value={entrada.codigoQr} size={256} />
        </div>
      </div>

      <p className="text-center fs-6"><strong>Referencia: </strong>{entrada.referencia}</p>

      <div className="text-center mt-3">
        <Button variant="primary" onClick={() => window.open(pdfUrl, '_blank')}>Descarga tu entrada</Button>
      </div>

      <p className="text-center mt-3 fw-bold" style={{ color: '#dc3545' }}>
        Recomendamos descargar la entrada ahora para evitar futuros problemas.
      </p>
    </Container>
  );
}

export default ResumenCompraEntrada;
