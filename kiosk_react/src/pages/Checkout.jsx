import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
// Poprawiona ścieżka importu — było "../context/AuthContext" (bez 's')
import { AuthContext } from '../contexts/AuthContext';

const STEPS = [
  { id: 1, label: 'Koszyk' },
  { id: 2, label: 'Dane' },
  { id: 3, label: 'Podsumowanie' },
];

const MOCK_CART = [
  { id: 1, nazwa: 'Kamera Sony A7 IV',          dni: 3, cenaDzien: 140, dostepna: true },
  { id: 2, nazwa: 'Obiektyw Sigma 85mm f/1.4',   dni: 3, cenaDzien: 60,  dostepna: true },
  { id: 3, nazwa: 'Statyw Manfrotto 190',         dni: 3, cenaDzien: 27,  dostepna: false },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap');
  .checkout-wrap { font-family: 'DM Sans', sans-serif; max-width: 680px; margin: 5rem auto; padding: 2rem; }
  .checkout-card { background: #fff; border: 1.5px solid #f0e8d8; border-radius: 16px; padding: 2.5rem; box-shadow: 0 8px 32px rgba(45,31,14,0.06); }
  .checkout-input { width: 100%; background: transparent; border: none; border-bottom: 2px solid #ddd4c5; outline: none; color: #2d2318; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; padding: 0.6rem 0; transition: border-color 0.3s; box-sizing: border-box; }
  .checkout-input:focus { border-bottom-color: #c9a227; }
  .checkout-label { display: block; font-size: 0.62rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #92816a; margin-bottom: 0.4rem; }
  .checkout-btn { background: #2d1f0e; color: #f5e8c8; border: none; padding: 0.9rem 2.5rem; font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; }
  .checkout-btn:hover { background: #c9a227; }
  .checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// Wskaźnik kroków zamówienia
function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem' }}>
      {STEPS.map((step, idx) => (
        <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: current >= step.id ? '#2d1f0e' : '#e8e0d0',
              color: current >= step.id ? '#f5e8c8' : '#92816a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: current > step.id ? '0.8rem' : '0.82rem', fontWeight: 700,
              transition: 'all 0.4s', flexShrink: 0,
            }}>
              {current > step.id
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : step.id
              }
            </div>
            <span style={{ fontSize: '0.62rem', fontWeight: current === step.id ? 700 : 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: current >= step.id ? '#2d1f0e' : '#92816a', whiteSpace: 'nowrap' }}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div style={{ width: 80, height: 2, background: '#e8e0d0', margin: '0 0.75rem', marginBottom: '1.4rem', position: 'relative', overflow: 'hidden' }}>
              {current > step.id && <div style={{ position: 'absolute', inset: 0, background: '#2d1f0e' }} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Krok 1 — przegląd koszyka
function KrokKoszyk({ cart, setCart, onNext }) {
  const remove = (id) => setCart((p) => p.filter((i) => i.id !== id));
  const total  = cart.reduce((sum, i) => sum + i.cenaDzien * i.dni, 0);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        {cart.map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 0', borderBottom: '1px solid #f0e8d8' }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #f5ede0, #e8d8c0)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
              📷
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', color: '#2d1f0e', margin: '0 0 0.2rem' }}>{item.nazwa}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {!item.dostepna && (
                  <span style={{ fontSize: '0.65rem', background: '#fef2f2', color: '#dc2626', padding: '0.1rem 0.5rem', fontWeight: 600, borderRadius: '3px' }}>Niedostępna</span>
                )}
                <span style={{ fontSize: '0.75rem', color: '#92816a' }}>{item.dni} dni × {item.cenaDzien} zł</span>
              </div>
            </div>
            <p style={{ fontWeight: 700, color: '#2d1f0e', fontSize: '1rem', margin: 0 }}>{item.cenaDzien * item.dni} zł</p>
            <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92816a', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e05252')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#92816a')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#92816a' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</p>
          <p>Koszyk jest pusty. <Link to="/" style={{ color: '#2d1f0e', fontWeight: 600 }}>Przeglądaj katalog</Link></p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', padding: '1rem 0', borderTop: '1px solid #e8e0d0' }}>
            <span>Łącznie</span>
            <span style={{ fontWeight: 600 }}>{total} zł</span>
          </div>
          <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
            <button className="checkout-btn" onClick={onNext} disabled={cart.some(i => !i.dostepna)}>
              Przejdź do danych →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Krok 2 — dane najemcy
function KrokDane({ onNext, onBack }) {
  const { uzytkownik } = useContext(AuthContext);
  const [form, setForm] = useState({
    imie:    uzytkownik?.firstName || '',
    nazwisko: uzytkownik?.lastName  || '',
    email:   uzytkownik?.email     || '',
    telefon: uzytkownik?.phone     || '',
  });

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.imie || !form.email) return;
    onNext(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem', marginBottom: '2rem' }}>
        {[
          { name: 'imie',     label: 'Imię *',     type: 'text',  required: true },
          { name: 'nazwisko', label: 'Nazwisko',    type: 'text',  required: false },
          { name: 'email',    label: 'E-mail *',    type: 'email', required: true },
          { name: 'telefon',  label: 'Telefon',     type: 'tel',   required: false },
        ].map(({ name, label, type, required }) => (
          <div key={name}>
            <label className="checkout-label">{label}</label>
            <input
              className="checkout-input" type={type} name={name}
              value={form[name]} onChange={handleChange} required={required}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <button type="button" className="checkout-btn" onClick={onBack}
          style={{ background: 'transparent', color: '#92816a', border: '1.5px solid #ddd4c5' }}>
          ← Wróć
        </button>
        <button type="submit" className="checkout-btn">Podsumowanie →</button>
      </div>
    </form>
  );
}

// Krok 3 — podsumowanie i potwierdzenie
function KrokPodsumowanie({ cart, daneKlienta, onBack, onConfirm }) {
  const total = cart.reduce((sum, i) => sum + i.cenaDzien * i.dni, 0);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.62rem', fontWeight: 600, color: '#92816a', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 0.75rem' }}>Dane najemcy</p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', color: '#2d1f0e', margin: '0 0 0.15rem' }}>{daneKlienta.imie} {daneKlienta.nazwisko}</p>
        <p style={{ fontSize: '0.85rem', color: '#6b5840', margin: 0 }}>{daneKlienta.email} · {daneKlienta.telefon}</p>
      </div>

      <div style={{ borderTop: '1px solid #e8e0d0', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
        {cart.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem', color: '#3d2b12' }}>
            <span>{item.nazwa} ({item.dni} dni)</span>
            <span style={{ fontWeight: 600 }}>{item.cenaDzien * item.dni} zł</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', borderTop: '2px solid #2d1f0e', paddingTop: '1rem', marginBottom: '2rem' }}>
        <span>Łącznie</span>
        <span style={{ fontWeight: 600 }}>{total} zł</span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <button className="checkout-btn" onClick={onBack}
          style={{ background: 'transparent', color: '#92816a', border: '1.5px solid #ddd4c5' }}>
          ← Wróć
        </button>
        <button className="checkout-btn" onClick={onConfirm}>Potwierdzam wynajem</button>
      </div>
    </div>
  );
}

export default function Checkout() {
  const [step, setStep]         = useState(1);
  const [cart, setCart]         = useState(MOCK_CART);
  const [daneKlienta, setDane]  = useState(null);

  const handleDane    = (dane) => { setDane(dane); setStep(3); };
  const handleConfirm = () => alert('Zamówienie złożone!');

  return (
    <div className="checkout-wrap">
      <style>{CSS}</style>
      <div className="checkout-card">
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', color: '#2d1f0e', fontWeight: 400, textAlign: 'center', margin: '0 0 2rem' }}>
          Finalizacja zamówienia
        </h2>
        <StepIndicator current={step} />

        {step === 1 && <KrokKoszyk  cart={cart} setCart={setCart} onNext={() => setStep(2)} />}
        {step === 2 && <KrokDane    onNext={handleDane} onBack={() => setStep(1)} />}
        {step === 3 && daneKlienta && (
          <KrokPodsumowanie
            cart={cart} daneKlienta={daneKlienta}
            onBack={() => setStep(2)} onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}