import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Container, Button, ListGroup, Alert, Spinner, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function MisEventos() {
  const navigate = useNavigate();
  const usuarioId = parseInt(localStorage.getItem('entidad_id') || '0', 10);

  // Datos base
  const [eventosPropios, setEventosPropios] = useState([]);
  const [entradasUsuario, setEntradasUsuario] = useState([]);
  const [eventosMapa, setEventosMapa] = useState(new Map());

  // UI toggles
  const [mostrarTerminadosEventos, setMostrarTerminadosEventos] = useState(false);
  const [mostrarTerminadosEntradas, setMostrarTerminadosEntradas] = useState(false);
  const [expandedEventoId, setExpandedEventoId] = useState(null);

  // Búsqueda
  const [showSearchEventos, setShowSearchEventos] = useState(false);
  const [queryEventos, setQueryEventos] = useState('');
  const [showSearchEntradas, setShowSearchEntradas] = useState(false);
  const [queryEntradas, setQueryEntradas] = useState('');

  // Refs de inputs para mantener foco
  const eventosInputRef = useRef(null);
  const entradasInputRef = useRef(null);

  // Paginación (10 por página)
  const PAGE_SIZE = 10;
  const [pageEventosProx, setPageEventosProx] = useState(1);
  const [pageEventosFin, setPageEventosFin] = useState(1);
  const [pageEntradasProx, setPageEntradasProx] = useState(1);
  const [pageEntradasFin, setPageEntradasFin] = useState(1);

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

  const ordenarPorFechaInicio = (a, b) => {
    const da = new Date(a?.fechaInicio || 0).getTime();
    const db = new Date(b?.fechaInicio || 0).getTime();
    return da - db;
  };

  const eventoTerminado = (e) => {
    if (!e?.fechaFin) return false;
    return new Date(e.fechaFin) < new Date();
  };

  const slicePage = (arr, page, size = PAGE_SIZE) => {
    const total = arr.length;
    const from = (page - 1) * size;
    const to = Math.min(from + size, total);
    return { items: arr.slice(from, to), from: from + 1, to, total };
  };

  const resetPagination = () => {
    setPageEventosProx(1);
    setPageEventosFin(1);
    setPageEntradasProx(1);
    setPageEntradasFin(1);
  };

  // Efecto principal de carga (solo NO oficiales)
  useEffect(() => {
    let mounted = true;
    const cargarDatos = async () => {
      setLoading(true);
      setErrorLoad('');
      try {
        const eventosResp = await axios.get('/api/eventos-no-oficiales');
        const todosEventos = Array.isArray(eventosResp.data) ? eventosResp.data : [];
        const mapa = new Map(todosEventos.map((e) => [e.id, e]));

        const propios = todosEventos
          .filter((e) => e.usuarioId === usuarioId)
          .sort(ordenarPorFechaInicio);

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

  // Reajustar paginación al cambiar SOLO toggles o mostrar buscadores (no en cada tecla)
  useEffect(() => {
    resetPagination();
  }, [mostrarTerminadosEventos, mostrarTerminadosEntradas, showSearchEventos, showSearchEntradas]);

  // Enfocar input al abrir lupa
  useEffect(() => {
    if (showSearchEventos && eventosInputRef.current) {
      eventosInputRef.current.focus();
    }
  }, [showSearchEventos]);
  useEffect(() => {
    if (showSearchEntradas && entradasInputRef.current) {
      entradasInputRef.current.focus();
    }
  }, [showSearchEntradas]);

  // Handlers de cambio que conservan foco y selección del texto
  const makeStableOnChange = (setter, inputRef) => (e) => {
    const el = e.target;
    const { selectionStart, selectionEnd } = el;
    setter(el.value);
    // Reenfoca y restaura selección tras el render
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        try {
          inputRef.current.setSelectionRange(selectionStart, selectionEnd);
        } catch (_) { /* en inputs vacíos puede lanzar, ignoramos */ }
      }
    });
  };
  const onChangeQueryEventos = makeStableOnChange(setQueryEventos, eventosInputRef);
  const onChangeQueryEntradas = makeStableOnChange(setQueryEntradas, entradasInputRef);

  // --- EVENTOS PROPIOS ---
  const { eventosProximos, eventosFinalizados } = useMemo(() => {
    const ahora = new Date();
    const base = eventosPropios.slice().sort(ordenarPorFechaInicio);
    const proximos = base.filter((e) => new Date(e.fechaFin || e.fechaInicio || 0) >= ahora);
    const finalizados = base.filter((e) => new Date(e.fechaFin || 0) < ahora);
    return { eventosProximos: proximos, eventosFinalizados: finalizados };
  }, [eventosPropios]);

  const hayEventosTerminados = eventosFinalizados.length > 0;

  const buscarEventos = useCallback((lista, query) => {
    if (!query) return lista;
    const q = query.trim().toLowerCase();
    return lista.filter((e) => (e?.nombre || '').toLowerCase().includes(q));
  }, []);

  const eventosSearchProx = useMemo(
    () => buscarEventos(eventosProximos, queryEventos),
    [eventosProximos, queryEventos, buscarEventos]
  );
  const eventosSearchFin = useMemo(
    () => buscarEventos(eventosFinalizados, queryEventos),
    [eventosFinalizados, queryEventos, buscarEventos]
  );

  // Si hay búsqueda, ignoramos toggle y mostramos ambas secciones (paginadas)
  const eventosMostrarProx = showSearchEventos ? eventosSearchProx : eventosProximos;
  const eventosMostrarFin = showSearchEventos ? eventosSearchFin : (mostrarTerminadosEventos ? eventosFinalizados : []);

  const pagEventosProx = useMemo(
    () => slicePage(eventosMostrarProx, pageEventosProx),
    [eventosMostrarProx, pageEventosProx]
  );
  const pagEventosFin = useMemo(
    () => slicePage(eventosMostrarFin, pageEventosFin),
    [eventosMostrarFin, pageEventosFin]
  );

  // --- ENTRADAS (AGRUPADAS POR EVENTO) ---
  const gruposEntradasOrdenados = useMemo(() => {
    const grupos = new Map();
    for (const en of entradasUsuario) {
      const eid = en.eventoId;
      if (!grupos.has(eid)) grupos.set(eid, []);
      grupos.get(eid).push(en);
    }
    const lista = Array.from(grupos.entries()).map(([eventoId, entradas]) => {
      const ev = eventosMapa.get(eventoId) || { id: eventoId, nombre: 'Evento', fechaInicio: null, fechaFin: null };
      return { evento: ev, entradas };
    });
    return lista.sort((a, b) => ordenarPorFechaInicio(a.evento, b.evento));
  }, [entradasUsuario, eventosMapa]);

  const { gruposProximos, gruposFinalizados } = useMemo(() => {
    const ahora = new Date();
    const prox = [];
    const fin = [];
    for (const g of gruposEntradasOrdenados) {
      const esFin = new Date(g.evento?.fechaFin || 0) < ahora;
      (esFin ? fin : prox).push(g);
    }
    return { gruposProximos: prox, gruposFinalizados: fin };
  }, [gruposEntradasOrdenados]);

  const hayEntradasDeEventosTerminados = gruposFinalizados.length > 0;

  const buscarGrupos = useCallback((lista, query) => {
    if (!query) return lista;
    const q = query.trim().toLowerCase();
    return lista.filter((g) => (g?.evento?.nombre || '').toLowerCase().includes(q));
  }, []);

  const gruposSearchProx = useMemo(
    () => buscarGrupos(gruposProximos, queryEntradas),
    [gruposProximos, queryEntradas, buscarGrupos]
  );
  const gruposSearchFin = useMemo(
    () => buscarGrupos(gruposFinalizados, queryEntradas),
    [gruposFinalizados, queryEntradas, buscarGrupos]
  );

  const gruposMostrarProx = showSearchEntradas ? gruposSearchProx : gruposProximos;
  const gruposMostrarFin = showSearchEntradas ? gruposSearchFin : (mostrarTerminadosEntradas ? gruposFinalizados : []);

  const pagGruposProx = useMemo(
    () => slicePage(gruposMostrarProx, pageEntradasProx),
    [gruposMostrarProx, pageEntradasProx]
  );
  const pagGruposFin = useMemo(
    () => slicePage(gruposMostrarFin, pageEntradasFin),
    [gruposMostrarFin, pageEntradasFin]
  );

  // Si ocultamos terminados y el expandido es un terminado, replégalo
  useEffect(() => {
    if (!mostrarTerminadosEntradas && expandedEventoId != null) {
      const ev = eventosMapa.get(expandedEventoId);
      if (ev && eventoTerminado(ev)) {
        setExpandedEventoId(null);
      }
    }
  }, [mostrarTerminadosEntradas, expandedEventoId, eventosMapa]);

  // Handlers
  const handleToggleGrupo = useCallback((eventoId) => {
    setExpandedEventoId((prev) => (prev === eventoId ? null : eventoId));
  }, []);

  const handleVerEntrada = useCallback(async (entrada) => {
    try {
      const { data } = await axios.get(`/api/eventos-no-oficiales/${entrada.eventoId}`);
      const eventoObj = data?.evento || data;
      const usuarioCreador = data?.usuario || eventoObj?.creador || {};
      const evento = { ...eventoObj, creador: usuarioCreador };
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

  // Componente simple de paginación
  const PaginationControls = ({ page, setPage, total, size = PAGE_SIZE }) => {
    if (total <= size) return null;
    const totalPages = Math.ceil(total / size);
    const prev = () => setPage((p) => Math.max(1, p - 1));
    const next = () => setPage((p) => Math.min(totalPages, p + 1));
    return (
      <div className="d-flex align-items-center gap-2 mt-2">
        <Button variant="outline-secondary" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={prev} disabled={page <= 1}>
          ‹ Anterior
        </Button>
        <span className="small text-muted">Página {page} de {totalPages}</span>
        <Button variant="outline-secondary" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={next} disabled={page >= totalPages}>
          Siguiente ›
        </Button>
      </div>
    );
  };

  // Encabezado con lupa e input debajo (input siempre montado)
  const HeaderWithSearch = ({
    title, showSearch, setShowSearch, query, onChangeQuery, placeholder, inputRef
  }) => (
    <div className="mb-2">
      <div className="d-flex align-items-center justify-content-between">
        <h4 className="mb-0">{title}</h4>
        <Button
          variant={showSearch ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => {
            setShowSearch((v) => !v);
            setTimeout(() => {
              if (!showSearch && inputRef?.current) inputRef.current.focus();
            }, 0);
          }}
          title="Buscar"
        >
          🔍
        </Button>
      </div>
      <div className={showSearch ? 'mt-2' : 'mt-2 d-none'}>
        <Form.Control
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={onChangeQuery}
        />
      </div>
    </div>
  );

  return (
    <Container className="py-5" style={{ backgroundColor: '#eaf2fb' }}>
      <h2 className="text-primary text-center mb-4">Mis eventos</h2>

      {/* --- EVENTOS PROPIOS --- */}
      <div className="mb-5">
        <HeaderWithSearch
          title="Eventos propios"
          showSearch={showSearchEventos}
          setShowSearch={setShowSearchEventos}
          query={queryEventos}
          onChangeQuery={onChangeQueryEventos}
          placeholder="Buscar eventos por nombre…"
          inputRef={eventosInputRef}
        />

        {eventosPropios.length === 0 ? (
          <p className="text-muted">Aún no has creado ningún evento</p>
        ) : (
          <>
            {!showSearchEventos && hayEventosTerminados && (
              <Button
                variant="outline-primary"
                size="sm"
                className="mb-3"
                onClick={() => setMostrarTerminadosEventos((v) => !v)}
              >
                {mostrarTerminadosEventos ? 'Ocultar eventos terminados' : 'Mostrar eventos terminados'}
              </Button>
            )}

            {/* Próximos */}
            <div className="mb-3">
              <h6 className="text-uppercase text-muted mb-2">Próximos</h6>
              {pagEventosProx.total === 0 ? (
                <p className="text-muted">
                  No hay eventos próximos{showSearchEventos && queryEventos ? ' que coincidan con la búsqueda' : ''}.
                </p>
              ) : (
                <>
                  <ListGroup>
                    {pagEventosProx.items.map((evento) => (
                      <ListGroup.Item key={evento.id} className="d-flex flex-column align-items-start">
                        <Link to={`/informacion-evento/no-oficial/${evento.id}`} className="fw-bold">
                          {evento.nombre}
                        </Link>
                        <span className="text-muted">
                          {evento.lugar} &mdash; {fmtFechaCorta(evento.fechaInicio)} - {fmtFechaCorta(evento.fechaFin)}
                        </span>
                        {evento.descripcion && <small className="text-muted mt-1">{evento.descripcion}</small>}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted mt-2">
                      Mostrando {pagEventosProx.from}-{pagEventosProx.to} de {pagEventosProx.total}
                    </small>
                    <PaginationControls page={pageEventosProx} setPage={setPageEventosProx} total={pagEventosProx.total} />
                  </div>
                </>
              )}
            </div>

            {/* Finalizados */}
            {(showSearchEventos || mostrarTerminadosEventos) && (
              <div>
                <h6 className="text-uppercase text-muted mb-2">Finalizados</h6>
                {pagEventosFin.total === 0 ? (
                  <p className="text-muted">
                    No hay eventos finalizados{showSearchEventos && queryEventos ? ' que coincidan con la búsqueda' : ''}.
                  </p>
                ) : (
                  <>
                    <ListGroup>
                      {pagEventosFin.items.map((evento) => (
                        <ListGroup.Item key={evento.id} className="d-flex flex-column align-items-start">
                          <Link to={`/informacion-evento/no-oficial/${evento.id}`} className="fw-bold">
                            {evento.nombre}
                          </Link>
                          <span className="text-muted">
                            {evento.lugar} &mdash; {fmtFechaCorta(evento.fechaInicio)} - {fmtFechaCorta(evento.fechaFin)}
                          </span>
                          {evento.descripcion && <small className="text-muted mt-1">{evento.descripcion}</small>}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted mt-2">
                        Mostrando {pagEventosFin.from}-{pagEventosFin.to} de {pagEventosFin.total}
                      </small>
                      <PaginationControls page={pageEventosFin} setPage={setPageEventosFin} total={pagEventosFin.total} />
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* --- MIS ENTRADAS --- */}
      <div>
        <HeaderWithSearch
          title="Mis entradas"
          showSearch={showSearchEntradas}
          setShowSearch={setShowSearchEntradas}
          query={queryEntradas}
          onChangeQuery={onChangeQueryEntradas}
          placeholder="Buscar por nombre de evento…"
          inputRef={entradasInputRef}
        />

        {hayEntradasDeEventosTerminados && !showSearchEntradas && (
          <Button
            variant="outline-primary"
            size="sm"
            className="mb-3"
            onClick={() => setMostrarTerminadosEntradas((v) => !v)}
          >
            {mostrarTerminadosEntradas
              ? 'Ocultar entradas de eventos terminados'
              : 'Mostrar entradas de eventos terminados'}
          </Button>
        )}

        {/* Próximos */}
        <div className="mb-3">
          <h6 className="text-uppercase text-muted mb-2">Próximos</h6>
          {pagGruposProx.total === 0 ? (
            <p className="text-muted">
              No hay entradas para eventos próximos{showSearchEntradas && queryEntradas ? ' que coincidan con la búsqueda' : ''}.
            </p>
          ) : (
            <>
              <ListGroup>
                {pagGruposProx.items.map(({ evento, entradas }) => (
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
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted mt-2">
                  Mostrando {pagGruposProx.from}-{pagGruposProx.to} de {pagGruposProx.total}
                </small>
                <PaginationControls page={pageEntradasProx} setPage={setPageEntradasProx} total={pagGruposProx.total} />
              </div>
            </>
          )}
        </div>

        {/* Finalizados */}
        {(showSearchEntradas || mostrarTerminadosEntradas) && (
          <div>
            <h6 className="text-uppercase text-muted mb-2">Finalizados</h6>
            {pagGruposFin.total === 0 ? (
              <p className="text-muted">
                No hay entradas para eventos finalizados{showSearchEntradas && queryEntradas ? ' que coincidan con la búsqueda' : ''}.
              </p>
            ) : (
              <>
                <ListGroup>
                  {pagGruposFin.items.map(({ evento, entradas }) => (
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
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted mt-2">
                    Mostrando {pagGruposFin.from}-{pagGruposFin.to} de {pagGruposFin.total}
                  </small>
                  <PaginationControls page={pageEntradasFin} setPage={setPageEntradasFin} total={pagGruposFin.total} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

export default MisEventos;
