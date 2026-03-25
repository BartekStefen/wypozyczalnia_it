import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Katalog from './pages/Katalog';
import ProduktSzczegoly from './pages/ProduktSzczegoly';
import Koszyk from './pages/Koszyk';
import Zamowienie from './pages/Zamowienie';
import Sukces from './pages/Sukces';

export default function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ marginTop: '80px' }}> {/* Miejsce na fixed navbar */}
        <Routes>
          <Route path="/" element={<Katalog />} />
          <Route path="/sprzet/:id" element={<ProduktSzczegoly />} />
          <Route path="/koszyk" element={<Koszyk />} />
          <Route path="/zamowienie" element={<Zamowienie />} />
          <Route path="/sukces" element={<Sukces />} />
        </Routes>
      </div>
    </Router>
  );
}