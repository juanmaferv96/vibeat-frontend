import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Form, Button, Container, Alert, ButtonGroup } from 'react-bootstrap';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ user: '', password: '' });
  const [error, setError] = useState('');
  const [tipo, setTipo] = useState('usuario');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTipoChange = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { user, password } = formData;

    if (!user || !password) {
      setError('Debes completar ambos campos');
      return;
    }

    try {
      const endpoint = tipo === 'usuario' ? 'usuarios' : 'empresas';
      const response = await apiClient.get(`/${endpoint}`);
      const entidad = response.data.find((u) => u.user === user);

      if (entidad && entidad.password === password) {
        const { password, ...entidadSinPassword } = entidad;
        localStorage.setItem('usuario', entidad.user);
        localStorage.setItem('entidad_id', entidad.id);
        localStorage.setItem('tipoUsuario', tipo);
        localStorage.setItem('entidad', JSON.stringify(entidadSinPassword));
        navigate('/home');
      } else {
        setError('Credenciales incorrectas');
      }
    } catch {
      setError('Error al conectar con el servidor');
    }
  };

  const handleGoToWelcome = () => navigate('/');

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="border rounded p-4 shadow bg-light w-100" style={{ maxWidth: '400px' }}>
        <h1 className="mb-3 text-primary text-center">Iniciar Sesión</h1>

        <div className="d-flex justify-content-center mb-3">
          <ButtonGroup>
            <Button
              variant={tipo === 'usuario' ? 'success' : 'outline-success'}
              onClick={() => handleTipoChange('usuario')}
            >
              Soy Usuario
            </Button>
            <Button
              variant={tipo === 'empresa' ? 'success' : 'outline-success'}
              onClick={() => handleTipoChange('empresa')}
            >
              Soy Empresa
            </Button>
          </ButtonGroup>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formUser">
            <Form.Label>Usuario</Form.Label>
            <Form.Control
              type="text"
              name="user"
              placeholder="Introduce tu usuario"
              value={formData.user}
              onChange={handleChange}
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
