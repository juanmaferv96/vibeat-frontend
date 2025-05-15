import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';

function Home() {
  const [searchParams] = useSearchParams();
  const user = searchParams.get('user');
  return (
    <Container className="d-flex justify-content-center align-items-center flex-grow-1" style={{ backgroundColor: '#eaf2fb' }}>
      <div className="border rounded p-5 shadow mx-auto text-center" style={{ maxWidth: '500px', backgroundColor: '#cfe2f3' }}>
        <h1 className="mb-4" style={{ color: '#4a90e2' }}>Bienvenido {user}</h1>
        <p className="mb-4" style={{ color: '#357ab8' }}>¡Disfruta de tu experiencia en Vibeat!</p>
      </div>
    </Container>
  );
}

export default Home;