import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .koszyk-wrap { font-family: 'Plus Jakarta Sans', sans-serif; max-width: 1100px; margin: 0 auto; padding: 2rem 2rem 4rem; }
  .koszyk-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; transition: box-shadow 0.2s, border-color 0.2s; }
  .koszyk-card:hover { box-shadow: 0 6px 20px rgba(37,99,235,0.08); border-color: #bfdbfe; }
  .koszyk-summary { background: #0f172a; border-radius: 16px; padding: 1.75rem; color: #fff; position: sticky; top: 90px; }
  .koszyk-btn { width: 100%; padding: 1rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.3); text-transform: uppercase; letter-spacing: 0.05em; }
  .koszyk-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
  .koszyk-btn-ghost { width: 100%; padding: 0.75rem; background: transparent; color: rgba(255,255,255,0.6); border: 1.5px solid rgba(255,255,255,0.15); border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; margin-top: 0.75rem; transition: all 0.2s; }
  .koszyk-btn-ghost:hover { background: rgba(255,255,255,0.08); color: #fff; }
  .koszyk-remove { background: #fef2f2; border: none; border-radius: 8px; padding: 0.4rem 0.7rem; color: #dc2626; cursor: pointer; font-size: 0.8rem; font-weight: 700; transition: all 0.15s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .koszyk-remove:hover { background: #fee2e2; }
  .koszyk-empty { background: #fff; border: 1.5px dashed #e2e8f0; border-radius: 16px; padding: 4rem 2rem; text-align: center; }
`;

export default function Koszyk() {
  const [cart, setCart] = useState([]);
  const navigate        = useNavigate();

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart')) || []);
  }, []);

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('storage'));
  };

  const total    = cart.reduce((acc, item) => acc + parseFloat(item.suma || 0), 0);
  const vat      = total - total / 1.23;
  const totalDni = cart.reduce((acc, item) => acc + (item.dni || 0), 0);

  return (
    <div className="koszyk-wrap">
      <style>{CSS}</style>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
          Twój koszyk
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>
          {cart.length === 0 ? 'Koszyk jest pusty' : `${cart.length} ${cart.length === 1 ? 'pozycja' : cart.length < 5 ? 'pozycje' : 'pozycji'}`}
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="koszyk-empty">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>Nic tu nie ma</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Dodaj sprzęt z katalogu, aby złożyć zamówienie.</p>
          <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '0.85rem 2rem', borderRadius: '10px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            Przeglądaj katalog
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>

          {/* Lista pozycji */}
          <div>
            {cart.map((item, index) => (
              <div key={index} className="koszyk-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                  {/* Ikona i dane sprzętu */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
                      {getCartIcon(item.marka, item.model)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: '0.2rem' }}>
                        {item.marka} {item.model}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.35rem' }}>
                        📅 {item.data_start} → {item.data_koniec}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: '99px' }}>
                          {item.dni} {item.dni === 1 ? 'dzień' : 'dni'}
                        </span>
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.6rem', borderRadius: '99px' }}>
                          {parseFloat(item.suma / item.dni).toFixed(2)} zł/dzień
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cena i usuwanie */}
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.5rem' }}>
                      {parseFloat(item.suma).toFixed(2)} zł
                    </div>
                    <button className="koszyk-remove" onClick={() => removeItem(index)}>
                      Usuń
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Informacja o kontynuowaniu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#2563eb', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', padding: 0 }}>
                ← Kontynuuj zakupy
              </button>
            </div>
          </div>

          {/* Panel podsumowania */}
          <div className="koszyk-summary">
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 1.5rem' }}>
              Podsumowanie
            </h3>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.marka} {item.model}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{parseFloat(item.suma).toFixed(2)} zł</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem' }}>
                <span>Łączny czas:</span>
                <span>{totalDni} {totalDni === 1 ? 'dzień' : 'dni'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem' }}>
                <span>Netto:</span>
                <span>{(total / 1.23).toFixed(2)} zł</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.75rem' }}>
                <span>VAT (23%):</span>
                <span>{vat.toFixed(2)} zł</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 800, color: '#fff', paddingTop: '0.75rem', borderTop: '2px solid rgba(255,255,255,0.15)' }}>
                <span>Łącznie:</span>
                <span>{total.toFixed(2)} zł</span>
              </div>
            </div>

            <button className="koszyk-btn" onClick={() => navigate('/zamowienie')}>
              Przejdź do zamówienia →
            </button>
            <button className="koszyk-btn-ghost" onClick={() => navigate('/')}>
              Dodaj więcej sprzętu
            </button>

            <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              🔒 Rezerwacja jest potwierdzana po złożeniu zamówienia. Ceny zawierają VAT 23%.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mapuje markę/model koszyka na emoji
function getCartIcon(marka = '', model = '') {
  const t = `${marka} ${model}`.toLowerCase();
  if (t.includes('dji') || t.includes('mavic') || t.includes('drone')) return '🚁';
  if (t.includes('laptop') || t.includes('macbook') || t.includes('thinkpad') || t.includes('latitude') || t.includes('xps')) return '💻';
  if (t.includes('tablet') || t.includes('ipad') || t.includes('galaxy tab')) return '📱';
  if (t.includes('sony') || t.includes('canon') || t.includes('eos') || t.includes('a7')) return '📷';
  if (t.includes('projektor') || t.includes('epson') || t.includes('benq')) return '📽️';
  if (t.includes('rode') || t.includes('mikrofon') || t.includes('wireless go')) return '🎙️';
  if (t.includes('gimbal') || t.includes('statyw') || t.includes('manfrotto') || t.includes('befree')) return '🎬';
  if (t.includes('gopro') || t.includes('hero')) return '🎥';
  if (t.includes('godox') || t.includes('aputure') || t.includes('led')) return '💡';
  return '🖥️';
}