import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Ulubione = () => {
  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">Moje Ulubione ❤️</h2>
          <p className="text-muted">Lista sprzętów, które wpadły Ci w oko.</p>
        </Col>
      </Row>
      <Row>
        <Col className="text-center py-5">
          <Card className="border-0 shadow-sm py-5">
            <Card.Body>
              <h4 className="text-muted">Twój schowek jest aktualnie pusty.</h4>
              <p>Przejdź do katalogu i dodaj sprzęt do ulubionych!</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Ulubione;