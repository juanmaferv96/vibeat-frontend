// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Form, Button, Container, Alert } from 'react-bootstrap';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ user: '', password: '' });
  const [error, setError] = useState('');

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
        return;
      }

      if (entidad.password !== password) {
        setError('Contraseña incorrecta');
        return;
      }

      // Login correcto
      const { password: _omit, ...entidadSinPassword } = entidad;
      localStorage.setItem('usuario', entidad.user);
      localStorage.setItem('entidad_id', entidad.id);
      localStorage.setItem('tipoUsuario', 'usuario'); // fijo a 'usuario'
      localStorage.setItem('entidad', JSON.stringify(entidadSinPassword));
      navigate('/home');
    } catch {
      setError('Error al conectar con el servidor');
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
              autoComplete="current-password"
            />
          </Form.Group>

          {error && <Alert variant="danger" className="text-center">{error}</Alert>}

          <Button variant="primary" type="submit" className="w-100 mb-3">
            Iniciar Sesión
          </Button>

          <Button variant="outline-secondary" className="w-100" onClick={handleGoToWelcome}>
            Volver a la página principal
          </Button>
        </Form>
      </div>
    </Container>
  );
}

export default Login;
