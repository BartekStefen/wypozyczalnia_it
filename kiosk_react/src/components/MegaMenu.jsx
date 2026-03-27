import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const STYLE_MEGA = `
  .mega-nav { background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid #e2e8f0; height: 72px; display: flex; align-items: center; position: fixed; top: 0; left: 0; right: 0; z-index: 500; box-shadow: 0 1px 0 #e2e8f0; transition: box-shadow .3s ease; }
  .mega-nav.scrolled { box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .mega-nav-inner { max-width: 1400px; width: 100%; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; gap: 2rem; }
  .mega-logo { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 1.5rem; color: #2563eb; letter-spacing: -0.5px; text-decoration: none; flex-shrink: 0; }
  .mega-logo span { color: #0f172a; }
  .mega-trigger { display: flex; align-items: center; gap: .5rem; padding: .6rem 1.25rem; border-radius: 99px; background: #0f172a; color: #fff; border: none; cursor: pointer; font-family: 'Inter', sans-serif; font-size: .875rem; font-weight: 600; transition: all .2s; white-space: nowrap; flex-shrink: 0; }
  .mega-trigger:hover { background: #1e40af; }
  .mega-trigger .hamburger { display: flex; flex-direction: column; gap: 4px; }
  .mega-trigger .hamburger span { display: block; width: 16px; height: 2px; background: #fff; border-radius: 2px; transition: all .2s; }
  .mega-trigger.aktywny .hamburger span:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
  .mega-trigger.aktywny .hamburger span:nth-child(2) { opacity: 0; }
  .mega-trigger.aktywny .hamburger span:nth-child(3) { transform: rotate(-45deg) translate(4px, -4px); }
  .mega-search-wrap { flex: 1; max-width: 480px; position: relative; }
  .mega-search-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
  .mega-search { width: 100%; padding: .7rem 1rem .7rem 2.5rem; border: 1.5px solid #e2e8f0; border-radius: 99px; font-family: 'Inter', sans-serif; font-size: .875rem; outline: none; background: #f8fafc; transition: all .25s; }
  .mega-search:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .mega-nav-actions { display: flex; align-items: center; gap: .75rem; margin-left: auto; }
  .mega-nav-btn { padding: .55rem 1.1rem; border-radius: 99px; border: 1.5px solid #e2e8f0; background: #f8fafc; font-family: 'Inter', sans-serif; font-size: .85rem; font-weight: 600; color: #475569; cursor: pointer; text-decoration: none; display: flex; align-items: center; gap: .4rem; transition: all .2s; white-space: nowrap; }
  .mega-nav-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
  .mega-nav-btn.primary { background: #0f172a; color: #fff; border-color: #0f172a; }
  .mega-nav-btn.primary:hover { background: #1e40af; border-color: #1e40af; }
  .mega-nav-btn .badge { background: #dc2626; color: #fff; border-radius: 99px; font-size: .7rem; padding: .1rem .45rem; margin-left: .1rem; }
  .mega-overlay { position: fixed; inset: 0; top: 72px; background: rgba(15,23,42,.45); backdrop-filter: blur(2px); z-index: 490; animation: fadeInOverlay .2s ease; }
  @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
  .mega-menu { position: fixed; top: 72px; left: 0; right: 0; z-index: 495; background: #fff; border-bottom: 1px solid #e2e8f0; box-shadow: 0 16px 48px rgba(0,0,0,.1); display: flex; animation: megaSlideIn .25s cubic-bezier(.4,0,.2,1); max-height: calc(100vh - 72px); overflow: hidden; }
  @keyframes megaSlideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
  .mega-sidebar { width: 260px; flex-shrink: 0; background: #f8fafc; border-right: 1px solid #e2e8f0; overflow-y: auto; padding: 1rem 0; }
  .mega-sidebar-item { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1.25rem; cursor: pointer; font-family: 'Inter', sans-serif; font-size: .9rem; font-weight: 500; color: #334155; transition: all .15s; border-left: 3px solid transparent; gap: .75rem; }
  .mega-sidebar-item:hover, .mega-sidebar-item.aktywny { background: #fff; border-left-color: #2563eb; color: #1e40af; }
  .mega-sidebar-item .ikona { font-size: 1.1rem; flex-shrink: 0; }
  .mega-sidebar-item .strzalka { color: #94a3b8; font-size: .75rem; flex-shrink: 0; }
  .mega-content { flex: 1; padding: 2rem 2.5rem; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 2rem; align-content: start; }
  .mega-group-title { font-family: 'Poppins', sans-serif; font-size: .85rem; font-weight: 700; color: #1e40af; margin-bottom: .75rem; text-decoration: none; display: block; transition: color .15s; }
  .mega-group-title:hover { color: #1e3a8a; text-decoration: underline; }
  .mega-sub-link { display: block; font-size: .85rem; color: #475569; padding: .3rem 0; text-decoration: none; transition: color .15s; font-family: 'Inter', sans-serif; }
  .mega-sub-link:hover { color: #1e40af; }

  /* User dropdown */
  .mega-user-dropdown { position: relative; }
  .mega-user-menu { position: absolute; top: calc(100% + 8px); right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); min-width: 200px; overflow: hidden; z-index: 600; animation: megaSlideIn .2s ease; }
  .mega-user-menu a, .mega-user-menu button { display: flex; align-items: center; gap: .6rem; width: 100%; padding: .75rem 1.25rem; font-family: 'Inter', sans-serif; font-size: .875rem; color: #334155; text-decoration: none; background: none; border: none; cursor: pointer; transition: background .15s; }
  .mega-user-menu a:hover, .mega-user-menu button:hover { background: #f8fafc; }
  .mega-user-menu hr { border: none; border-top: 1px solid #e2e8f0; margin: 0; }
  .mega-user-menu .logout-btn { color: #dc2626; }
`;

