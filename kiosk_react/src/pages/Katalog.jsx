import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Stałe
const SORT_OPTIONS = [
  { value: 'default',    label: 'Domyślnie' },
  { value: 'price_asc',  label: 'Cena: rosnąco' },
  { value: 'price_desc', label: 'Cena: malejąco' },
  { value: 'name_asc',   label: 'Nazwa: A–Z' },
];

const FILTERS = ['Wszystkie', 'Dostępny', 'Wypożyczony', 'Serwis'];

// Ikona emoji dla sprzętu
function getEquipmentIcon(marka = '', model = '') {
  const t = `${marka} ${model}`.toLowerCase();
  if (t.includes('drone') || t.includes('dji') || t.includes('mavic') || t.includes('mini 3')) return '🚁';
  if (t.includes('laptop') || t.includes('macbook') || t.includes('thinkpad') || t.includes('latitude') || t.includes('elitebook') || t.includes('katana')) return '💻';
  if (t.includes('tablet') || t.includes('ipad') || t.includes('galaxy tab')) return '📱';
  if (t.includes('sony') || t.includes('canon') || t.includes('eos') || t.includes('a7') || t.includes('aparat') || t.includes('camera') || t.includes('gopro') || t.includes('hero')) return '📷';
  if (t.includes('projektor') || t.includes('epson') || t.includes('benq')) return '📽️';
  if (t.includes('monitor') || t.includes('ultrasharp')) return '🖥️';
  if (t.includes('rode') || t.includes('mikrofon') || t.includes('audio')) return '🎙️';
  if (t.includes('gimbal') || t.includes('rs 3') || t.includes('statyw') || t.includes('manfrotto') || t.includes('befree')) return '🎬';
  if (t.includes('godox') || t.includes('aputure') || t.includes('led') || t.includes('sl-')) return '💡';
  if (t.includes('sigma') || t.includes('obiektyw') || t.includes('85mm')) return '🔭';
  return '🖥️';
}

function StatusBadge({ status }) {
  const map = {
    'Dostępny':    { bg: '#f0fdf4', color: '#16a34a' },
    'Wypożyczony': { bg: '#fef3c7', color: '#d97706' },
    'Serwis':      { bg: '#fef2f2', color: '#dc2626' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '99px', letterSpacing: '0.03em' }}>
      {status}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ height: 180, background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'katShimmer 1.4s infinite' }} />
      <div style={{ padding: '1.25rem' }}>
        <div style={{ height: 20, background: '#f1f5f9', borderRadius: 6, marginBottom: '0.5rem', width: '70%' }} />
        <div style={{ height: 14, background: '#f1f5f9', borderRadius: 6, width: '40%' }} />
      </div>
    </div>
  );
}

