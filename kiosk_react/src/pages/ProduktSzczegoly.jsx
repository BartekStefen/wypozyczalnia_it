import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays, differenceInDays, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

const CSS = `
  .product-main-img { width: 100%; height: 500px; object-fit: cover; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: 0.5s; }
  .product-main-img:hover { transform: scale(1.02); }
  .stat-block { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; text-align: center; flex: 1; transition: 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .stat-block:hover { border-color: #1e40af; transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
  .stat-icon { font-size: 1.5rem; margin-bottom: 8px; }
  .stat-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
  .stat-value { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
  .rent-card { border-radius: 24px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
  .calendar-trigger { width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 16px; background: #f8fafc; cursor: pointer; transition: 0.3s; text-align: center; }
  .calendar-trigger:hover { border-color: #1e40af; background: #fff; }
  .date-block { flex: 1; padding: 15px; border-radius: 16px; border: 2px solid #f1f5f9; background: #fff; text-align: center; transition: 0.3s; }
  .date-block.active { border-color: #1e40af; background: #eff6ff; }
  .date-block-label { font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 4px; }
  .date-block-value { font-size: 1.1rem; font-weight: 700; color: #1e293b; }
  .review-card { border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
  .star-btn { font-size: 1.8rem; color: #cbd5e1; cursor: pointer; transition: 0.2s; background: none; border: none; }
  .star-btn.active { color: #f59e0b; }
  .btn-premium { background: #1e40af; border: none; transition: 0.3s; color: white; }
  .btn-premium:hover { background: #1e3a8a; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(30,64,175,0.2); }
  .btn-premium:disabled { background: #94a3b8; transform: none; }
  .btn-fav { background: transparent; border: 2px solid #e2e8f0; border-radius: 16px; padding: 14px; cursor: pointer; transition: all 0.3s; font-size: 1.2rem; width: 52px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .btn-fav:hover { border-color: #e05252; background: #fef2f2; }
  .btn-fav.active { border-color: #e05252; background: #fef2f2; }
  .toast-prod { position: fixed; bottom: 2rem; right: 2rem; background: #0f172a; color: #fff; padding: 1rem 1.5rem; border-radius: 12px; font-family: 'Inter', sans-serif; font-size: 0.9rem; z-index: 9999; animation: toastProdIn 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
  @keyframes toastProdIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function ProduktSzczegoly() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { czyZalogowany } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState(null);
  const [isFav, setIsFav] = useState(false);

  const [dateRange, setDateRange] = useState([new Date(), addDays(new Date(), 3)]);
  const [startDate, endDate] = dateRange;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    axios.get(`/sprzet/${id}`)
      .then(res => { setItem(res.data); setLoading(false); })
      .catch(() => setLoading(false));
    return () => document.head.removeChild(s);
  }, [id]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const dni = endDate ? Math.max(1, differenceInDays(endDate, startDate)) : 1;
  const suma = item ? (dni * parseFloat(item.cena_wypozyczenia_dzien)).toFixed(2) : 0;

  const handleAddToCart = () => {
    if (!endDate) { showToast("⚠️ Wybierz datę zwrotu!"); return; }
    setIsAdding(true);

    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    const newItem = {
      id_egzemplarza: item.id_egzemplarza,
      marka:          item.marka,
      model:          item.nazwa_modelu,
      data_start:     format(startDate, 'yyyy-MM-dd'),
      data_koniec:    format(endDate, 'yyyy-MM-dd'),
      dni,
      suma,
    };

    localStorage.setItem('cart', JSON.stringify([...currentCart, newItem]));
    window.dispatchEvent(new Event('storage'));

    setTimeout(() => {
      showToast("✅ Dodano do koszyka!");
      setIsAdding(false);
    }, 400);
  };

  const handleToggleFav = async () => {
    if (!czyZalogowany) { navigate('/logowanie'); return; }
    if (isFav) {
      setIsFav(false);
      showToast("💔 Usunięto z ulubionych");
    } else {
      try {
        await axios.post('/ulubione', { sprzet_id: item.id_egzemplarza });
      } catch {}
      setIsFav(true);
      showToast("❤️ Dodano do ulubionych");
    }
  };

  const handleReview = (e) => {
    e.preventDefault();
    if (!czyZalogowany) { navigate('/logowanie'); return; }
    if (!rating) { showToast("⚠️ Wybierz ocenę!"); return; }
    showToast("✅ Opinia opublikowana. Dziękujemy!");
    setRating(0);
    setComment('');
  };

  if (loading) return <div className="p-5 text-center fw-bold">Wczytywanie...</div>;
  if (!item)   return <div className="p-5 text-center">Błąd: Nie znaleziono sprzętu.</div>;

  return (
    <div className="container mt-5 pt-4 pb-5">
      {toast && <div className="toast-prod">{toast}</div>}

      <button onClick={() => navigate('/')} className="btn btn-link text-dark fw-bold mb-4 text-decoration-none p-0">
        ← POWRÓT DO OFERTY
      </button>

      <div className="row g-5">
        <div className="col-lg-7">
          <img
            src="https://images.unsplash.com/photo-1517336712461-489a7a561ad8?auto=format&fit=crop&q=80&w=1200"
            className="product-main-img mb-4"
            alt={`${item.marka} ${item.nazwa_modelu}`}
          />

          <div className="d-flex gap-3 mb-5">
            <div className="stat-block shadow-sm">
              <span className="stat-icon">⚡</span>
              <div className="stat-label">Dostępność</div>
              <div className={`stat-value ${item.status === 'Dostępny' ? 'text-success' : 'text-danger'}`}>{item.status}</div>
            </div>
            <div className="stat-block shadow-sm">
              <span className="stat-icon">🏷️</span>
              <div className="stat-label">Marka</div>
              <div className="stat-value">{item.marka}</div>
            </div>
            <div className="stat-block shadow-sm">
              <span className="stat-icon">💻</span>
              <div className="stat-label">Model</div>
              <div className="stat-value">{item.nazwa_modelu}</div>
            </div>
            <div className="stat-block shadow-sm">
              <span className="stat-icon">✨</span>
              <div className="stat-label">Stan</div>
              <div className="stat-value">Premium A+</div>
            </div>
          </div>

          <div className="bg-white rounded-4 shadow-sm p-5 mb-5 border-0">
            <h3 className="fw-bold mb-4">O urządzeniu</h3>
            <p className="text-secondary" style={{ lineHeight: '1.9', fontSize: '1.1rem' }}>
              Model <strong>{item.marka} {item.nazwa_modelu}</strong> to profesjonalny wybór dla osób szukających niezawodności.
              Został poddany pełnej inspekcji technicznej. System jest czysty i gotowy do Twojej konfiguracji.
            </p>
          </div>

          <div className="bg-white rounded-4 shadow-sm p-5 border-0">
            <h4 className="fw-bold mb-5">Opinie użytkowników</h4>
            <div className="review-card">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-bold">Rafał P.</span>
                <span className="text-warning">★★★★★</span>
              </div>
              <p className="small text-muted mb-0">Wszystko działało bez zarzutu. Polecam!</p>
            </div>

            <div className="mt-5 pt-4 border-top">
              <h5 className="fw-bold mb-4">Zostaw swoją opinię</h5>
              <form onSubmit={handleReview}>
                <div className="d-flex gap-1 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" className={`star-btn ${s <= rating ? 'active' : ''}`} onClick={() => setRating(s)}>★</button>
                  ))}
                </div>
                <textarea className="form-control mb-3 rounded-4 p-3 border-2" rows="4"
                  placeholder="Podziel się swoimi wrażeniami..."
                  value={comment} onChange={e => setComment(e.target.value)}
                />
                <button type="submit" className="btn btn-dark w-100 py-3 rounded-4 fw-bold shadow-sm">PUBLIKUJ RECENZJĘ</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="sticky-top" style={{ top: '100px' }}>
            <div className="rent-card p-4">
              <h2 className="fw-bold h4 mb-4 text-center">Planowanie rezerwacji</h2>

              <div className="mb-4 text-center">
                <p className="fw-bold text-secondary small mb-2 text-uppercase">Do kiedy chcesz wypożyczyć?</p>
                <div className="calendar-trigger fw-bold text-primary mb-3" onClick={() => setShowCalendar(!showCalendar)}>
                  {showCalendar ? "ZAKOŃCZ WYBIERANIE" : "📅 KLIKNIJ, ABY WYBRAĆ DATY"}
                </div>

                {showCalendar && (
                  <div className="mb-4 d-flex justify-content-center">
                    <DatePicker
                      selectsRange startDate={startDate} endDate={endDate}
                      onChange={(u) => setDateRange(u)}
                      minDate={new Date()} inline locale={pl}
                    />
                  </div>
                )}

                <div className="d-flex gap-2 mb-4">
                  <div className={`date-block ${startDate ? 'active' : ''}`}>
                    <div className="date-block-label">ODBIÓR</div>
                    <div className="date-block-value">{format(startDate, 'dd.MM.yyyy')}</div>
                  </div>
                  <div className={`date-block ${endDate ? 'active' : ''}`}>
                    <div className="date-block-label">ZWROT</div>
                    <div className="date-block-value">{endDate ? format(endDate, 'dd.MM.yyyy') : '--.--.----'}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-light rounded-4 mb-4 border">
                <div className="d-flex justify-content-between mb-2 small text-muted">
                  <span>Czas najmu:</span>
                  <span className="fw-bold text-dark">{dni} {dni === 1 ? 'dzień' : 'dni'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-end pt-3 border-top mt-2">
                  <span className="fw-bold h6 mb-0">SUMA DO ZAPŁATY:</span>
                  <span className="fw-bold h2 text-primary mb-0">{suma} zł</span>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-premium flex-grow-1 py-3 rounded-4 fw-bold shadow"
                  onClick={handleAddToCart}
                  disabled={isAdding || item.status !== 'Dostępny'}
                >
                  {isAdding ? 'DODAWANIE...' : item.status === 'Dostępny' ? 'DODAJ DO KOSZYKA' : 'NIEDOSTĘPNY'}
                </button>
                <button
                  className={`btn-fav rounded-4 ${isFav ? 'active' : ''}`}
                  onClick={handleToggleFav}
                  title={isFav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                >
                  {isFav ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}