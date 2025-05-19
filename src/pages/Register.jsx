import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Form, Button, Container, Alert } from 'react-bootstrap';

function Register() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState('usuario');

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

  const [empresaFormData, setEmpresaFormData] = useState({
    nombre: '',
    cif: '',
    direccion: '',
    telefono: '',
    movil: '',
    email: '',
    sitioWeb: '',
    user: '',
    password: ''
  });

  const [erroresUsuario, setErroresUsuario] = useState({});
  const [erroresEmpresa, setErroresEmpresa] = useState({});

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserFormData({ ...userFormData, [name]: value });
    setErroresUsuario({ ...erroresUsuario, [name]: '' });
  };

  const handleEmpresaChange = (e) => {
    const { name, value } = e.target;
    setEmpresaFormData({ ...empresaFormData, [name]: value });
    setErroresEmpresa({ ...erroresEmpresa, [name]: '' });
  };

  const validarFormulario = (formData) => {
    let errores = {};
    for (const key in formData) {
      if (!formData[key]) {
        errores[key] = 'Este campo es obligatorio';
      }
    }
    if (formData.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}/.test(formData.password)) {
      errores.password = 'La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número';
    }
    return errores;
  };

  const esNombreUsuarioUnico = async (username) => {
    const nombre = username.toLowerCase();
    try {
      const [usuarios, empresas] = await Promise.all([
        apiClient.get('http://localhost:8080/api/usuarios'),
        apiClient.get('http://localhost:8080/api/empresas')
      ]);

      const existeEnUsuarios = usuarios.data.some(u => u.user?.toLowerCase() === nombre);
      const existeEnEmpresas = empresas.data.some(e => e.user?.toLowerCase() === nombre);

      return !(existeEnUsuarios || existeEnEmpresas);
    } catch (error) {
      console.error('Error validando nombre de usuario:', error);
      return false;
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const errores = validarFormulario(userFormData);
    setErroresUsuario(errores);
    if (Object.keys(errores).length > 0) return;

    const disponible = await esNombreUsuarioUnico(userFormData.user);
    if (!disponible) {
      setErroresUsuario({ user: 'El usuario ya existe (sin distinción de mayúsculas y minúsculas)' });
      return;
    }

    try {
      await apiClient.post('http://localhost:8080/api/usuarios/nuevo', userFormData);
      navigate('/login');
    } catch (error) {
      setErroresUsuario({ general: 'Error al registrar usuario' });
    }
  };

  const handleEmpresaSubmit = async (e) => {
    e.preventDefault();
    const errores = validarFormulario(empresaFormData);
    setErroresEmpresa(errores);
    if (Object.keys(errores).length > 0) return;

    const disponible = await esNombreUsuarioUnico(empresaFormData.user);
    if (!disponible) {
      setErroresEmpresa({ user: 'El usuario ya existe (sin distinción de mayúsculas y minúsculas)' });
      return;
    }

    try {
      await apiClient.post('http://localhost:8080/api/empresas/nuevo', empresaFormData);
      navigate('/login');
    } catch (error) {
      setErroresEmpresa({ general: 'Error al registrar empresa' });
    }
  };

  const handleVolver = () => {
    navigate('/');
  };

  const getInputClass = (errores, field) => {
    return errores[field] ? 'mb-3 border border-danger' : 'mb-3';
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="border rounded p-4 shadow mx-auto" style={{ maxWidth: '700px', width: '100%', backgroundColor: '#cfe2f3' }}>
        <h1 className="mb-4 text-primary text-center">Registro</h1>

        <div className="mb-4 d-flex justify-content-center">
          <Button
            variant={tipo === 'usuario' ? 'primary' : 'outline-primary'}
            className="me-2"
            onClick={() => setTipo('usuario')}
          >
            Usuario
          </Button>
          <Button
            variant={tipo === 'empresa' ? 'primary' : 'outline-primary'}
            onClick={() => setTipo('empresa')}
          >
            Empresa
          </Button>
        </div>

        {tipo === 'usuario' && (
          <Form onSubmit={handleUserSubmit}>
            {Object.entries(userFormData).map(([key, value]) => (
              <div key={key} className="mb-3">
                <Form.Control
                  type={key === 'fechaNacimiento' ? 'date' : key === 'password' ? 'password' : 'text'}
                  name={key}
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={value}
                  onChange={handleUserChange}
                  className={getInputClass(erroresUsuario, key)}
                />
                {erroresUsuario[key] && <div className="text-danger mt-1">{erroresUsuario[key]}</div>}
              </div>
            ))}
            {erroresUsuario.general && <Alert variant="danger" className="text-center">{erroresUsuario.general}</Alert>}
            <Button type="submit" className="w-100 mt-3" variant="primary">
              Registrar Usuario
            </Button>
          </Form>
        )}

        {tipo === 'empresa' && (
          <Form onSubmit={handleEmpresaSubmit}>
            {Object.entries(empresaFormData).map(([key, value]) => (
              <div key={key} className="mb-3">
                <Form.Control
                  type={key === 'password' ? 'password' : 'text'}
                  name={key}
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={value}
                  onChange={handleEmpresaChange}
                  className={getInputClass(erroresEmpresa, key)}
                />
                {erroresEmpresa[key] && <div className="text-danger mt-1">{erroresEmpresa[key]}</div>}
              </div>
            ))}
            {erroresEmpresa.general && <Alert variant="danger" className="text-center">{erroresEmpresa.general}</Alert>}
            <Button type="submit" className="w-100 mt-3" variant="primary">
              Registrar Empresa
            </Button>
          </Form>
        )}

        <Button className="w-100 mt-4" variant="secondary" onClick={handleVolver}>
          Volver a la página principal
        </Button>
      </div>
    </Container>
  );
}

export default Register;