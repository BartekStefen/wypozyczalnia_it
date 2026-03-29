import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }          from './contexts/AuthContext';
import { AccessibilityProvider } from './components/AccessibilityPanel';
import { ErrorBoundary }         from './components/ErrorBoundary';
import { PrivateRoute, AdminRoute } from './components/PrivateRoute';
import { NotFound }              from './components/ErrorBoundary';

import MegaMenu        from './components/MegaMenu';
import AccessibilityPanel from './components/AccessibilityPanel';

import Katalog         from './pages/Katalog';
import ProduktSzczegoly from './pages/ProduktSzczegoly';
import Koszyk          from './pages/Koszyk';
import Zamowienie      from './pages/Zamowienie';
import Sukces          from './pages/Sukces';
import Logowanie       from './pages/Logowanie';
import Rejestracja     from './pages/Rejestracja';
import PanelKlienta    from './pages/PanelKlienta';
import Ulubione        from './pages/Ulubione';
import AdminPanel      from './pages/AdminPanel';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AccessibilityProvider>
          <BrowserRouter>
            <MegaMenu />
            <AccessibilityPanel />

            <div style={{ paddingTop: 72 }}>
              <Routes>
                {/* Publiczne */}
                <Route path="/"           element={<Katalog />} />
                <Route path="/sprzet/:id" element={<ProduktSzczegoly />} />
                <Route path="/koszyk"     element={<Koszyk />} />
                <Route path="/logowanie"  element={<Logowanie />} />
                <Route path="/rejestracja" element={<Rejestracja />} />

                {/* Wymagają zalogowania */}
                <Route path="/zamowienie" element={
                  <PrivateRoute><Zamowienie /></PrivateRoute>
                }/>
                <Route path="/sukces" element={
                  <PrivateRoute><Sukces /></PrivateRoute>
                }/>
                <Route path="/panel" element={
                  <PrivateRoute><PanelKlienta /></PrivateRoute>
                }/>
                <Route path="/ulubione" element={
                  <PrivateRoute><Ulubione /></PrivateRoute>
                }/>

                {/* Tylko admin */}
                <Route path="/admin/*" element={
                  <AdminRoute><AdminPanel /></AdminRoute>
                }/>

                {/* Catchall — strona 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}