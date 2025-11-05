import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap';
import { FaCog } from 'react-icons/fa';
import axios from 'axios';
import { BrowserMultiFormatReader } from '@zxing/browser';

function InformacionEvento() {
  const { id } = useParams();
  const eventoId = parseInt(id, 10);
  const navigate = useNavigate();

  const [evento, setEvento] = useState(null);

  // Contexto usuario (sin empresas)
  const usuario = localStorage.getItem('usuario');
  const entidadId = parseInt(localStorage.getItem('entidad_id'));
  const tipoUsuario = localStorage.getItem('tipoUsuario'); // 'usuario'

  // ===== Escáner (cámara) =====
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null);

  // Banners de validación
  const [banner, setBanner] = useState(null); // { type: 'success'|'warn'|'error', text: string }
  const bannerTimeoutRef = useRef(null);

  // >>> Control de procesamiento / bloqueo ventana de escaneo
  const processingRef = useRef(false); // bloquea todo el flujo durante 5s
  const cooldownRef = useRef(false);   // redundante, pero mantenemos por claridad
  const scanWindowTimerRef = useRef(null);

  const SUCCESS_COOLDOWN_MS = 5000; // 5s: bloquear nueva lectura tras mostrar banner

  const isSecure =
    typeof window !== 'undefined' &&
    (window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  const hasMedia =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const waitForVideoElement = async (maxMs = 800) => {
    const started = Date.now();
    while (!videoRef.current) {
      if (Date.now() - started > maxMs) break;
      await new Promise((r) => setTimeout(r, 16));
    }
    return videoRef.current;
  };

  const showBanner = (type, text, ms = SUCCESS_COOLDOWN_MS) => {
    setBanner({ type, text });
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    bannerTimeoutRef.current = setTimeout(() => setBanner(null), ms);
  };

  // >>> Inicia una “ventana” de escaneo única (lock inmediato 5s)
  const beginScanWindow = (ms = SUCCESS_COOLDOWN_MS) => {
    cooldownRef.current = true;
    processingRef.current = true;
    if (scanWindowTimerRef.current) clearTimeout(scanWindowTimerRef.current);
    scanWindowTimerRef.current = setTimeout(() => {
      cooldownRef.current = false;
      processingRef.current = false;
      setBanner(null);
    }, ms);
  };

  const validateQr = async (codigoQr) => {
    try {
      const { data, status } = await axios.post('/api/entradas-no-oficiales/scan', {
        eventoId: eventoId,
        codigoQr: String(codigoQr).trim(),
      });
      if (status === 200 && data) {
        const linea = `${data.nombreComprador} ${data.apellidosComprador} - ${data.dniComprador}`;
        showBanner('success', linea, SUCCESS_COOLDOWN_MS);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        showBanner('warn', 'Esta entrada ya ha sido escaneada', SUCCESS_COOLDOWN_MS);
      } else if (status === 404) {
        showBanner('error', 'ENTRADA NO VALIDA PARA ESTE EVENTO', SUCCESS_COOLDOWN_MS);
      } else {
        showBanner('error', 'Error validando el código. Inténtalo de nuevo.', SUCCESS_COOLDOWN_MS);
      }
    }
  };

  const onZXCallback = (result, err) => {
    // >>> si estamos en ventana bloqueada, ignorar TODO (evita vibración y segundas lecturas)
    if (processingRef.current || cooldownRef.current) return;

    if (result && typeof result.getText === 'function') {
      const text = String(result.getText()).trim();
      if (text.length > 0) {
        // >>> Bloqueamos inmediatamente por 5s ANTES de llamar al backend
        beginScanWindow(SUCCESS_COOLDOWN_MS);

        // Vibración solo una vez por ventana de escaneo
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(60);
        }

        // Validamos contra backend (el banner se mostrará y durará exactamente 5s)
        validateQr(text);
      }
    }
  };

  const startScanner = async () => {
    if (isScanning) return;
    setScanError('');

    if (!isSecure) {
      setScanError('La cámara requiere contexto seguro (HTTPS o localhost).');
      return;
    }
    if (!hasMedia) {
      setScanError('navigator.mediaDevices.getUserMedia no está disponible.');
      return;
    }

    try {
      setIsScanning(true);
      const videoEl = await waitForVideoElement();
      if (!videoEl) throw new Error('No se pudo crear el elemento de vídeo (timeout)');

      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('muted', 'true');
      videoEl.muted = true;
      videoEl.srcObject = stream;
      await videoEl.play();

      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
      const reader = readerRef.current;

      if (typeof reader.decodeFromVideoElement === 'function') {
        reader.decodeFromVideoElement(videoEl, onZXCallback);
      } else {
        await reader.decodeFromVideoDevice(null, videoEl, onZXCallback);
      }
    } catch (err) {
      console.error('No se pudo iniciar la cámara:', err);
      let msg = 'No se pudo iniciar la cámara.';
      if (err?.name === 'NotAllowedError') msg = 'Permiso de cámara denegado.';
      if (err?.name === 'NotReadableError') msg = 'La cámara está en uso por otra aplicación.';
      if (err?.name === 'OverconstrainedError') msg = 'No se encontró una cámara compatible.';
      setScanError(msg);
      stopScanner();
    }
  };

  const stopScanner = () => {
    try {
      if (readerRef.current) {
        try { readerRef.current.reset(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = null;
      }
      // >>> limpiar bloqueo y timers
      if (scanWindowTimerRef.current) {
        clearTimeout(scanWindowTimerRef.current);
        scanWindowTimerRef.current = null;
      }
      setBanner(null);
      cooldownRef.current = false;
      processingRef.current = false;
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Datos del evento (solo no-oficial) =====
  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const endpoint = `/api/eventos-no-oficiales/${eventoId}`;
        const { data } = await axios.get(endpoint);
        setEvento({
          ...data.evento,
          creador: data.usuario
        });
      } catch (error) {
        console.error('Error cargando el evento:', error);
        setEvento(null);
      }
    };
    if (!Number.isNaN(eventoId)) fetchEvento();
  }, [eventoId]);

  if (!evento) return <div className="text-center py-5">Cargando evento...</div>;

  const esCreador = tipoUsuario === 'usuario' && evento?.usuarioId === entidadId;
  const esEscaneador = evento?.escaneadores?.includes(usuario);
  const esRRPP = evento?.rrpp?.includes(usuario);
  const finalizado = new Date(evento.fechaFin) < new Date();

  return (
    <Container className="py-5" style={{ backgroundColor: '#eaf2fb' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="text-primary d-flex align-items-center gap-2 mb-0">
          {evento.nombre}
          {finalizado && (
            <span style={{ color: '#dc3545', fontWeight: 700, fontSize: '0.5em' }}>
              (Finalizado)
            </span>
          )}
        </h2>
        {esCreador && <FaCog style={{ cursor: 'pointer' }} />}
      </div>

      <p className="text-muted mb-1">
        Por: {evento.creador?.nombre || 'Desconocido'} ({evento.creador?.user || 'usuario'})
      </p>
      <p className="mb-1">
        <strong>Desde:</strong> {new Date(evento.fechaInicio).toLocaleString()} <br />
        <strong>Hasta:</strong> {new Date(evento.fechaFin).toLocaleString()}
      </p>
      <p className="mb-1"><strong>Lugar:</strong> {evento.lugar}</p>
      <p className="mb-1"><strong>Descripción:</strong> {evento.descripcion}</p>
      <p className="mb-1"><strong>Email contacto:</strong> {evento.emailAtencionCliente}</p>
      <p className="mb-4"><strong>Teléfono contacto:</strong> {evento.numeroAtencionCliente}</p>

      <div className="d-flex justify-content-between align-items-center p-1">
        <h4 className="fw-bold mb-0">Entradas</h4>

        {(esCreador || esEscaneador) && (
          !isScanning ? (
            <Button variant="primary" onClick={startScanner}>Escanear</Button>
          ) : (
            <Button variant="outline-danger" onClick={stopScanner}>Cerrar cámara</Button>
          )
        )}
      </div>

      {scanError && (
        <Alert variant="danger" className="mt-3">{scanError}</Alert>
      )}

      {isScanning && (
        <div
          className="my-3 p-0"
          style={{
            position: 'relative',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#000',
            height: 'min(70vh, 640px)'
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover'
            }}
            autoPlay
            muted
            playsInline
          />

          {/* Overlay guía */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                width: '60vmin',
                height: '60vmin',
                maxWidth: '80%',
                maxHeight: '80%',
                border: '3px solid rgba(255,255,255,0.9)',
                borderRadius: 12,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)'
              }}
            />
          </div>

          {/* Banner de validación */}
          {banner && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  banner.type === 'success' ? '#28a745'
                  : banner.type === 'warn' ? '#fd7e14'
                  : '#dc3545',
                color: '#fff',
                padding: '10px 12px',
                fontWeight: 700,
                textAlign: 'center'
              }}
            >
              {banner.text}
            </div>
          )}

          <div
            className="text-white text-center"
            style={{
              position: 'absolute',
              bottom: banner ? 42 : 8,
              left: 0,
              right: 0,
              fontSize: 14,
              opacity: 0.9,
              textShadow: '0 1px 2px rgba(0,0,0,0.6)'
            }}
          >
            Apunta el QR dentro del marco
          </div>
        </div>
      )}

      {evento.tiposEntrada.map((entrada, index) => {
        const finalizado = new Date(evento.fechaFin) < new Date();
        return (
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
              <Button
                variant={finalizado ? 'secondary' : 'success'}
                disabled={finalizado}
                title={finalizado ? 'El evento ha finalizado. No es posible adquirir entradas.' : 'Adquirir entrada'}
                onClick={() =>
                  !finalizado &&
                  navigate(`/compra-entrada/no-oficial/${evento.id}/${encodeURIComponent(entrada.nombre)}`)
                }
                style={finalizado ? { cursor: 'not-allowed' } : undefined}
              >
                Adquirir
              </Button>
            </div>
          </Card>
        );
      })}
    </Container>
  );
}

export default InformacionEvento;
