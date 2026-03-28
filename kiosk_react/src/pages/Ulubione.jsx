import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Brak importu react-bootstrap - używamy czystego CSS/inline styles
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .ulub-wrap { font-family: 'Plus Jakarta Sans', sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
  .ulub-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; position: relative; transition: all 0.2s; }
  .ulub-card:hover { border-color: #2563eb; box-shadow: 0 6px 20px rgba(37,99,235,0.1); transform: translateY(-3px); }
  .ulub-remove { position: absolute; top: 0.75rem; right: 0.75rem; background: #fef2f2; border: none; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; color: #dc2626; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
  .ulub-remove:hover { background: #fee2e2; }
  .ulub-reserve { padding: 0.5rem 1rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; border-radius: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.2s; }
  .ulub-reserve:hover { opacity: 0.9; }
  .ulub-reserve.disabled { background: #e2e8f0; color: #94a3b8; pointer-events: none; }
`;

// Ikona emoji dla sprzętu
function getIcon(nazwa = '') {
  const t = nazwa.toLowerCase();
  if (t.includes('dron') || t.includes('mavic') || t.includes('mini')) return '🚁';
  if (t.includes('laptop') || t.includes('macbook') || t.includes('thinkpad')) return '💻';
  if (t.includes('sony') || t.includes('canon') || t.includes('aparat')) return '📷';
  if (t.includes('projektor')) return '📽️';
  if (t.includes('monitor')) return '🖥️';
  if (t.includes('gimbal') || t.includes('rs 3')) return '🎬';
  if (t.includes('mikrofon') || t.includes('rode')) return '🎙️';
  if (t.includes('tablet') || t.includes('galaxy tab')) return '📱';
  return '🖥️';
}

export default function Ulubione() {
  const { czyZalogowany } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!czyZalogowany) { setLoading(false); return; }

    axios.get('/ulubione')
      .then(r => setFavorites(r.data))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [czyZalogowany]);

  const handleRemove = async (id) => {
    try {
      await axios.delete(`/ulubione/${id}`);
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch {}
  };

  if (!czyZalogowany) {
    return (
      <div className="ulub-wrap" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <style>{CSS}</style>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Zaloguj się</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Musisz być zalogowany, aby wyświetlić ulubione.</p>
        <Link to="/logowanie" style={{ background: '#2563eb', color: '#fff', padding: '0.85rem 2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>
          Zaloguj się
        </Link>
      </div>
    );
  }

  if (loading) return (
    <div className="ulub-wrap">
      <style>{CSS}</style>
      <p style={{ color: '#94a3b8' }}>Ładowanie…</p>
    </div>
  );

  return (
    <div className="ulub-wrap">
      <style>{CSS}</style>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
          ❤️ Moje Ulubione
        </h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
          Sprzęt, który wpadł Ci w oko — {favorites.length} {favorites.length === 1 ? 'pozycja' : favorites.length < 5 ? 'pozycje' : 'pozycji'}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', border: '1.5px dashed #e2e8f0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤍</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Lista jest pusta</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Przeglądaj katalog i dodaj sprzęt do ulubionych.</p>
          <Link to="/" style={{ background: '#2563eb', color: '#fff', padding: '0.75rem 1.75rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
            Przeglądaj katalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {favorites.map(item => (
            <div className="ulub-card" key={item.id}>
              <button className="ulub-remove" onClick={() => handleRemove(item.id)} title="Usuń z ulubionych">✕</button>

              {/* Emoji ikona */}
              <div style={{ width: 56, height: 56, borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
                {getIcon(item.nazwa || '')}
              </div>

              {/* Kategoria */}
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.3rem' }}>
                {item.kategoria || 'Sprzęt IT'}
              </p>

              {/* Nazwa produktu */}
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem', lineHeight: 1.3, paddingRight: '1.5rem' }}>
                {item.nazwa || 'Sprzęt'}
              </p>

              {/* Cena */}
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', margin: '0 0 1rem' }}>
                {item.cena}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.dostepny ? '#16a34a' : '#dc2626' }}>
                  {item.dostepny ? '● Dostępny' : '● Niedostępny'}
                </span>
                <Link
                  to={`/sprzet/${item.id_egzemplarza || item.sprzet_id}`}
                  className={`ulub-reserve ${!item.dostepny ? 'disabled' : ''}`}
                >
                  Zarezerwuj
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}