// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
// Importamos los componentes de Bootstrap necesarios
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';

function Register() {
  const navigate = useNavigate();

  const [userFormData, setUserFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    fechaNacimiento: '',
    direccion: '',
    telefono: '',
    email: '',
    user: '',
    password: ''
  });

  const [erroresUsuario, setErroresUsuario] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiamos el error específico del campo al escribir
    setErroresUsuario((prev) => ({ ...prev, [name]: '' }));
  };

  const validarRequeridosYPassword = (formData) => {
    const errores = {};

    // Requeridos
    Object.entries(formData).forEach(([k, v]) => {
      if (!v || String(v).trim() === '') {
        errores[k] = 'Este campo es obligatorio';
      }
    });

    // Password fuerte
    if (
      formData.password &&
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}/.test(formData.password)
    ) {
      errores.password =
        'La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número';
    }

    // Email formato
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errores.email = 'Introduce un correo electrónico válido';
    }

    // Teléfono (solo dígitos, 9-15)
    if (formData.telefono && !/^[0-9]{9,15}$/.test(formData.telefono)) {
      errores.telefono =
        'El teléfono debe contener solo números y tener entre 9 y 15 dígitos';
    }

    return errores;
  };

  const comprobarUnicidadContraBD = async (formData) => {
    const errores = {};
    try {
      const { data: usuarios } = await apiClient.get('/usuarios');

      // USER (case-insensitive)
      const userLower = formData.user.toLowerCase();
      if (usuarios.some((u) => u.user?.toLowerCase() === userLower)) {
        errores.user = 'El nombre de usuario ya existe';
      }

      // DNI (case-insensitive)
      const dniUpper = formData.dni.toUpperCase();
      if (usuarios.some((u) => (u.dni || '').toUpperCase() === dniUpper)) {
        errores.dni = 'Ya existe un usuario con ese DNI';
      }

      // EMAIL (case-insensitive)
      const emailLower = formData.email.toLowerCase();
      if (usuarios.some((u) => (u.email || '').toLowerCase() === emailLower)) {
        errores.email = 'Ya existe un usuario con ese email';
      }

      // TELÉFONO
      if (usuarios.some((u) => String(u.telefono || '') === String(formData.telefono))) {
        errores.telefono = 'Ya existe un usuario con ese número de teléfono';
      }
    } catch (e) {
      errores.general =
        'No se pudo verificar la disponibilidad. Inténtalo de nuevo en unos segundos.';
    }
    return errores;
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();

    // 1. Validaciones locales (Rápidas - No activamos spinner aquí)
    const erroresBasicos = validarRequeridosYPassword(userFormData);

    if (Object.keys(erroresBasicos).length > 0) {
      setErroresUsuario(erroresBasicos);
      return;
    }

    // 2. Activamos el loader
    setIsLoading(true);
    setErroresUsuario({}); // Limpiamos errores previos

    try {
      // 3. Ejecutamos la validación de BD en paralelo con un temporizador mínimo
      // Esto asegura que el spinner se vea AL MENOS 0.8 segundos, dando feedback visual claro
      const [erroresUnicidad] = await Promise.all([
        comprobarUnicidadContraBD(userFormData),
        new Promise((resolve) => setTimeout(resolve, 800)) // Retardo UX
      ]);

      const errores = { ...erroresBasicos, ...erroresUnicidad };

      // Si hay errores de unicidad (DNI repetido, etc.), paramos aquí
      if (Object.keys(errores).length > 0) {
        setErroresUsuario(errores);
        setIsLoading(false); // Apagamos loader para que el usuario corrija
        return;
      }

      // 4. Si todo está limpio, registramos
      const payload = {
        ...userFormData,
        dni: userFormData.dni.toUpperCase(),
        email: userFormData.email.toLowerCase()
      };

      await apiClient.post('/usuarios/nuevo', payload);
      
      // 5. Éxito: Navegamos
      // NOTA: No hacemos setIsLoading(false) aquí para evitar parpadeos antes del cambio de página
      navigate('/login');

    } catch (error) {
      // Error grave (servidor caído 500, etc)
      setErroresUsuario({
        general: error?.response?.data?.message || 'Error al registrar usuario'
      });
      setIsLoading(false); // Apagamos loader para mostrar el error
    }
  };

  const handleVolver = () => navigate('/');

  const getInputClass = (field) =>
    erroresUsuario[field] ? 'mb-1 border border-danger' : 'mb-1';

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh' }}
    >
      <div
        className="border rounded p-4 shadow mx-auto"
        style={{ maxWidth: '700px', width: '100%', backgroundColor: '#cfe2f3' }}
      >
        <h1 className="mb-4 text-primary text-center">Registro</h1>

        <Form onSubmit={handleUserSubmit}>
          {/* Nombre */}
          <div className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={userFormData.nombre}
              onChange={handleUserChange}
              className={getInputClass('nombre')}
              disabled={isLoading}
            />
            {erroresUsuario.nombre && (
              <div className="text-danger mt-1">{erroresUsuario.nombre}</div>
            )}
          </div>

          {/* Apellidos */}
          <div className="mb-3">
            <Form.Label>Apellidos</Form.Label>
            <Form.Control
              type="text"
              name="apellidos"
              placeholder="Apellidos"
              value={userFormData.apellidos}
              onChange={handleUserChange}
              className={getInputClass('apellidos')}
              disabled={isLoading}
            />
            {erroresUsuario.apellidos && (
              <div className="text-danger mt-1">{erroresUsuario.apellidos}</div>
            )}
          </div>

          {/* DNI */}
          <div className="mb-3">
            <Form.Label>DNI</Form.Label>
            <Form.Control
              type="text"
              name="dni"
              placeholder="DNI"
              value={userFormData.dni}
              onChange={handleUserChange}
              className={getInputClass('dni')}
              disabled={isLoading}
            />
            {erroresUsuario.dni && (
              <div className="text-danger mt-1">{erroresUsuario.dni}</div>
            )}
          </div>

          {/* Fecha de nacimiento */}
          <div className="mb-3">
            <Form.Label>Fecha de nacimiento</Form.Label>
            <Form.Control
              type="date"
              name="fechaNacimiento"
              placeholder="Fecha de nacimiento"
              value={userFormData.fechaNacimiento}
              onChange={handleUserChange}
              className={getInputClass('fechaNacimiento')}
              disabled={isLoading}
            />
            {erroresUsuario.fechaNacimiento && (
              <div className="text-danger mt-1">
                {erroresUsuario.fechaNacimiento}
              </div>
            )}
          </div>

          {/* Dirección */}
          <div className="mb-3">
            <Form.Label>Dirección</Form.Label>
            <Form.Control
              type="text"
              name="direccion"
              placeholder="Dirección"
              value={userFormData.direccion}
              onChange={handleUserChange}
              className={getInputClass('direccion')}
              disabled={isLoading}
            />
            {erroresUsuario.direccion && (
              <div className="text-danger mt-1">{erroresUsuario.direccion}</div>
            )}
          </div>

          {/* Teléfono */}
          <div className="mb-3">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control
              type="text"
              name="telefono"
              placeholder="Teléfono"
              value={userFormData.telefono}
              onChange={handleUserChange}
              className={getInputClass('telefono')}
              disabled={isLoading}
            />
            {erroresUsuario.telefono && (
              <div className="text-danger mt-1">{erroresUsuario.telefono}</div>
            )}
          </div>

          {/* Email */}
          <div className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Email"
              value={userFormData.email}
              onChange={handleUserChange}
              className={getInputClass('email')}
              disabled={isLoading}
            />
            {erroresUsuario.email && (
              <div className="text-danger mt-1">{erroresUsuario.email}</div>
            )}
          </div>

          {/* Usuario */}
          <div className="mb-3">
            <Form.Label>Usuario</Form.Label>
            <Form.Control
              type="text"
              name="user"
              placeholder="Usuario"
              value={userFormData.user}
              onChange={handleUserChange}
              className={getInputClass('user')}
              disabled={isLoading}
            />
            {erroresUsuario.user && (
              <div className="text-danger mt-1">{erroresUsuario.user}</div>
            )}
          </div>

          {/* Password */}
          <div className="mb-2">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Contraseña"
              value={userFormData.password}
              onChange={handleUserChange}
              className={getInputClass('password')}
              disabled={isLoading}
            />
            {erroresUsuario.password && (
              <div className="text-danger mt-1">{erroresUsuario.password}</div>
            )}
          </div>

          {/* Alerta de errores generales */}
          {erroresUsuario.general && (
            <Alert variant="danger" className="mt-3 text-center">
              {erroresUsuario.general}
            </Alert>
          )}

          {/* Botón de Submit con Spinner */}
          <Button 
            type="submit" 
            className="w-100 mt-3" 
            variant="primary" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Validando y Registrando...
              </>
            ) : (
              'Registrar Usuario'
            )}
          </Button>
        </Form>

        <Button 
          className="w-100 mt-4" 
          variant="secondary" 
          onClick={handleVolver} 
          disabled={isLoading}
        >
          Volver a la página principal
        </Button>
      </div>
    </Container>
  );
}

export default Register;