const FALLBACK_CATEGORIES = [
  { id_kategorii: 1, nazwa: 'Laptopy', podkategorie: [{ id_kategorii: 10, nazwa: 'Laptopy biznesowe', podkategorie: [] }, { id_kategorii: 11, nazwa: 'Laptopy do grafiki', podkategorie: [] }] },
  { id_kategorii: 2, nazwa: 'Drony',   podkategorie: [{ id_kategorii: 20, nazwa: 'Drony fotograficzne', podkategorie: [] }] },
  { id_kategorii: 3, nazwa: 'Aparaty', podkategorie: [{ id_kategorii: 30, nazwa: 'Aparaty bezlusterkowe', podkategorie: [] }] },
  { id_kategorii: 4, nazwa: 'Projektory', podkategorie: [{ id_kategorii: 40, nazwa: 'Projektory przenośne', podkategorie: [] }] },
  { id_kategorii: 5, nazwa: 'Akcesoria', podkategorie: [{ id_kategorii: 50, nazwa: 'Karty pamięci', podkategorie: [] }] },
];

const IKONY = { 'Laptopy': '💻', 'Drony': '🚁', 'Aparaty': '📷', 'Projektory': '📽️', 'Akcesoria': '🎧', 'Komputery': '🖥️', 'Tablety': '📱' };
function getIkona(nazwa = '') {
  for (const [k, v] of Object.entries(IKONY)) {
    if (nazwa.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '📦';
}

export default function MegaMenu() {
  const [menuOtwarte, setMenuOtwarte]         = useState(false);
  const [aktywnaKategoria, setAktywnaKategoria] = useState(null);
  const [kategorie, setKategorie]             = useState([]);
  const [cartCount, setCartCount]             = useState(0);
  const [scrolled, setScrolled]               = useState(false);
  const [szukajQuery, setSzukajQuery]         = useState('');
  const [userMenuOpen, setUserMenuOpen]       = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { uzytkownik, czyZalogowany, wyloguj } = useAuth();
  const userMenuRef = useRef(null);

  useEffect(() => {
    axios.get('/kategorie')
      .then(r => {
        const data = r.data?.length ? r.data : FALLBACK_CATEGORIES;
        setKategorie(data);
        setAktywnaKategoria(data[0]);
      })
      .catch(() => {
        setKategorie(FALLBACK_CATEGORIES);
        setAktywnaKategoria(FALLBACK_CATEGORIES[0]);
      });
  }, []);

  const updateCartCount = useCallback(() => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartCount(cart.length);
  }, []);

  useEffect(() => {
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, [updateCartCount]);

  useEffect(() => { updateCartCount(); }, [location, updateCartCount]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const tag = document.createElement('style');
    tag.id = 'mega-styles';
    tag.textContent = STYLE_MEGA;
    if (!document.getElementById('mega-styles')) document.head.appendChild(tag);
    return () => { const el = document.getElementById('mega-styles'); if (el) el.remove(); };
  }, []);

  useEffect(() => { setMenuOtwarte(false); setUserMenuOpen(false); }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSzukaj = (e) => {
    e.preventDefault();
    if (szukajQuery.trim()) {
      navigate(`/?szukaj=${encodeURIComponent(szukajQuery.trim())}`);
      setMenuOtwarte(false);
    }
  };

  const handleWyloguj = async () => {
    setUserMenuOpen(false);
    await wyloguj();
    navigate('/');
  };

  const grupujPodkategorie = (podkategorie = []) => {
    const SIZE = 5;
    const grupy = [];
    for (let i = 0; i < podkategorie.length; i += SIZE) grupy.push(podkategorie.slice(i, i + SIZE));
    return grupy;
  };

  const imie = uzytkownik?.imie || uzytkownik?.name?.split(' ')[0] || 'Konto';

  return (
    <>
      <nav className={`mega-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="mega-nav-inner">
          <Link to="/" className="mega-logo">Kiosk IT<span>.</span></Link>

          <button className={`mega-trigger ${menuOtwarte ? 'aktywny' : ''}`} onClick={() => setMenuOtwarte(v => !v)} aria-expanded={menuOtwarte}>
            <div className="hamburger"><span/><span/><span/></div>
            Wszystkie kategorie
          </button>

          <form className="mega-search-wrap" onSubmit={handleSzukaj}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" className="mega-search" placeholder="Szukaj sprzętu, marki, modelu..."
              value={szukajQuery} onChange={e => setSzukajQuery(e.target.value)} />
          </form>

          <div className="mega-nav-actions">
            {czyZalogowany ? (
              <>
                <Link to="/ulubione" className="mega-nav-btn" title="Moje ulubione">♡ Ulubione</Link>
                {uzytkownik?.rola === 'admin' && <Link to="/admin" className="mega-nav-btn">⚙️ Admin</Link>}

                <div className="mega-user-dropdown" ref={userMenuRef}>
                  <button className="mega-nav-btn" onClick={() => setUserMenuOpen(v => !v)}>
                    👤 {imie} ▾
                  </button>
                  {userMenuOpen && (
                    <div className="mega-user-menu">
                      <Link to="/panel">👤 &nbsp;Mój panel</Link>
                      <Link to="/panel">📦 &nbsp;Moje wypożyczenia</Link>
                      <hr />
                      <button className="logout-btn" onClick={handleWyloguj}>⬅ &nbsp;Wyloguj się</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/logowanie"  className="mega-nav-btn">👤 Zaloguj się</Link>
                <Link to="/rejestracja" className="mega-nav-btn">✨ Rejestracja</Link>
              </>
            )}

            <Link to="/koszyk" className="mega-nav-btn primary">
              🛒 Koszyk
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </nav>

      {menuOtwarte && (
        <>
          <div className="mega-overlay" onClick={() => setMenuOtwarte(false)} />
          <div className="mega-menu" role="navigation" aria-label="Katalog kategorii">
            <div className="mega-sidebar">
              {kategorie.map(kat => (
                <div key={kat.id_kategorii}
                  className={`mega-sidebar-item ${aktywnaKategoria?.id_kategorii === kat.id_kategorii ? 'aktywny' : ''}`}
                  onMouseEnter={() => setAktywnaKategoria(kat)}
                  onClick={() => { navigate(`/?kategoria=${kat.id_kategorii}`); setMenuOtwarte(false); }}
                  role="menuitem" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/?kategoria=${kat.id_kategorii}`)}
                >
                  <span className="ikona">{getIkona(kat.nazwa)}</span>
                  <span style={{ flex: 1 }}>{kat.nazwa}</span>
                  {kat.podkategorie?.length > 0 && <span className="strzalka">›</span>}
                </div>
              ))}
            </div>

            <div className="mega-content">
              {aktywnaKategoria?.podkategorie?.length > 0
                ? grupujPodkategorie(aktywnaKategoria.podkategorie).map((grupa, gi) => (
                    <div key={gi}>
                      <Link to={`/?kategoria=${aktywnaKategoria.id_kategorii}`} className="mega-group-title" onClick={() => setMenuOtwarte(false)}>
                        {gi === 0 ? `Wszystkie: ${aktywnaKategoria.nazwa}` : `${aktywnaKategoria.nazwa} — więcej`}
                      </Link>
                      {grupa.map(pod => (
                        <Link key={pod.id_kategorii} to={`/?kategoria=${pod.id_kategorii}`} className="mega-sub-link" onClick={() => setMenuOtwarte(false)}>
                          {pod.nazwa}
                        </Link>
                      ))}
                    </div>
                  ))
                : <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Wybierz kategorię z listy</div>
              }
            </div>
          </div>
        </>
      )}
    </>
  );
}