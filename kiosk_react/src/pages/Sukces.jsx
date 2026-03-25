import { useNavigate } from 'react-router-dom';

export default function Sukces() {
  const navigate = useNavigate();
  return (
    <div className="container mt-5 pt-5 text-center">
      <div className="p-5 bg-white rounded-5 shadow-sm">
        <h1 className="display-1">🎉</h1>
        <h2 className="fw-bold">Zamówienie przyjęte!</h2>
        <p className="text-muted">Sprzęt został zarezerwowany. Zapraszamy po odbiór.</p>
        <button className="btn btn-outline-primary px-5 py-3 me-2" onClick={() => window.print()}>Drukuj potwierdzenie (PDF)</button>
        <button className="btn btn-dark px-5 py-3" onClick={() => navigate('/')}>Wróć na stronę główną</button>
      </div>
    </div>
  );
}