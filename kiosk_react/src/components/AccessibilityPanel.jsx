import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext(null);

const DOMYSLNE = { kontrast: 'normalny', rozmiarCzcionki: 100 };

const STYLE_WCAG = `
  [data-kontrast="wysoki"] {
    filter: contrast(1.5) !important;
    background: #000 !important;
    color: #fff !important;
  }
  [data-kontrast="wysoki"] .navbar,
  [data-kontrast="wysoki"] .card,
  [data-kontrast="wysoki"] .btn {
    background: #111 !important;
    color: #ffff00 !important;
    border-color: #ffff00 !important;
  }
  [data-kontrast="ciemny"] {
    background: #121212 !important;
    color: #e0e0e0 !important;
  }
  [data-kontrast="ciemny"] .navbar,
  [data-kontrast="ciemny"] nav { background: #1e1e1e !important; border-color: #333 !important; }
  [data-kontrast="ciemny"] .card,
  [data-kontrast="ciemny"] .bg-white,
  [data-kontrast="ciemny"] .bg-light { background: #2a2a2a !important; border-color: #444 !important; }
  [data-kontrast="ciemny"] .text-dark,
  [data-kontrast="ciemny"] .text-primary { color: #90caf9 !important; }
  [data-kontrast="ciemny"] .text-secondary,
  [data-kontrast="ciemny"] .text-muted { color: #aaa !important; }
  [data-kontrast="ciemny"] input,
  [data-kontrast="ciemny"] textarea,
  [data-kontrast="ciemny"] select { background: #333 !important; color: #e0e0e0 !important; border-color: #555 !important; }

/* Globalne reguły dla motywu ciemnego - obsługa tła i tekstu głównego */
  [data-kontrast="ciemny"] body, 
  [data-kontrast="ciemny"] #root {
    background-color: #0f172a !important;
    color: #f1f5f9 !important;
  }

  /* Stylizacja kart produktów i kontenerów w trybie ciemnym */
  [data-kontrast="ciemny"] .bg-white,
  [data-kontrast="ciemny"] .card,
  [data-kontrast="ciemny"] .shadow-xl {
    background-color: #1e293b !important;
    color: #f8fafc !important;
    border: 1px solid #334155 !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4) !important;
  }

  /* Ustawienia dla trybu wysokiego kontrastu (standard WCAG) */
  [data-kontrast="wysoki"] body {
    background-color: #000000 !important;
    color: #ffffff !important;
  }
  [data-kontrast="wysoki"] .btn, 
  [data-kontrast="wysoki"] button {
    border: 2px solid #ffff00 !important;
    color: #ffff00 !important;
    background: #000 !important;
  }

  /* Pozycjonowanie i wygląd ikony wywołującej panel (prawy górny róg) */
  .wcag-toggle {
    position: fixed;
    top: 2rem;
    right: 0;
    z-index: 9999;
    width: 44px;
    height: 48px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    box-shadow: -2px 4px 12px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
  }

  /* Główny kontener ustawień dostępności */
  .wcag-panel {
    position: fixed;
    top: 2rem;
    right: 3.5rem;
    z-index: 9998;
    background: #ffffff;
    width: 300px;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    font-family: 'Inter', sans-serif;
    overflow: hidden;
  }

  /* Dostosowanie panelu do motywu ciemnego */
  [data-kontrast="ciemny"] .wcag-panel {
    background: #1e293b !important;
    border-color: #334155;
    color: #ffffff;
  }


  .wcag-toggle:hover { transform: scale(1.1); box-shadow: 0 8px 24px rgba(30,64,175,0.45); }
  .wcag-header {
    padding: 1rem 1.25rem;
    background: #1e40af;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .wcag-header h4 { font-size: .9rem; font-weight: 700; margin: 0; letter-spacing: .3px; }
  .wcag-close { background: none; border: none; color: #fff; cursor: pointer; font-size: 1.1rem; opacity: .8; transition: opacity .2s; }
  .wcag-close:hover { opacity: 1; }
  .wcag-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }
  .wcag-section-label { font-size: .75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: .5rem; }
  .wcag-chips { display: flex; gap: .5rem; flex-wrap: wrap; }
  .wcag-chip {
    padding: .4rem .85rem;
    border-radius: 99px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
    color: #475569;
  }
  .wcag-chip.aktywny { background: #1e40af; border-color: #1e40af; color: #fff; }
  .wcag-font-row { display: flex; align-items: center; justify-content: space-between; }
  .wcag-font-btn { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid #e2e8f0; background: #f8fafc; font-weight: 700; font-size: .9rem; cursor: pointer; transition: all .2s; color: #1e40af; display: flex; align-items: center; justify-content: center; }
  .wcag-font-btn:hover { background: #eff6ff; border-color: #1e40af; }
  .wcag-font-val { font-weight: 700; font-size: 1rem; color: #0f172a; min-width: 48px; text-align: center; }
  .wcag-reset { width: 100%; padding: .6rem; background: #f1f5f9; border: none; border-radius: 8px; font-size: .8rem; font-weight: 600; color: #475569; cursor: pointer; transition: all .2s; }
  .wcag-reset:hover { background: #e2e8f0; color: #0f172a; }
`;

