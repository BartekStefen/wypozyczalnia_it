import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function Zamowienie() {
  const navigate = useNavigate();
  const { uzytkownik, czyZalogowany } = useAuth();
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  const [user, setUser] = useState({
    imie:            uzytkownik?.imie  || '',
    nazwisko:        uzytkownik?.nazwisko || '',
    email:           uzytkownik?.email   || '',
    telefon:         uzytkownik?.telefon || '',
    numer_dokumentu: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = cart.reduce((acc, item) => acc + parseFloat(item.suma), 0).toFixed(2);

  if (cart.length === 0) {
    return (
      <div className="container mt-5 pt-5 text-center">
        <div className="p-5 bg-white rounded-5 shadow-sm">
          <div style={{ fontSize: '3rem' }}>🛒</div>
          <h4 className="fw-bold mt-3">Koszyk jest pusty</h4>
          <Link to="/" className="btn btn-dark mt-3 px-4 py-2 rounded-3">Wróć do oferty</Link>
        </div>
      </div>
    );
  }

  const handleFinalize = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        produkty: cart,
      };

      if (!czyZalogowany) {
        payload.klient = user;
      }

      await axios.post('/finalizuj', payload);
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('storage'));
      navigate('/sukces');
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd podczas składania zamówienia. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 pt-5">
      <div className="row g-5">
        <div className="col-md-7">
          <div className="bg-white p-5 rounded-4 shadow-sm">
            <h3 className="fw-bold mb-2">
              {czyZalogowany ? `Potwierdzenie zamówienia` : 'Dane Najemcy (Gość)'}
            </h3>
            {czyZalogowany && (
              <p className="text-muted small mb-4">
                Jesteś zalogowany jako <strong>{uzytkownik?.imie} {uzytkownik?.nazwisko}</strong>.
                <Link to="/panel" className="ms-2 text-primary">Zmień dane</Link>
              </p>
            )}

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={handleFinalize}>
              <div className="row g-3">
                <div className="col-6">
                  <input type="text" className="form-control p-3" placeholder="Imię" required
                    value={user.imie}
                    readOnly={czyZalogowany}
                    onChange={e => setUser({ ...user, imie: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <input type="text" className="form-control p-3" placeholder="Nazwisko" required
                    value={user.nazwisko}
                    readOnly={czyZalogowany}
                    onChange={e => setUser({ ...user, nazwisko: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <input type="email" className="form-control p-3" placeholder="E-mail" required
                    value={user.email}
                    readOnly={czyZalogowany}
                    onChange={e => setUser({ ...user, email: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <input type="text" className="form-control p-3" placeholder="Telefon"
                    value={user.telefon}
                    onChange={e => setUser({ ...user, telefon: e.target.value })}
                  />
                </div>
                {!czyZalogowany && (
                  <div className="col-6">
                    <input type="text" className="form-control p-3" placeholder="Nr Dokumentu" required
                      value={user.numer_dokumentu}
                      onChange={e => setUser({ ...user, numer_dokumentu: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {!czyZalogowany && (
                <div className="mt-4 p-3 bg-light rounded-3 small text-muted">
                  💡 Masz konto?{' '}
                  <Link to="/logowanie" state={{ from: { pathname: '/zamowienie' } }}>Zaloguj się</Link>{' '}
                  aby przyspieszyć zamówienie i śledzić historię.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 py-3 mt-4 fw-bold rounded-3"
              >
                {loading ? 'Przetwarzanie…' : 'POTWIERDZAM WYNAJEM'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-5">
          <div className="bg-light p-4 rounded-4 position-sticky" style={{ top: '100px' }}>
            <h5 className="fw-bold mb-3">Zestawienie zamówienia</h5>
            {cart.map((i, idx) => (
              <div key={idx} className="d-flex justify-content-between border-bottom py-2 small">
                <div>
                  <div className="fw-semibold">{i.marka} {i.model}</div>
                  <div className="text-muted">{i.data_start} → {i.data_koniec} ({i.dni} dni)</div>
                </div>
                <b className="ms-3">{i.suma} zł</b>
              </div>
            ))}
            <div className="d-flex justify-content-between mt-3">
              <span className="text-muted">Suma netto:</span>
              <span>{(total / 1.23).toFixed(2)} zł</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">VAT (23%):</span>
              <span>{(total - total / 1.23).toFixed(2)} zł</span>
            </div>
            <div className="d-flex justify-content-between h4 fw-bold mt-2 pt-2 border-top">
              <span>Łącznie:</span>
              <span>{total} zł</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}