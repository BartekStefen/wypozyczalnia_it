import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL   = 'http://127.0.0.1:8000/api/sprzet';
const ADMIN_PIN = '2137';

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap');

  :root {
    --brand-primary:   #2563eb;
    --brand-dark:      #1e40af;
    --brand-accent:    #eff6ff;
    --surface:         #ffffff;
    --surface-2:       #f8fafc;
    --surface-3:       #f1f5f9;
    --border:          #e2e8f0;
    --text-primary:    #0f172a;
    --text-secondary:  #475569;
    --text-muted:      #94a3b8;
    --success:         #059669;
    --warning:         #d97706;
    --danger:          #dc2626;
    --shadow-sm:       0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md:       0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg:       0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    --shadow-hover:    0 25px 50px -12px rgba(37, 99, 235, 0.25);
    --radius-sm:       8px;
    --radius-md:       16px;
    --radius-lg:       24px;
    --transition:      all .3s cubic-bezier(.4,0,.2,1);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: var(--surface-2); color: var(--text-primary); -webkit-font-smoothing: antialiased; }

  /* Hero Banner */
  .kiosk-hero { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 4rem 2rem 3rem; color: #fff; position: relative; overflow: hidden; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .kiosk-hero::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='30'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); pointer-events: none; }
  .kiosk-hero h1 { font-family: 'Poppins', sans-serif; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; letter-spacing: -1px; margin-bottom: 1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; }
  .kiosk-hero p { font-size: 1.1rem; opacity: .9; max-width: 600px; margin: 0 auto 2.5rem; line-height: 1.6; position: relative; }

  /* Liczniki statystyk w hero */
  .hero-stats { display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap; position: relative; }
  .hero-stat { text-align: center; }
  .hero-stat-value { font-family: 'Poppins', sans-serif; font-size: 2rem; font-weight: 800; color: #fff; line-height: 1; }
  .hero-stat-label { font-size: 0.8rem; opacity: .7; margin-top: .25rem; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Sticky filtr bar */
  .filters-bar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 1.25rem 2rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; justify-content: center; box-shadow: var(--shadow-sm); position: sticky; top: 72px; z-index: 50; }
  .filters-bar.scrolled { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  .search-input-wrap { position: relative; flex: 1; min-width: 250px; max-width: 400px; }
  .search-input-wrap svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
  .search-input { width: 100%; padding: .75rem 1rem .75rem 2.75rem; border: 1px solid var(--border); border-radius: 99px; font-family: 'Inter', sans-serif; font-size: .9rem; color: var(--text-primary); background: var(--surface-2); transition: var(--transition); outline: none; }
  .search-input:focus { border-color: var(--brand-primary); background: var(--surface); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }

  .filter-chip { padding: .6rem 1.25rem; border: 1px solid var(--border); border-radius: 99px; background: var(--surface); font-family: 'Inter', sans-serif; font-size: .875rem; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: var(--transition); white-space: nowrap; }
  .filter-chip:hover { border-color: var(--text-muted); background: var(--surface-2); }
  .filter-chip.active { background: var(--text-primary); border-color: var(--text-primary); color: #fff; }

  /* Licznik wyników + sortowanie */
  .results-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 2rem 0; max-width: 1400px; margin: 0 auto; flex-wrap: wrap; gap: .75rem; }
  .results-count { font-size: .9rem; color: var(--text-secondary); }
  .results-count strong { color: var(--text-primary); font-weight: 700; }
  .sort-select { padding: .5rem 1rem; border: 1px solid var(--border); border-radius: 99px; font-family: 'Inter', sans-serif; font-size: .875rem; font-weight: 500; color: var(--text-secondary); background: var(--surface); cursor: pointer; outline: none; transition: var(--transition); }
  .sort-select:focus { border-color: var(--brand-primary); }

  /* Siatka kart */
  .equipment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; padding: 1.5rem 2rem 3rem; max-width: 1400px; margin: 0 auto; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

  .eq-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; transition: var(--transition); cursor: pointer; position: relative; opacity: 0; animation: fadeUp 0.45s ease both; }
  .eq-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-hover); border-color: rgba(37,99,235,0.3); }

  .eq-card-image-wrapper { background: var(--surface-3); height: 220px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .eq-card-image-placeholder { font-size: 4rem; opacity: 0.5; transition: var(--transition); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05)); }
  .eq-card:hover .eq-card-image-placeholder { transform: scale(1.1); opacity: 0.8; }

  .eq-status-badge-absolute { position: absolute; top: 1rem; right: 1rem; z-index: 2; }

  .eq-card-body { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; gap: .75rem; }
  .eq-title { font-family: 'Poppins', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
  .eq-serial { font-size: .85rem; color: var(--text-muted); font-family: monospace; background: var(--surface-2); padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block; width: fit-content; }

  .eq-price-row { margin-top: auto; padding-top: 1rem; border-top: 1px dashed var(--border); display: flex; justify-content: space-between; align-items: flex-end; }
  .eq-price-label { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.2rem; }
  .eq-price { font-family: 'Poppins', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
  .eq-price span { font-size: .85rem; font-weight: 500; color: var(--text-muted); font-family: 'Inter', sans-serif; }

  .eq-card-footer { padding: 0 1.5rem 1.5rem; background: var(--surface); }

  .status-badge { display: inline-flex; align-items: center; gap: .35rem; padding: .4rem .8rem; border-radius: 99px; font-size: .75rem; font-weight: 700; letter-spacing: .3px; text-transform: uppercase; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); box-shadow: var(--shadow-sm); }
  .status-badge::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  .status-dostepny    { color: var(--success); }
  .status-wypozyczony { color: var(--danger); }
  .status-serwis      { color: var(--warning); }
  .status-default     { color: var(--text-secondary); }

  .btn-primary-custom { width: 100%; padding: .8rem 1.5rem; background: var(--text-primary); color: #fff; border: none; border-radius: 99px; font-family: 'Inter', sans-serif; font-size: .95rem; font-weight: 600; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: .5rem; }
  .btn-primary-custom:hover:not(:disabled) { background: var(--brand-primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
  .btn-primary-custom:disabled { background: var(--surface-3); color: var(--text-muted); cursor: not-allowed; transform: none; box-shadow: none; }

  /* Toast Notification */
  .toast-container { position: fixed; bottom: 2rem; right: 2rem; z-index: 9999; display: flex; flex-direction: column; gap: .75rem; pointer-events: none; }
  .toast { background: var(--text-primary); color: #fff; padding: 1rem 1.5rem; border-radius: var(--radius-md); font-family: 'Inter', sans-serif; font-size: .9rem; font-weight: 500; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: .75rem; animation: toastIn .35s cubic-bezier(.4,0,.2,1) both; max-width: 320px; pointer-events: all; }
  .toast.toast-exit { animation: toastOut .3s cubic-bezier(.4,0,.2,1) both; }
  .toast-icon { font-size: 1.2rem; flex-shrink: 0; }
  @keyframes toastIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes toastOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(10px) scale(0.95); } }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn .2s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal-box { background: var(--surface); border-radius: var(--radius-lg); width: 100%; max-width: 500px; box-shadow: var(--shadow-lg); animation: slideUp .3s cubic-bezier(.4,0,.2,1); overflow: hidden; border: 1px solid var(--border); }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .modal-head { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; background: var(--surface-2); }
  .modal-head h2 { font-family: 'Poppins', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
  .modal-close { width: 36px; height: 36px; border: none; border-radius: 50%; background: var(--surface); box-shadow: var(--shadow-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: var(--transition); font-size: 1rem; }
  .modal-close:hover { background: #fee2e2; color: var(--danger); }
  .modal-body-custom { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .field-label { display: block; font-size: .85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: .5rem; }
  .field-input { width: 100%; padding: .75rem 1rem; border: 2px solid var(--border); border-radius: var(--radius-sm); font-family: 'Inter', sans-serif; font-size: 1.1rem; color: var(--text-primary); outline: none; transition: var(--transition); text-align: center; font-weight: 600; }
  .field-input:focus { border-color: var(--brand-primary); }
  .price-summary { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  .price-summary-label { font-size: .9rem; color: var(--text-secondary); font-weight: 500; }
  .price-summary-total { font-family: 'Poppins', sans-serif; font-size: 1.75rem; font-weight: 700; color: var(--brand-primary); }
  .modal-foot { padding: 1.5rem 2rem; border-top: 1px solid var(--border); display: flex; gap: 1rem; justify-content: flex-end; background: var(--surface-2); }
  .btn-ghost { padding: .75rem 1.5rem; border: none; background: transparent; font-family: 'Inter', sans-serif; font-size: .95rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: var(--transition); }
  .btn-ghost:hover { color: var(--text-primary); }
  .btn-confirm { padding: .75rem 2rem; background: var(--brand-primary); color: #fff; border: none; border-radius: 99px; font-family: 'Inter', sans-serif; font-size: .95rem; font-weight: 600; cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: .5rem; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
  .btn-confirm:hover { background: var(--brand-dark); transform: translateY(-2px); }

  /* Koszyk */
  .cart-panel { position: fixed; top: 72px; right: 0; width: 400px; height: calc(100vh - 72px); background: var(--surface); border-left: 1px solid var(--border); box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 90; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .4s cubic-bezier(.4,0,.2,1); }
  .cart-panel.open { transform: translateX(0); }
  .cart-panel-head { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--surface-2); }
  .cart-panel-head h3 { font-family: 'Poppins', sans-serif; font-size: 1.2rem; font-weight: 700; }
  .cart-items { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .cart-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; position: relative; box-shadow: var(--shadow-sm); }
  .cart-item-title { font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 1rem; margin-bottom: .25rem; padding-right: 2rem; }
  .cart-item-meta { font-size: .85rem; color: var(--text-muted); }
  .cart-item-price { font-weight: 700; color: var(--brand-primary); margin-top: .75rem; font-size: 1.1rem; }
  .cart-item-remove { position: absolute; top: 1rem; right: 1rem; width: 28px; height: 28px; border: none; background: var(--surface-2); color: var(--text-muted); cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
  .cart-item-remove:hover { background: #fee2e2; color: var(--danger); }
  .cart-panel-foot { padding: 1.5rem; border-top: 1px solid var(--border); background: var(--surface-2); }
  .cart-total-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.25rem; }
  .cart-total-label { font-size: .9rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .cart-total-val { font-family: 'Poppins', sans-serif; font-size: 1.75rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
  .cart-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 1rem; font-size: 1rem; }

  /* Skeleton */
  .skeleton { background: linear-gradient(90deg, var(--surface-3) 25%, var(--border) 50%, var(--surface-3) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: var(--radius-sm); }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Admin i inne */
  .admin-wrap { padding: 2rem; max-width: 1200px; margin: 0 auto; }
  .admin-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
  .admin-table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; font-size: .9rem; box-shadow: var(--shadow-sm); }
  .admin-table th { background: var(--surface-2); padding: 1rem 1.5rem; text-align: left; font-size: .8rem; font-weight: 600; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
  .admin-table td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); color: var(--text-primary); vertical-align: middle; }
  .confirm-page { min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
  .confirm-card { background: var(--surface); border-radius: var(--radius-lg); padding: 3rem; max-width: 500px; width: 100%; text-align: center; box-shadow: var(--shadow-lg); border: 1px solid var(--border); }
  .pin-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(15,23,42,.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
  .pin-box { background: var(--surface); border-radius: var(--radius-lg); padding: 2.5rem; width: 100%; max-width: 400px; text-align: center; box-shadow: var(--shadow-lg); }
  .pin-input { width: 100%; padding: 1rem; border: 2px solid var(--border); border-radius: var(--radius-md); font-size: 1.5rem; letter-spacing: 1rem; text-align: center; font-family: 'Poppins', sans-serif; font-weight: 700; outline: none; margin-bottom: 1.5rem; }
  .empty-state { grid-column: 1/-1; text-align: center; padding: 5rem 2rem; }
`;

function getEquipmentIcon(marka = '', model = '') {
  const text = `${marka} ${model}`.toLowerCase();
  if (text.includes('drone') || text.includes('dron')) return '🚁';
  if (text.includes('laptop') || text.includes('macbook') || text.includes('notebook')) return '💻';
  if (text.includes('tablet') || text.includes('ipad')) return '📱';
  if (text.includes('aparat') || text.includes('camera') || text.includes('canon') || text.includes('sony')) return '📷';
  if (text.includes('projektor')) return '📽️';
  return '🖥️';
}

function StatusBadge({ status }) {
  const classMap = { 'Dostępny': 'status-dostepny', 'Wypożyczony': 'status-wypozyczony', 'Serwis': 'status-serwis' };
  return <span className={`status-badge ${classMap[status] ?? 'status-default'}`}>{status}</span>;
}

function SkeletonCard() {
  return (
    <div className="eq-card" style={{ pointerEvents: 'none', opacity: 1 }}>
      <div className="skeleton" style={{ height: 220, borderRadius: '24px 24px 0 0' }} />
      <div className="eq-card-body" style={{ gap: '1rem' }}>
        <div className="skeleton" style={{ height: 24, width: '80%' }} />
        <div className="skeleton" style={{ height: 16, width: '40%' }} />
        <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)' }}>
          <div className="skeleton" style={{ height: 28, width: 100 }} />
        </div>
      </div>
      <div className="eq-card-footer">
        <div className="skeleton" style={{ height: 48, width: '100%', borderRadius: 99 }} />
      </div>
    </div>
  );
}

function EquipmentCard({ item, onRentClick, index }) {
  const navigate  = useNavigate();
  const available = item.status === 'Dostępny';

  return (
    <div
      className="eq-card"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => navigate(`/sprzet/${item.id_egzemplarza}`)}
    >
      <div className="eq-status-badge-absolute">
        <StatusBadge status={item.status} />
      </div>
      <div className="eq-card-image-wrapper">
        <div className="eq-card-image-placeholder">
          {getEquipmentIcon(item.marka, item.nazwa_modelu)}
        </div>
      </div>
      <div className="eq-card-body">
        <div className="eq-title">{item.marka} {item.nazwa_modelu}</div>
        <div><span className="eq-serial">S/N: {item.numer_seryjny}</span></div>
        <div className="eq-price-row">
          <div>
            <div className="eq-price-label">Cena wynajmu</div>
            <div className="eq-price">{parseFloat(item.cena_wypozyczenia_dzien).toFixed(2)} zł <span>/ dzień</span></div>
          </div>
        </div>
      </div>
      <div className="eq-card-footer">
        <button
          className="btn-primary-custom"
          disabled={!available}
          onClick={(e) => { e.stopPropagation(); onRentClick(item); }}
        >
          {available ? 'Wypożycz sprzęt' : 'Tymczasowo niedostępny'}
        </button>
      </div>
    </div>
  );
}

function RentalModal({ item, onClose, onConfirm }) {
  const [days, setDays] = useState(1);
  const totalPrice = (days * item.cena_wypozyczenia_dzien).toFixed(2);
  const handleDaysChange = (e) => { const v = parseInt(e.target.value, 10); setDays(isNaN(v) || v < 1 ? 1 : v); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Rezerwacja: {item.marka} {item.nazwa_modelu}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body-custom">
          <div>
            <label className="field-label" htmlFor="rentalDays">Na ile dni potrzebujesz sprzętu?</label>
            <input id="rentalDays" type="number" className="field-input" value={days} min={1} onChange={handleDaysChange} />
          </div>
          <div className="price-summary">
            <div>
              <div className="price-summary-label">Podsumowanie</div>
              <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>{days} {days === 1 ? 'dzień' : 'dni'} × {item.cena_wypozyczenia_dzien} zł</div>
            </div>
            <div className="price-summary-total">{totalPrice} zł</div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn-confirm" onClick={() => { onConfirm({ item, days, totalPrice }); onClose(); }}>Potwierdź rezerwację</button>
        </div>
      </div>
    </div>
  );
}

function CartPanel({ isOpen, items, onRemove, onClose, onCheckout }) {
  const total = items.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0).toFixed(2);
  return (
    <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
      <div className="cart-panel-head">
        <h3>Koszyk ({items.length})</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      {items.length === 0 ? (
        <div className="cart-empty"><div style={{ fontSize: '3rem', opacity: 0.5 }}>🛒</div><span>Twój koszyk jest pusty</span></div>
      ) : (
        <>
          <div className="cart-items">
            {items.map((item, i) => (
              <div className="cart-item" key={i}>
                <button className="cart-item-remove" onClick={() => onRemove(i)}>✕</button>
                <div className="cart-item-title">{item.item.marka} {item.item.nazwa_modelu}</div>
                <div className="cart-item-meta">Wynajem na: {item.days} {item.days === 1 ? 'dzień' : 'dni'}</div>
                <div className="cart-item-price">{item.totalPrice} zł</div>
              </div>
            ))}
          </div>
          <div className="cart-panel-foot">
            <div className="cart-total-row">
              <div className="cart-total-label">Razem do zapłaty</div>
              <div className="cart-total-val">{total} zł</div>
            </div>
            <button className="btn-primary-custom" onClick={onCheckout} style={{ borderRadius: '8px', padding: '1rem' }}>Złóż zamówienie</button>
          </div>
        </>
      )}
    </div>
  );
}

function ConfirmationPage({ reservations, onBack }) {
  const total = reservations.reduce((sum, r) => sum + parseFloat(r.totalPrice), 0).toFixed(2);
  return (
    <div className="confirm-page">
      <div className="confirm-card">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontFamily: 'Poppins', fontSize: '2rem', marginBottom: '1rem' }}>Sukces!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Twoje zamówienie zostało przyjęte do realizacji.</p>
        <button className="btn-primary-custom" onClick={onBack} style={{ margin: '0 auto', maxWidth: '300px' }}>Wróć do katalogu</button>
      </div>
    </div>
  );
}

function AdminPinDialog({ onSuccess, onCancel }) {
  const [pin, setPin]     = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = () => {
    if (pin === ADMIN_PIN) { onSuccess(); }
    else { setError(true); setPin(''); setTimeout(() => setError(false), 2000); }
  };
  return (
    <div className="pin-overlay">
      <div className="pin-box">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
        <h3 style={{ fontFamily: 'Poppins', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Autoryzacja</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Podaj kod PIN administratora</p>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 600 }}>Nieprawidłowy kod PIN</div>}
        <input type="password" className="pin-input" value={pin} maxLength={4} placeholder="••••" autoFocus onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-ghost" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={onCancel}>Anuluj</button>
          <button className="btn-confirm" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSubmit}>Zaloguj</button>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ sprzet, onStatusChange }) {
  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2 style={{ fontFamily: 'Poppins', fontSize: '2rem' }}>Panel Administratora</h2>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>Sprzęt</th><th>Numer seryjny</th><th>Status</th><th>Akcja</th></tr>
        </thead>
        <tbody>
          {sprzet.map(item => (
            <tr key={item.id_egzemplarza}>
              <td style={{ fontWeight: 600 }}>{item.marka} {item.nazwa_modelu}</td>
              <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.numer_seryjny}</td>
              <td><StatusBadge status={item.status} /></td>
              <td>
                <button
                  style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', background: item.status === 'Dostępny' ? 'var(--surface-3)' : 'var(--text-primary)', color: item.status === 'Dostępny' ? 'var(--text-muted)' : '#fff', cursor: item.status === 'Dostępny' ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  disabled={item.status === 'Dostępny'}
                  onClick={() => onStatusChange(item.id_egzemplarza)}
                >
                  {item.status === 'Dostępny' ? 'W magazynie' : 'Zwróć sprzęt'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.exiting ? 'toast-exit' : ''}`}>
          <span className="toast-icon">{t.icon}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

const FILTERS = ['Wszystkie', 'Dostępny', 'Wypożyczony', 'Serwis'];
const SORT_OPTIONS = [
  { value: 'default',    label: 'Domyślnie' },
  { value: 'price_asc',  label: 'Cena: rosnąco' },
  { value: 'price_desc', label: 'Cena: malejąco' },
  { value: 'name_asc',   label: 'Nazwa: A–Z' },
];

export default function HomePage() {
  const [sprzet, setSprzet]               = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedItem, setSelectedItem]   = useState(null);
  const [cartItems, setCartItems]         = useState([]);
  const [cartOpen, setCartOpen]           = useState(false);
  const [view, setView]                   = useState('catalog');
  const [completedReservations, setCompletedReservations] = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeFilter, setActiveFilter]   = useState('Wszystkie');
  const [sortBy, setSortBy]               = useState('default');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [toasts, setToasts]               = useState([]);
  const [filtersScrolled, setFiltersScrolled] = useState(false);
  const toastCounter = useRef(0);

  useEffect(() => {
    const tag = document.createElement('style');
    tag.textContent = GLOBAL_STYLES;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  useEffect(() => {
    const handleScroll = () => setFiltersScrolled(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    axios.get(API_URL)
      .then(r => setSprzet(r.data))
      .catch(e => { console.error(e); setError('Nie udało się pobrać danych z serwera.'); })
      .finally(() => setIsLoading(false));
  }, []);

  const showToast = useCallback((message, icon = '✅') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, icon, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, 3000);
  }, []);

  const filteredSprzet = useMemo(() => {
    let result = sprzet.filter(item => {
      const matchFilter = activeFilter === 'Wszystkie' || item.status === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || `${item.marka} ${item.nazwa_modelu} ${item.numer_seryjny}`.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });

    if (sortBy === 'price_asc')  result = [...result].sort((a, b) => a.cena_wypozyczenia_dzien - b.cena_wypozyczenia_dzien);
    if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.cena_wypozyczenia_dzien - a.cena_wypozyczenia_dzien);
    if (sortBy === 'name_asc')   result = [...result].sort((a, b) => `${a.marka} ${a.nazwa_modelu}`.localeCompare(`${b.marka} ${b.nazwa_modelu}`));

    return result;
  }, [sprzet, activeFilter, searchQuery, sortBy]);

  const handleRentClick  = useCallback((item) => setSelectedItem(item), []);
  const handleModalClose = useCallback(() => setSelectedItem(null), []);

  const handleConfirm = useCallback(({ item, days, totalPrice }) => {
    setCartItems(prev => [...prev, { item, days, totalPrice }]);
    setCartOpen(true);
    showToast(`${item.marka} ${item.nazwa_modelu} dodano do koszyka`);
  }, [showToast]);

  const handleRemoveFromCart = useCallback((index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCheckout = () => {
    setCompletedReservations(cartItems);
    setCartItems([]);
    setCartOpen(false);
    setView('confirmation');
  };

  const handleStatusChange = useCallback(async (id) => {
    setSprzet(prev => prev.map(item => item.id_egzemplarza === id ? { ...item, status: 'Dostępny' } : item));
  }, []);

  const handleAdminClick = () => {
    if (adminUnlocked) setView('admin');
    else setShowPinDialog(true);
  };

  const dostepneCount    = useMemo(() => sprzet.filter(i => i.status === 'Dostępny').length, [sprzet]);
  const wypozyczoneCount = useMemo(() => sprzet.filter(i => i.status === 'Wypożyczony').length, [sprzet]);

  return (
    <>
      <ToastContainer toasts={toasts} />

      {showPinDialog && (
        <AdminPinDialog
          onSuccess={() => { setAdminUnlocked(true); setShowPinDialog(false); setView('admin'); }}
          onCancel={() => setShowPinDialog(false)}
        />
      )}

      <CartPanel isOpen={cartOpen} items={cartItems} onRemove={handleRemoveFromCart} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} />

      {view === 'confirmation' ? (
        <ConfirmationPage reservations={completedReservations} onBack={() => setView('catalog')} />
      ) : view === 'admin' ? (
        <AdminPanel sprzet={sprzet} onStatusChange={handleStatusChange} />
      ) : (
        <>
          <div className="kiosk-hero">
            <h1>Znajdź sprzęt dla siebie</h1>
            <p>Profesjonalne narzędzia do pracy i rozrywki. Wypożyczaj sprzęt IT na jasnych zasadach, szybko i wygodnie.</p>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">{sprzet.length || '—'}</div>
                <div className="hero-stat-label">Urządzeń w ofercie</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">{dostepneCount || '—'}</div>
                <div className="hero-stat-label">Dostępnych teraz</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">{wypozyczoneCount || '—'}</div>
                <div className="hero-stat-label">Aktywnych wypożyczeń</div>
              </div>
            </div>
          </div>

          <div className={`filters-bar ${filtersScrolled ? 'scrolled' : ''}`}>
            <div className="search-input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Szukaj po nazwie lub numerze seryjnym..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {FILTERS.map(f => (
              <button key={f} className={`filter-chip ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
            ))}
          </div>

          {!isLoading && !error && (
            <div className="results-toolbar">
              <p className="results-count">
                Wyświetlono <strong>{filteredSprzet.length}</strong> z <strong>{sprzet.length}</strong> urządzeń
              </p>
              <select
                className="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="equipment-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : error ? (
              <div className="empty-state"><h3>Ups, coś poszło nie tak</h3><p>{error}</p></div>
            ) : filteredSprzet.length === 0 ? (
              <div className="empty-state"><h3>Brak wyników</h3><p>Spróbuj zmienić parametry wyszukiwania.</p></div>
            ) : (
              filteredSprzet.map((item, i) => (
                <EquipmentCard key={item.id_egzemplarza} item={item} onRentClick={handleRentClick} index={i} />
              ))
            )}
          </div>
        </>
      )}

      {selectedItem && <RentalModal item={selectedItem} onClose={handleModalClose} onConfirm={handleConfirm} />}
    </>
  );
}