export function AccessibilityProvider({ children }) {
  const [preferencje, setPreferencje] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wcag')) || DOMYSLNE; }
    catch { return DOMYSLNE; }
  });

  useEffect(() => {
    localStorage.setItem('wcag', JSON.stringify(preferencje));
    document.documentElement.setAttribute('data-kontrast', preferencje.kontrast);
    document.documentElement.style.fontSize = `${preferencje.rozmiarCzcionki}%`;
  }, [preferencje]);

  const ustawKontrast   = (k) => setPreferencje(p => ({ ...p, kontrast: k }));
  const zwiekszCzcionke = () => setPreferencje(p => ({ ...p, rozmiarCzcionki: Math.min(p.rozmiarCzcionki + 10, 150) }));
  const zmniejszCzcionke = () => setPreferencje(p => ({ ...p, rozmiarCzcionki: Math.max(p.rozmiarCzcionki - 10, 80) }));
  const resetuj = () => setPreferencje(DOMYSLNE);

  return (
    <AccessibilityContext.Provider value={{ preferencje, ustawKontrast, zwiekszCzcionke, zmniejszCzcionke, resetuj }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

export default function AccessibilityPanel() {
  const [otwarty, setOtwarty] = useState(false);
  const { preferencje, ustawKontrast, zwiekszCzcionke, zmniejszCzcionke, resetuj } = useAccessibility();

  useEffect(() => {
    const tag = document.createElement('style');
    tag.id = 'wcag-styles';
    tag.textContent = STYLE_WCAG;
    if (!document.getElementById('wcag-styles')) document.head.appendChild(tag);
    return () => { const el = document.getElementById('wcag-styles'); if (el) el.remove(); };
  }, []);

  const KONTRASTY = [
    { klucz: 'normalny', etykieta: 'Normalny' },
    { klucz: 'ciemny',   etykieta: '🌙 Ciemny' },
    { klucz: 'wysoki',   etykieta: '⚡ Wysoki kontrast' },
  ];

  if (!otwarty) {
    return (
      <button className="wcag-toggle" onClick={() => setOtwarty(true)} aria-label="Otwórz panel dostępności" title="Dostępność (WCAG)">
        ♿
      </button>
    );
  }

  return (
    <div className="wcag-panel" role="dialog" aria-label="Panel dostępności">
      <div className="wcag-header">
        <h4>♿ Dostępność (WCAG)</h4>
        <button className="wcag-close" onClick={() => setOtwarty(false)} aria-label="Zamknij">✕</button>
      </div>
      <div className="wcag-body">
        <div>
          <div className="wcag-section-label">Motyw kolorystyczny</div>
          <div className="wcag-chips">
            {KONTRASTY.map(k => (
              <button
                key={k.klucz}
                className={`wcag-chip ${preferencje.kontrast === k.klucz ? 'aktywny' : ''}`}
                onClick={() => ustawKontrast(k.klucz)}
              >
                {k.etykieta}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="wcag-section-label">Rozmiar czcionki</div>
          <div className="wcag-font-row">
            <button className="wcag-font-btn" onClick={zmniejszCzcionke} aria-label="Zmniejsz czcionkę">A−</button>
            <span className="wcag-font-val">{preferencje.rozmiarCzcionki}%</span>
            <button className="wcag-font-btn" onClick={zwiekszCzcionke} aria-label="Zwiększ czcionkę">A+</button>
          </div>
        </div>

        <button className="wcag-reset" onClick={resetuj}>↺ Przywróć ustawienia domyślne</button>
      </div>
    </div>
  );
}