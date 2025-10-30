import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Form, Button, Container, Alert } from 'react-bootstrap';

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user: '',
    password: ''
  });

  const [error, setError] = useState('');

  const handleGoToWelcome = () => navigate('/');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      user: formData.user,
      password: formData.password
    };

    try {
      // Nuevo login unificado solo para usuarios
      const response = await apiClient.post('/usuarios/login', payload);

      // Si todo ok, podrías guardar datos de sesión según tu app
      // p.ej., localStorage.setItem('usuario', JSON.stringify(response.data));
      navigate('/home');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        'Error al iniciar sesión';
      setError(msg);
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh' }}
    >
      <div
        className="border rounded p-4 shadow mx-auto"
        style={{ maxWidth: '500px', width: '100%', backgroundColor: '#cfe2f3' }}
      >
        <h1 className="mb-4 text-primary text-center">Iniciar Sesión</h1>

        <Form onSubmit={handleSubmit}>
          {/* Usuario (case-insensitive en backend) */}
          <div className="mb-3">
            <Form.Label>Usuario</Form.Label>
            <Form.Control
              type="text"
              name="user"
              placeholder="Usuario"
              value={formData.user}
              onChange={handleChange}
            />
          </div>

          {/* Contraseña */}
          <div className="mb-3">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error && (
            <Alert variant="danger" className="mb-3 text-center">
              {error}
            </Alert>
          )}

          <Button variant="primary" type="submit" className="w-100 mb-3">
            Iniciar Sesión
          </Button>

          <Button
            variant="outline-secondary"
            className="w-100"
            onClick={handleGoToWelcome}
          >
            Volver a la página principal
          </Button>
        </Form>
      </div>
    </Container>
  );
}

export default Login;
