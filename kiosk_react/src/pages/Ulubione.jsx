import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .ulub-wrap { font-family: 'Plus Jakarta Sans', sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem 2rem 4rem; }
  .ulub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; }
  .ulub-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; position: relative; transition: all 0.2s; }
  .ulub-card:hover { border-color: #2563eb; box-shadow: 0 6px 20px rgba(37,99,235,0.1); transform: translateY(-3px); }
  .ulub-remove { position: absolute; top: 0.75rem; right: 0.75rem; background: #fef2f2; border: none; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; color: #dc2626; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; transition: background 0.15s; font-weight: 700; }
  .ulub-remove:hover { background: #fee2e2; }
  .ulub-reserve { padding: 0.45rem 1rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; border-radius: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.2s; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }
  .ulub-reserve:hover { opacity: 0.9; transform: translateY(-1px); }
  .ulub-reserve.disabled { background: #e2e8f0; color: #94a3b8; pointer-events: none; box-shadow: none; }
  .ulub-empty { background: #fff; border: 1.5px dashed #e2e8f0; border-radius: 16px; padding: 4rem 2rem; text-align: center; }
  .ulub-icon-wrap { width: 56px; height: 56px; border-radius: 12px; background: linear-gradient(135deg, #eff6ff, #dbeafe); display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin-bottom: 0.75rem; }
`;

// Mapuje nazwę sprzętu na emoji
function getIcon(nazwa = '') {
  const t = nazwa.toLowerCase();
  if (t.includes('dron') || t.includes('mavic') || t.includes('mini') || t.includes('dji')) return '🚁';
  if (t.includes('laptop') || t.includes('macbook') || t.includes('thinkpad') || t.includes('latitude') || t.includes('xps') || t.includes('elitebook')) return '💻';
  if (t.includes('sony') || t.includes('canon') || t.includes('aparat') || t.includes('eos') || t.includes('a7')) return '📷';
  if (t.includes('projektor') || t.includes('epson') || t.includes('benq')) return '📽️';
  if (t.includes('monitor')) return '🖥️';
  if (t.includes('gimbal') || t.includes('rs 3') || t.includes('befree') || t.includes('manfrotto')) return '🎬';
  if (t.includes('mikrofon') || t.includes('rode') || t.includes('wireless go')) return '🎙️';
  if (t.includes('tablet') || t.includes('galaxy tab') || t.includes('ipad')) return '📱';
  if (t.includes('gopro') || t.includes('hero')) return '🎥';
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

  // Niezalogowany użytkownik — zachęta do logowania
  if (!czyZalogowany) {
    return (
      <div className="ulub-wrap" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <style>{CSS}</style>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Zaloguj się
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Musisz być zalogowany, aby wyświetlić ulubione.
        </p>
        <Link to="/logowanie" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '0.85rem 2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
          Zaloguj się
        </Link>
      </div>
    );
  }

  if (loading) return (
    <div className="ulub-wrap">
      <style>{CSS}</style>
      <p style={{ color: '#94a3b8' }}>Ładowanie ulubionych…</p>
    </div>
  );

  return (
    <div className="ulub-wrap">
      <style>{CSS}</style>

      {/* Nagłówek */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
          ❤️ Moje ulubione
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>
          {favorites.length === 0
            ? 'Lista jest pusta'
            : `${favorites.length} ${favorites.length === 1 ? 'pozycja' : favorites.length < 5 ? 'pozycje' : 'pozycji'}`}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="ulub-empty">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤍</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Lista jest pusta
          </h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Przeglądaj katalog i klikaj serce przy sprzęcie który Cię interesuje.
          </p>
          <Link to="/" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '0.85rem 2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
            Przeglądaj katalog
          </Link>
        </div>
      ) : (
        <div className="ulub-grid">
          {favorites.map(item => (
            <div className="ulub-card" key={item.id}>
              <button className="ulub-remove" onClick={() => handleRemove(item.id)} title="Usuń z ulubionych">
                ✕
              </button>

              {/* Ikona sprzętu */}
              <div className="ulub-icon-wrap">
                {getIcon(item.nazwa || '')}
              </div>

              {/* Kategoria */}
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.3rem' }}>
                {item.kategoria || 'Sprzęt IT'}
              </p>

              {/* Nazwa */}
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', lineHeight: 1.3, paddingRight: '1.75rem' }}>
                {item.nazwa || 'Sprzęt'}
              </p>

              {/* Cena */}
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', margin: '0 0 1rem' }}>
                {item.cena}
              </p>

              {/* Status i przycisk */}
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