function EquipmentCard({ item, index }) {
  const navigate = useNavigate();
  const available = item.status === 'Dostępny';
  const icon = getEquipmentIcon(item.marka, item.nazwa_modelu);

  return (
    <div
      onClick={() => navigate(`/sprzet/${item.id_egzemplarza}`)}
      style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', flexDirection: 'column', animation: `fadeUp 0.4s ease ${index * 50}ms both` }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(37,99,235,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Obrazek/placeholder */}
      <div style={{ height: 180, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4.5rem', position: 'relative' }}>
        {icon}
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Treść karty */}
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem', lineHeight: 1.3 }}>
          {item.marka} {item.nazwa_modelu}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', background: '#f8fafc', padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.75rem', width: 'fit-content' }}>
          S/N: {item.numer_seryjny}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.15rem' }}>Cena wynajmu</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: '#2563eb' }}>
              {parseFloat(item.cena_wypozyczenia_dzien).toFixed(2)} zł <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>/dzień</span>
            </div>
          </div>
        </div>
      </div>

      {/* Przycisk */}
      <div style={{ padding: '0 1.25rem 1.25rem' }}>
        <button
          style={{ width: '100%', padding: '0.75rem', background: available ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#f1f5f9', color: available ? '#fff' : '#94a3b8', border: 'none', borderRadius: '10px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.875rem', fontWeight: 700, cursor: available ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
          disabled={!available}
          onClick={e => { e.stopPropagation(); if (available) navigate(`/sprzet/${item.id_egzemplarza}`); }}
        >
          {available ? 'Wypożycz sprzęt' : 'Tymczasowo niedostępny'}
        </button>
      </div>
    </div>
  );
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  :root { --brand: #2563eb; --brand-dark: #1d4ed8; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes katShimmer { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } }
  .kat-hero { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 3rem 2rem; text-align: center; color: #fff; }
  .kat-hero h1 { font-family: 'Syne', sans-serif; font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 800; margin: 0 0 0.5rem; }
  .kat-hero p { font-size: 1rem; opacity: 0.8; margin: 0 auto 1.5rem; max-width: 560px; }
  .kat-stats { display: flex; justify-content: center; gap: 2.5rem; }
  .kat-stat-val { font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 800; }
  .kat-stat-lab { font-size: 0.75rem; opacity: 0.65; margin-top: 0.15rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .kat-filters { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; position: sticky; top: 72px; z-index: 40; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .kat-search-wrap { position: relative; flex: 1; min-width: 220px; max-width: 400px; }
  .kat-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
  .kat-search { width: 100%; padding: 0.65rem 1rem 0.65rem 2.5rem; border: 1.5px solid #e2e8f0; border-radius: 99px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; outline: none; background: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
  .kat-search:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .kat-chip { padding: 0.5rem 1.1rem; border: 1.5px solid #e2e8f0; border-radius: 99px; background: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .kat-chip:hover { border-color: #2563eb; color: #2563eb; }
  .kat-chip.active { background: #0f172a; border-color: #0f172a; color: #fff; }
  .kat-sort { padding: 0.55rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 99px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; color: #475569; outline: none; cursor: pointer; background: #fff; }
  .kat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.5rem; padding: 1.5rem 2rem 3rem; max-width: 1400px; margin: 0 auto; }
  .kat-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem 0; max-width: 1400px; margin: 0 auto; }
  .kat-count { font-size: 0.85rem; color: #64748b; }
  .kat-empty { grid-column: 1/-1; text-align: center; padding: 4rem; }
`;

export default function Katalog() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const [sprzet, setSprzet]           = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);
  const [activeFilter, setFilter]     = useState('Wszystkie');
  const [sortBy, setSortBy]           = useState('default');
  const [searchQuery, setSearch]      = useState('');
  const [activeCategoryId, setCategory] = useState(null);

  // Wczytaj parametry z URL (kategoria, szukaj z MegaMenu)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const katId  = params.get('kategoria');
    const szukaj = params.get('szukaj');

    if (katId) setCategory(parseInt(katId));
    if (szukaj) setSearch(szukaj);
  }, [location.search]);

  // Pobierz dane z API (przekaż filtry jako params)
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const params = {};
    if (activeCategoryId) params.kategoria = activeCategoryId;
    if (searchQuery.trim()) params.szukaj = searchQuery.trim();

    axios.get('http://127.0.0.1:8000/api/sprzet', { params })
      .then(r => setSprzet(r.data))
      .catch(() => setError('Nie udało się pobrać danych. Sprawdź połączenie z API.'))
      .finally(() => setIsLoading(false));
  }, [activeCategoryId]);

  // Wyszukiwanie z debounce (lokalne + odśwież z API jeśli puste)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = {};
      if (activeCategoryId) params.kategoria = activeCategoryId;
      if (searchQuery.trim()) params.szukaj = searchQuery.trim();

      axios.get('http://127.0.0.1:8000/api/sprzet', { params })
        .then(r => setSprzet(r.data))
        .catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtrowanie + sortowanie po stronie klienta
  const filteredSprzet = useMemo(() => {
    let result = sprzet.filter(item => {
      const matchFilter = activeFilter === 'Wszystkie' || item.status === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchLocal = !q || `${item.marka} ${item.nazwa_modelu} ${item.numer_seryjny}`.toLowerCase().includes(q);
      return matchFilter && matchLocal;
    });

    if (sortBy === 'price_asc')  result = [...result].sort((a, b) => a.cena_wypozyczenia_dzien - b.cena_wypozyczenia_dzien);
    if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.cena_wypozyczenia_dzien - a.cena_wypozyczenia_dzien);
    if (sortBy === 'name_asc')   result = [...result].sort((a, b) => `${a.marka} ${a.nazwa_modelu}`.localeCompare(`${b.marka} ${b.nazwa_modelu}`));

    return result;
  }, [sprzet, activeFilter, searchQuery, sortBy]);

  const dostepneCount    = useMemo(() => sprzet.filter(i => i.status === 'Dostępny').length, [sprzet]);
  const wypozyczoneCount = useMemo(() => sprzet.filter(i => i.status === 'Wypożyczony').length, [sprzet]);

  useEffect(() => {
    const tag = document.createElement('style');
    tag.id = 'katalog-styles';
    tag.textContent = GLOBAL_CSS;
    if (!document.getElementById('katalog-styles')) document.head.appendChild(tag);
    return () => { const el = document.getElementById('katalog-styles'); if (el) el.remove(); };
  }, []);

  return (
    <>
      {/* Hero */}
      <div className="kat-hero">
        <h1>Znajdź sprzęt dla siebie</h1>
        <p>Profesjonalne urządzenia do pracy i rozrywki. Wypożycz szybko i wygodnie.</p>
        <div className="kat-stats">
          <div><div className="kat-stat-val">{sprzet.length || '—'}</div><div className="kat-stat-lab">Urządzeń</div></div>
          <div><div className="kat-stat-val">{dostepneCount || '—'}</div><div className="kat-stat-lab">Dostępnych</div></div>
          <div><div className="kat-stat-val">{wypozyczoneCount || '—'}</div><div className="kat-stat-lab">Wypożyczonych</div></div>
        </div>
      </div>

      {/* Filtry */}
      <div className="kat-filters">
        <div className="kat-search-wrap">
          <svg className="kat-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="kat-search" type="text" placeholder="Szukaj po nazwie lub numerze seryjnym…"
            value={searchQuery} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {activeCategoryId && (
          <button className="kat-chip active" onClick={() => { setCategory(null); setSearch(''); }}>
            ✕ Wyczyść filtr kategorii
          </button>
        )}

        {FILTERS.map(f => (
          <button key={f} className={`kat-chip ${activeFilter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}

        <select className="kat-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Pasek wyników */}
      {!isLoading && !error && (
        <div className="kat-toolbar">
          <p className="kat-count">
            Wyświetlono <strong>{filteredSprzet.length}</strong> z <strong>{sprzet.length}</strong> urządzeń
            {activeCategoryId && <span style={{ color: '#2563eb', fontWeight: 700 }}> (filtr kategorii)</span>}
          </p>
        </div>
      )}

      {/* Siatka kart */}
      <div className="kat-grid">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <div className="kat-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>😕</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', color: '#0f172a' }}>Błąd ładowania</h3>
            <p style={{ color: '#64748b' }}>{error}</p>
          </div>
        ) : filteredSprzet.length === 0 ? (
          <div className="kat-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', color: '#0f172a' }}>Brak wyników</h3>
            <p style={{ color: '#64748b' }}>Spróbuj zmienić parametry wyszukiwania.</p>
          </div>
        ) : (
          filteredSprzet.map((item, i) => (
            <EquipmentCard key={item.id_egzemplarza} item={item} index={i} />
          ))
        )}
      </div>
    </>
  );
}