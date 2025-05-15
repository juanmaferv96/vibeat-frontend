import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';

function Welcome() {
  const navigate = useNavigate();

  const handleIrALogin = () => {
    navigate('/login');
  };

  const handleIrARegistro = () => {
    navigate('/register');
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#eaf2fb' }}>
      <div className="border rounded p-5 shadow mx-auto text-center" style={{ maxWidth: '500px', backgroundColor: '#cfe2f3' }}>
        <h1 className="mb-4" style={{ color: '#4a90e2' }}>Bienvenido a Vibeat</h1>
        <p className="mb-4" style={{ color: '#357ab8' }}>¿Listo para vivir una nueva experiencia?</p>
        <div className="d-flex flex-column gap-3">
          <Button style={{ backgroundColor: '#5dade2', borderColor: '#5dade2' }} onClick={handleIrALogin} className="w-100">
            Iniciar Sesión
          </Button>
          <Button style={{ backgroundColor: '#b0d0f5', color: '#004080', borderColor: '#b0d0f5' }} onClick={handleIrARegistro} className="w-100">
            Registrarse
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default Welcome;
