import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Container, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function MisEventos() {
  const navigate = useNavigate();
  const usuarioId = parseInt(localStorage.getItem('entidad_id') || '0', 10);

  // Estado: eventos propios, todas las entradas del usuario y mapa eventoId->evento
  const [eventosPropios, setEventosPropios] = useState([]);
  const [entradasUsuario, setEntradasUsuario] = useState([]);
  const [eventosMapa, setEventosMapa] = useState(new Map());

  // UI
  const [mostrarTerminados, setMostrarTerminados] = useState(false);
  const [expandedEventoId, setExpandedEventoId] = useState(null);

  // Carga
  const [loading, setLoading] = useState(true);
  const [errorLoad, setErrorLoad] = useState('');

  // Helpers
  const fmtFechaCorta = (valor) => {
    if (!valor) return '';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return String(valor);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const ordenarPorFechaInicio = (a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio);

  // Efecto principal de carga (solo NO oficiales)
  useEffect(() => {
    let mounted = true;
    const cargarDatos = async () => {
      setLoading(true);
      setErrorLoad('');
      try {
        // 1) Cargamos TODOS los eventos no oficiales y construimos un mapa id->evento
        const eventosResp = await axios.get('/api/eventos-no-oficiales');
        const todosEventos = Array.isArray(eventosResp.data) ? eventosResp.data : [];
        const mapa = new Map(todosEventos.map((e) => [e.id, e]));

        // 2) Filtramos los eventos propios del usuario
        const propios = todosEventos
          .filter((e) => e.usuarioId === usuarioId)
          .sort(ordenarPorFechaInicio);

        // 3) Cargamos TODAS las entradas NO oficiales y filtramos por usuario
        const entradasResp = await axios.get('/api/entradas-no-oficiales');
        const todasEntradas = Array.isArray(entradasResp.data) ? entradasResp.data : [];
        const mias = todasEntradas.filter((en) => en.usuarioId === usuarioId);

        if (!mounted) return;
        setEventosMapa(mapa);
        setEventosPropios(propios);
        setEntradasUsuario(mias);
      } catch (err) {
        console.error('Error cargando mis eventos/entradas:', err);
        if (!mounted) return;
        setErrorLoad('No se pudieron cargar tus eventos/entradas. Inténtalo más tarde.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarDatos();
    return () => { mounted = false; };
  }, [usuarioId]);

  // Eventos visibles según "mostrarTerminados"
  const eventosPropiosVisibles = useMemo(() => {
    const ahora = new Date();
    return eventosPropios.filter(
      (e) => mostrarTerminados || new Date(e.fechaFin) >= ahora
    );
  }, [eventosPropios, mostrarTerminados]);

  // Agrupar entradas por eventoId y ordenarlas por fecha de inicio del evento
  const gruposEntradas = useMemo(() => {
    const grupos = new Map();
    for (const en of entradasUsuario) {
      const eid = en.eventoId;
      if (!grupos.has(eid)) grupos.set(eid, []);
      grupos.get(eid).push(en);
    }
    // Pasamos a array enriquecido con datos del evento
    const lista = Array.from(grupos.entries()).map(([eventoId, entradas]) => {
      const ev = eventosMapa.get(eventoId) || { id: eventoId, nombre: 'Evento', fechaInicio: null };
      return { evento: ev, entradas };
    });
    // Orden por fechaInicio del evento
    return lista.sort((a, b) => ordenarPorFechaInicio(a.evento, b.evento));
  }, [entradasUsuario, eventosMapa]);

  // Handler: abrir/cerrar grupo de entradas
  const handleToggleGrupo = useCallback((eventoId) => {
    setExpandedEventoId((prev) => (prev === eventoId ? null : eventoId));
  }, []);

  // Handler: ir al resumen de una entrada concreta
  const handleVerEntrada = useCallback(async (entrada) => {
    try {
      // Cargamos el evento completo para disponer de tiposEntrada actualizados
      const { data } = await axios.get(`/api/eventos-no-oficiales/${entrada.eventoId}`);
      // Compatible con estructuras {evento, usuario} o evento directo
      const eventoObj = data?.evento || data;
      const usuarioCreador = data?.usuario || eventoObj?.creador || {};
      const evento = { ...eventoObj, creador: usuarioCreador };

      // Buscar el objeto tipoEntrada por su nombre
      const tipos = evento?.tiposEntrada || evento?.tipos_entrada || [];
      const tipoEntradaObj = tipos.find((t) => t?.nombre === entrada.tipoEntrada) || null;

      navigate('/resumen-compra', {
        state: {
          tipo: 'no-oficial',
          entrada,
          evento,
          tipoEntrada: tipoEntradaObj
        }
      });
    } catch (err) {
      console.error('No se pudo preparar la vista de resumen.', err);
      alert('No se pudo abrir la entrada. Inténtalo de nuevo.');
    }
  }, [navigate]);

  if (loading) {
    return (
      <Container className="py-5 d-flex justify-content-center align-items-center">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Cargando…</span>
      </Container>
    );
  }

  if (errorLoad) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{errorLoad}</Alert>
      </Container>
    );
  }

  const hayTerminados = eventosPropios.some((e) => new Date(e.fechaFin) < new Date());

  return (
    <Container className="py-5" style={{ backgroundColor: '#eaf2fb' }}>
      <h2 className="text-primary text-center mb-4">Mis eventos</h2>

      {/* Bloque: Eventos propios (NO oficiales) */}
      <div className="mb-5">
        <h4>Eventos propios</h4>
        {eventosPropios.length === 0 ? (
          <p className="text-muted">Aún no has creado ningún evento</p>
        ) : (
          <>
            {hayTerminados && (
              <Button
                variant="outline-primary"
                size="sm"
                className="mb-3"
                onClick={() => setMostrarTerminados((v) => !v)}
              >
                {mostrarTerminados ? 'Ocultar eventos terminados' : 'Mostrar eventos terminados'}
              </Button>
            )}

            <ListGroup>
              {eventosPropiosVisibles.map((evento) => (
                <ListGroup.Item key={evento.id} className="d-flex flex-column align-items-start">
                  <Link
                    to={`/informacion-evento/no-oficial/${evento.id}`}
                    className="fw-bold"
                  >
                    {evento.nombre}
                  </Link>
                  <span className="text-muted">
                    {evento.lugar} &mdash; {new Date(evento.fechaInicio).toLocaleDateString()} - {new Date(evento.fechaFin).toLocaleDateString()}
                  </span>
                  <small className="text-muted mt-1">{evento.descripcion}</small>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </div>

      {/* Bloque: Mis entradas (NO oficiales) */}
      <div>
        <h4>Mis entradas</h4>
        {gruposEntradas.length === 0 ? (
          <p className="text-muted">Aún no has adquirido ninguna entrada</p>
        ) : (
          <ListGroup>
            {gruposEntradas.map(({ evento, entradas }) => (
              <ListGroup.Item key={evento.id} className="p-0">
                <button
                  className="w-100 text-start border-0 bg-transparent p-3 fw-bold"
                  onClick={() => handleToggleGrupo(evento.id)}
                  title="Ver entradas de este evento"
                >
                  {`${evento.nombre} - ${fmtFechaCorta(evento.fechaInicio)}`}
                </button>

                {expandedEventoId === evento.id && (
                  <div className="px-3 pb-3">
                    <ListGroup>
                      {entradas.map((en) => (
                        <ListGroup.Item
                          key={en.id}
                          action
                          onClick={() => handleVerEntrada(en)}
                          title="Ver entrada"
                        >
                          {`${en.tipoEntrada} - ${en.nombreComprador}, ${en.apellidosComprador}`}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>
    </Container>
  );
}

export default MisEventos;
