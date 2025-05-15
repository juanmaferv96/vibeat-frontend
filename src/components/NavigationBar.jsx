import React from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function NavigationBar() {
  const navigate = useNavigate();
  const sesionActiva = localStorage.getItem('usuario');

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuario');
    navigate('/');
  };

  if (!sesionActiva) return null;

  return (
    <Navbar bg="light" expand="lg" className="mb-4 border-bottom">
      <Container>
        <Navbar.Brand style={{ color: '#4a90e2' }}>Vibeat</Navbar.Brand>
        <Nav className="ms-auto">
          <Button variant="outline-danger" onClick={handleCerrarSesion}>
            Cerrar Sesión
          </Button>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;