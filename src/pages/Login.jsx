// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
// 1. Añadimos Spinner a los imports
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ user: '', password: '' });
  const [error, setError] = useState('');
  // 2. Nuevo estado para controlar la carga
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { user, password } = formData;

    if (!user || !password) {
      setError('Debes completar ambos campos');
      return;
    }

    // Activamos el loader antes de empezar la llamada
    setIsLoading(true);

    try {
      // Solo trabajamos con usuarios (la parte Empresa desaparece)
      const response = await apiClient.get('/usuarios');
      // Búsqueda insensible a mayúsculas/minúsculas
      const buscado = user.trim().toLowerCase();
      const entidad = (response.data || []).find(
        (u) => (u?.user || '').toLowerCase() === buscado
      );

      if (!entidad) {
        setError('El nombre de usuario no existe');
        setIsLoading(false); // Apagamos loader si hay error lógico
        return;
      }

      if (entidad.password !== password) {
        setError('Contraseña incorrecta');
        setIsLoading(false); // Apagamos loader si hay error de contraseña
        return;
      }

      // Login correcto
      const { password: _omit, ...entidadSinPassword } = entidad;
      localStorage.setItem('usuario', entidad.user);
      localStorage.setItem('entidad_id', entidad.id);
      localStorage.setItem('tipoUsuario', 'usuario'); // fijo a 'usuario'
      localStorage.setItem('entidad', JSON.stringify(entidadSinPassword));
      
      // No hace falta poner setIsLoading(false) aquí porque al navegar
      // el componente se desmonta y cambiamos de página.
      navigate('/home');
    } catch {
      setError('Error al conectar con el servidor');
      setIsLoading(false); // Apagamos loader si falla la conexión
    }
  };

  const handleGoToWelcome = () => navigate('/');

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="border rounded p-4 shadow bg-light w-100" style={{ maxWidth: '400px' }}>
        <h1 className="mb-3 text-primary text-center">Iniciar Sesión</h1>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formUser">
            <Form.Label>Usuario</Form.Label>
            <Form.Control
              type="text"
              name="user"
              placeholder="Introduce tu usuario"
              value={formData.user}
              onChange={handleChange}
              // Deshabilitamos inputs mientras carga para evitar ediciones
              disabled={isLoading}
              autoComplete="username"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Introduce tu contraseña"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </Form.Group>

          {error && <Alert variant="danger" className="text-center">{error}</Alert>}

          {/* 3. Lógica del botón: deshabilita y muestra Spinner si carga */}
          <Button variant="primary" type="submit" className="w-100 mb-3" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />{' '}
                Cargando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>

          <Button 
            variant="outline-secondary" 
            className="w-100" 
            onClick={handleGoToWelcome}
            disabled={isLoading} // También deshabilitamos volver mientras carga
          >
            Volver a la página principal
          </Button>
        </Form>
      </div>
    </Container>
  );
}

export default Login;