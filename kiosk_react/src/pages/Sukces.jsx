import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .sukces-wrap { font-family: 'Plus Jakarta Sans', sans-serif; min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #f1f5f9; }
  .sukces-card { background: #fff; border-radius: 24px; padding: 3.5rem 3rem; text-align: center; max-width: 560px; width: 100%; box-shadow: 0 20px 48px rgba(37,99,235,0.1); border: 1px solid #e2e8f0; animation: fadeUp 0.5s ease; }
  .sukces-icon { font-size: 4rem; display: block; margin-bottom: 1.5rem; animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .sukces-btn-primary { display: inline-flex; align-items: center; justify-content: center; padding: 0.9rem 2rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; font-weight: 700; cursor: pointer; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
  .sukces-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
  .sukces-btn-ghost { display: inline-flex; align-items: center; justify-content: center; padding: 0.9rem 1.75rem; background: #fff; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.2s; }
  .sukces-btn-ghost:hover { border-color: #2563eb; color: #2563eb; }
`;

export default function Sukces() {
  const navigate = useNavigate();
  const { czyZalogowany } = useAuth();

  // Numer zamówienia generowany po stronie klienta — w produkcji przychodziłby z backendu
  const [nrZamowienia] = useState(() =>
    'ZAM-' + Date.now().toString(36).toUpperCase().slice(-6)
  );

  // Pobierz datę przyjęcia zamówienia
  const dataZlozenia = new Date().toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="sukces-wrap">
      <style>{CSS}</style>
      <div className="sukces-card">

        <span className="sukces-icon">🎉</span>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem' }}>
          Zamówienie przyjęte!
        </h1>

        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 2rem' }}>
          Twoja rezerwacja sprzętu została potwierdzona.<br />
          Zapraszamy po odbiór w ustalonym terminie.
        </p>

        {/* Szczegóły zamówienia */}
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b' }}>Numer zamówienia</span>
            <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{nrZamowienia}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b' }}>Data złożenia</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{dataZlozenia}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b' }}>Status</span>
            <span style={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.75rem', padding: '0.15rem 0.65rem', borderRadius: '99px' }}>
              ✅ Potwierdzone
            </span>
          </div>
        </div>

        {/* Kroki co dalej */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', textAlign: 'left' }}>
          {[
            { n: '1', text: 'Przygotuj dokument tożsamości do odbioru sprzętu' },
            { n: '2', text: 'Sprawdź sprzęt przy odbiorze — zgłoś ewentualne usterki' },
            { n: '3', text: 'Zwróć sprzęt w ustalonym terminie' },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', flexShrink: 0, marginTop: '0.1rem' }}>
                {n}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Przyciski akcji */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {czyZalogowany && (
            <button className="sukces-btn-ghost" onClick={() => navigate('/panel')}>
              📦 Moje wypożyczenia
            </button>
          )}
          <button className="sukces-btn-ghost" onClick={() => window.print()}>
            🖨️ Drukuj PDF
          </button>
          <button className="sukces-btn-primary" onClick={() => navigate('/')}>
            Wróć do katalogu →
          </button>
        </div>
      </div>
    </div>
  );
}