import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Spinner wyświetlany podczas sprawdzania sesji przy starcie
function Spinner() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Chroni trasy wymagające zalogowania — niezalogowany trafia na /logowanie
export function PrivateRoute({ children }) {
  const { czyZalogowany, ladowanie } = useAuth();
  const location = useLocation();

  if (ladowanie) return <Spinner />;

  if (!czyZalogowany) {
    return <Navigate to="/logowanie" state={{ from: location }} replace />;
  }

  return children;
}

// Chroni trasy tylko dla admina — klient bez roli admin trafia na stronę główną
export function AdminRoute({ children }) {
  const { czyZalogowany, czyAdmin, ladowanie } = useAuth();
  const location = useLocation();

  if (ladowanie) return <Spinner />;

  if (!czyZalogowany) {
    return <Navigate to="/logowanie" state={{ from: location }} replace />;
  }

  if (!czyAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}