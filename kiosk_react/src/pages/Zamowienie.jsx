import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .zam-wrap { font-family: 'Plus Jakarta Sans', sans-serif; max-width: 1100px; margin: 0 auto; padding: 2rem; }
  .zam-input { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; color: #0f172a; background: #fff; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
  .zam-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .zam-input[readonly] { background: #f8fafc; color: #64748b; cursor: default; }
  .zam-label { display: block; font-size: 0.72rem; font-weight: 700; color: #374151; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.35rem; }
  .zam-btn { width: 100%; padding: 1rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.3); text-transform: uppercase; letter-spacing: 0.05em; }
  .zam-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
  .zam-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .zam-card { background: #fff; border-radius: 16px; border: 1.5px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
  .zam-error { background: #fef2f2; border: 1.5px solid #fecaca; color: #dc2626; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
  .zam-info  { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 0.65rem 1rem; font-size: 0.8rem; color: #1d4ed8; margin-bottom: 1rem; }
`;

export default function Zamowienie() {
  const navigate = useNavigate();
  const { uzytkownik, czyZalogowany } = useAuth();

  const [cart, setCart]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    imie: '', nazwisko: '', email: '', telefon: '', numer_dokumentu: '',
  });

  // Wczytaj koszyk z localStorage przy montowaniu
  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart')) || []);
  }, []);

  // Auto-uzupełnij pola z danych zalogowanego konta
  useEffect(() => {
    if (czyZalogowany && uzytkownik) {
      setForm(p => ({
        ...p,
        imie:     uzytkownik.firstName || uzytkownik.imie     || '',
        nazwisko: uzytkownik.lastName  || uzytkownik.nazwisko || '',
        email:    uzytkownik.email     || '',
        telefon:  uzytkownik.phone     || '',
      }));
    }
  }, [czyZalogowany, uzytkownik]);

  const total = cart.reduce((acc, item) => acc + parseFloat(item.suma || 0), 0);
  const vat   = total - total / 1.23;

  const handleFinalize = async (e) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) { setError('Koszyk jest pusty.'); return; }

    setLoading(true);
    try {
      /**
       * Kluczowa logika payloadu — dwie ścieżki:
       *
       * 1. Zalogowany: wysyłamy TYLKO `produkty`.
       *    Backend identyfikuje użytkownika przez token Sanctum ($request->user()).
       *    Blok `klient` jest CELOWO pomijany — backend go nie waliduje dla auth usera.
       *
       * 2. Gość: wysyłamy `produkty` + `klient` z danymi formularza.
       *    Backend zapisuje dane w tabeli `klienci` i tworzy anonimowe wypożyczenie.
       */
      const payload = { produkty: cart };

      if (!czyZalogowany) {
        if (!form.imie || !form.email || !form.numer_dokumentu) {
          setError('Wypełnij wymagane pola: Imię, E-mail i Nr Dokumentu.');
          setLoading(false);
          return;
        }
        payload.klient = {
          imie:            form.imie,
          nazwisko:        form.nazwisko,
          email:           form.email,
          telefon:         form.telefon,
          numer_dokumentu: form.numer_dokumentu,
        };
      }

      // Zalogowany używa dedykowanej trasy — Sanctum header jest wysyłany automatycznie przez axios
      const endpoint = czyZalogowany ? '/finalizuj-auth' : '/finalizuj';
      await axios.post(endpoint, payload);

      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('storage'));
      navigate('/sukces');
    } catch (err) {
      // Pokaż konkretny błąd z backendu — może to być kolizja terminu lub błąd walidacji
      const msg = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {}).flat().join(' ')
        || 'Błąd podczas składania zamówienia.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'center', padding: '4rem 2rem' }}>
        <style>{CSS}</style>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Koszyk jest pusty</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Dodaj sprzęt z katalogu, aby złożyć zamówienie.</p>
        <Link to="/" style={{ background: '#2563eb', color: '#fff', padding: '0.85rem 2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>
          Przeglądaj ofertę
        </Link>
      </div>
    );
  }

  return (
    <div className="zam-wrap">
      <style>{CSS}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

        {/* Formularz — widoczny zawsze, ale pola są readonly dla zalogowanych */}
        <div className="zam-card">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem' }}>
            {czyZalogowany ? 'Potwierdzenie zamówienia' : 'Dane Najemcy (Gość)'}
          </h3>

          {czyZalogowany && (
            <div className="zam-info">
              Jesteś zalogowany jako <strong>{uzytkownik?.firstName} {uzytkownik?.lastName}</strong>.{' '}
              <Link to="/panel" style={{ color: '#1d4ed8', fontWeight: 700 }}>Zmień dane</Link>
            </div>
          )}

          {error && <div className="zam-error">⚠️ {error}</div>}

          <form onSubmit={handleFinalize}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.25rem', marginBottom: '1rem' }}>
              <div>
                <label className="zam-label">Imię{!czyZalogowany && ' *'}</label>
                <input className="zam-input" type="text" placeholder="Jan"
                  value={form.imie} readOnly={czyZalogowany}
                  onChange={e => setForm(p => ({ ...p, imie: e.target.value }))}
                  required={!czyZalogowany} />
              </div>
              <div>
                <label className="zam-label">Nazwisko</label>
                <input className="zam-input" type="text" placeholder="Kowalski"
                  value={form.nazwisko} readOnly={czyZalogowany}
                  onChange={e => setForm(p => ({ ...p, nazwisko: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="zam-label">E-mail{!czyZalogowany && ' *'}</label>
              <input className="zam-input" type="email" placeholder="jan@email.pl"
                value={form.email} readOnly={czyZalogowany}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required={!czyZalogowany} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: !czyZalogowany ? '1fr 1fr' : '1fr', gap: '1rem 1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="zam-label">Telefon</label>
                <input className="zam-input" type="text" placeholder="123 456 789"
                  value={form.telefon}
                  onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} />
              </div>
              {!czyZalogowany && (
                <div>
                  <label className="zam-label">Nr Dokumentu *</label>
                  <input className="zam-input" type="text" placeholder="ABC123456"
                    value={form.numer_dokumentu}
                    onChange={e => setForm(p => ({ ...p, numer_dokumentu: e.target.value }))}
                    required />
                </div>
              )}
            </div>

            {!czyZalogowany && (
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.65rem 1rem', fontSize: '0.8rem', color: '#92400e', marginBottom: '1.25rem' }}>
                💡 Masz konto?{' '}
                <Link to="/logowanie" state={{ from: { pathname: '/zamowienie' } }} style={{ color: '#2563eb', fontWeight: 700 }}>
                  Zaloguj się
                </Link>{' '}
                aby przyspieszyć zamówienie.
              </div>
            )}

            <button type="submit" className="zam-btn" disabled={loading}>
              {loading ? '⏳ Przetwarzanie…' : 'Potwierdzam wynajem'}
            </button>
          </form>
        </div>

        {/* Podsumowanie koszyka */}
        <div className="zam-card">
          <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem' }}>
            Zestawienie zamówienia
          </h4>

          {cart.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.875rem' }}>{item.marka} {item.model}</span>
                <span style={{ color: '#2563eb' }}>{item.suma} zł</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {item.data_start} → {item.data_koniec} ({item.dni} {item.dni === 1 ? 'dzień' : 'dni'})
              </div>
            </div>
          ))}

          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.4rem' }}>
              <span>Netto:</span><span>{(total / 1.23).toFixed(2)} zł</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
              <span>VAT (23%):</span><span>{vat.toFixed(2)} zł</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', paddingTop: '0.75rem', borderTop: '2px solid #0f172a' }}>
              <span>Łącznie:</span><span>{total.toFixed(2)} zł</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}