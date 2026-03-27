import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const AdminPanel = () => {
  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold text-danger">⚙️ Panel Administratora</h2>
          <p className="text-muted">Zarządzaj asortymentem, wypożyczeniami i użytkownikami.</p>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <Card className="border-0 shadow-sm mb-4 bg-light">
            <Card.Body>
              <h5>Zarządzanie Sprzętem</h5>
              <p className="text-muted small">Dodawaj i usuwaj sprzęt z bazy.</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm mb-4 bg-light">
            <Card.Body>
              <h5>Aktywne Wypożyczenia</h5>
              <p className="text-muted small">Przeglądaj statusy zamówień.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminPanel;