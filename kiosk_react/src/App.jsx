import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccessibilityProvider } from './components/AccessibilityPanel';
import AccessibilityPanel from './components/AccessibilityPanel';
import MegaMenu from './components/MegaMenu';

const Katalog           = lazy(() => import('./pages/Katalog'));
const ProduktSzczegoly  = lazy(() => import('./pages/ProduktSzczegoly'));
const Koszyk            = lazy(() => import('./pages/Koszyk'));
const Zamowienie        = lazy(() => import('./pages/Zamowienie'));
const Sukces            = lazy(() => import('./pages/Sukces'));
const Logowanie         = lazy(() => import('./pages/Logowanie'));
const Rejestracja       = lazy(() => import('./pages/Rejestracja'));
const PanelKlienta      = lazy(() => import('./pages/PanelKlienta'));
const Ulubione          = lazy(() => import('./pages/Ulubione'));
const AdminPanel        = lazy(() => import('./pages/AdminPanel'));

function LoadingSpinner() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>⏳</div>
        Ładowanie...
      </div>
    </div>
  );
}

function ProtectedRoute({ children, wymaganaRola }) {
  const { uzytkownik, ladowanie } = useAuth();
  const location = useLocation();

  if (ladowanie) return <LoadingSpinner />;

  if (!uzytkownik) {
    return <Navigate to="/logowanie" state={{ from: location }} replace />;
  }

  if (wymaganaRola && uzytkownik.rola !== wymaganaRola) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { uzytkownik, ladowanie } = useAuth();

  if (ladowanie) return <LoadingSpinner />;
  if (uzytkownik) return <Navigate to="/" replace />;

  return children;
}

function AppLayout() {
  return (
    <>
      <MegaMenu />
      <div style={{ marginTop: '72px' }}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/"             element={<Katalog />} />
            <Route path="/sprzet/:id"   element={<ProduktSzczegoly />} />
            <Route path="/koszyk"       element={<Koszyk />} />
            <Route path="/zamowienie"   element={<Zamowienie />} />
            <Route path="/sukces"       element={<Sukces />} />

            <Route path="/logowanie" element={
              <GuestRoute><Logowanie /></GuestRoute>
            } />
            <Route path="/rejestracja" element={
              <GuestRoute><Rejestracja /></GuestRoute>
            } />

            {/* Panel klienta – dostępny pod /panel */}
            <Route path="/panel" element={
              <ProtectedRoute><PanelKlienta /></ProtectedRoute>
            } />

            <Route path="/ulubione" element={
              <ProtectedRoute><Ulubione /></ProtectedRoute>
            } />

            <Route path="/admin/*" element={
              <ProtectedRoute wymaganaRola="admin"><AdminPanel /></ProtectedRoute>
            } />

            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '8rem 2rem', fontFamily: 'Poppins, sans-serif' }}>
                <div style={{ fontSize: '5rem' }}>🔍</div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Strona nie istnieje</h2>
                <a href="/" style={{ color: '#2563eb', fontWeight: 600 }}>Wróć do strony głównej</a>
              </div>
            } />
          </Routes>
        </Suspense>
      </div>
      <AccessibilityPanel />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AccessibilityProvider>
          <AppLayout />
        </AccessibilityProvider>
      </AuthProvider>
    </Router>
  );
}