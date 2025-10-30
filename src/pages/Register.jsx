import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Form, Button, Container, Alert } from 'react-bootstrap';

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

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));
    setErroresUsuario((prev) => ({ ...prev, [name]: '' })); // limpiar error de ese campo
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
      // Solo usuarios (estamos eliminando la parte de empresas)
      const { data: usuarios } = await apiClient.get('/usuarios');

      // USER (case-insensitive)
      const userLower = formData.user.toLowerCase();
      if (usuarios.some((u) => u.user?.toLowerCase() === userLower)) {
        errores.user =
          'El nombre de usuario ya existe (no se distinguen mayúsculas y minúsculas)';
      }

      // DNI (case-insensitive) -> se guardará en MAYÚSCULAS
      const dniUpper = formData.dni.toUpperCase();
      if (usuarios.some((u) => (u.dni || '').toUpperCase() === dniUpper)) {
        errores.dni = 'Ya existe un usuario con ese DNI';
      }

      // EMAIL (case-insensitive) -> se guardará en minúsculas
      const emailLower = formData.email.toLowerCase();
      if (usuarios.some((u) => (u.email || '').toLowerCase() === emailLower)) {
        errores.email = 'Ya existe un usuario con ese email';
      }

      // TELÉFONO (exacto)
      if (usuarios.some((u) => String(u.telefono || '') === String(formData.telefono))) {
        errores.telefono = 'Ya existe un usuario con ese número de teléfono';
      }
    } catch (e) {
      // Si hay error consultando, mostramos error general
      errores.general =
        'No se pudo verificar la disponibilidad. Inténtalo de nuevo en unos segundos.';
    }
    return errores;
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();

    // 1) Validaciones de formato / requeridos
    const erroresBasicos = validarRequeridosYPassword(userFormData);

    // Si ya hay errores básicos, de momento no hacemos la llamada a BD
    if (Object.keys(erroresBasicos).length > 0) {
      setErroresUsuario(erroresBasicos);
      return;
    }

    // 2) Unicidad contra BD
    const erroresUnicidad = await comprobarUnicidadContraBD(userFormData);

    // Combinar ambos (si hubiera)
    const errores = { ...erroresBasicos, ...erroresUnicidad };

    if (Object.keys(errores).length > 0) {
      setErroresUsuario(errores);
      return;
    }

    // 3) Preparar payload con transformaciones:
    // - DNI siempre en MAYÚSCULAS
    // - Email siempre en minúsculas
    const payload = {
      ...userFormData,
      dni: userFormData.dni.toUpperCase(),
      email: userFormData.email.toLowerCase()
      // 'user' se guarda tal y como lo escribió el usuario
    };

    try {
      await apiClient.post('/api/usuarios/nuevo', payload);
      navigate('/login');
    } catch (error) {
      setErroresUsuario({
        general:
          error?.response?.data?.message || 'Error al registrar usuario'
      });
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

        {/* Solo formulario de USUARIOS (oculto el botón de empresa y el selector de tipo) */}
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
            />
            {erroresUsuario.password && (
              <div className="text-danger mt-1">{erroresUsuario.password}</div>
            )}
          </div>

          {/* Errores generales acumulables */}
          {erroresUsuario.general && (
            <Alert variant="danger" className="mt-3 text-center">
              {erroresUsuario.general}
            </Alert>
          )}

          <Button type="submit" className="w-100 mt-3" variant="primary">
            Registrar Usuario
          </Button>
        </Form>

        <Button className="w-100 mt-4" variant="secondary" onClick={handleVolver}>
          Volver a la página principal
        </Button>
      </div>
    </Container>
  );
}

export default Register;
