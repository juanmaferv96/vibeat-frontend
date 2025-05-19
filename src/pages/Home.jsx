import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';

function Home() {
  const navigate = useNavigate();
  const user = localStorage.getItem('usuario');
  const tipo = localStorage.getItem('tipoUsuario');

  const handleCrearEvento = () => {
    if (tipo === 'empresa') {
      navigate('/formulario-evento-oficial');
    } else {
      navigate('/formulario-evento-no-oficial');
    }
  };

  return (
    <Container className="d-flex flex-column align-items-center flex-grow-1 py-5" style={{ backgroundColor: '#eaf2fb' }}>
      <div className="border rounded p-5 shadow text-center mb-4" style={{ maxWidth: '500px', width: '100%', backgroundColor: '#cfe2f3' }}>
        <h1 className="mb-4" style={{ color: '#4a90e2' }}>Bienvenido {user}</h1>
        <p className="mb-0" style={{ color: '#357ab8' }}>¡Disfruta de tu experiencia en Vibeat!</p>
      </div>

      <div className="border rounded p-4 shadow text-center" style={{ maxWidth: '500px', width: '100%', backgroundColor: '#cfe2f3' }}>
        <h4 style={{ color: '#2c5aa0' }}>Crear tu evento</h4>
        <p style={{ color: '#357ab8' }}>
          Podrás crear tu próximo evento gestionando el número de entradas, su precio e incluso sorteos.
        </p>
        <Button variant="primary" onClick={handleCrearEvento} className="mt-2 w-100">
          Ir a creación de evento
        </Button>
      </div>
    </Container>
  );
}

export default Home;