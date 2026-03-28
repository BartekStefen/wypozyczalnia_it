import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays, differenceInDays, format, parseISO, eachDayOfInterval } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

// Style inline dla strony produktu
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .product-wrap { font-family: 'Plus Jakarta Sans', sans-serif; max-width: 1200px; margin: 0 auto; padding: 1.5rem 2rem 4rem; }
  .product-main-img { width: 100%; height: 420px; object-fit: cover; border-radius: 16px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); display: flex; align-items: center; justify-content: center; font-size: 6rem; }
  .stat-block { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; flex: 1; transition: 0.25s; }
  .stat-block:hover { border-color: #2563eb; transform: translateY(-3px); box-shadow: 0 6px 16px rgba(37,99,235,0.1); }
  .stat-label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
  .stat-value { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-top: 4px; }
  .rent-card { border-radius: 16px; background: #fff; border: 1.5px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.06); padding: 1.5rem; }
  .date-block { flex: 1; padding: 12px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #f8fafc; text-align: center; transition: 0.2s; }
  .date-block.active { border-color: #2563eb; background: #eff6ff; }
  .date-block-label { font-size: 0.68rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
  .date-block-value { font-size: 1rem; font-weight: 700; color: #0f172a; margin-top: 4px; }
  .btn-add-cart { width: 100%; padding: 1rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
  .btn-add-cart:hover:not(:disabled) { background: linear-gradient(135deg, #1d4ed8, #1e40af); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
  .btn-add-cart:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
  .star-btn { font-size: 1.6rem; color: #cbd5e1; cursor: pointer; background: none; border: none; transition: 0.15s; }
  .star-btn.lit { color: #f59e0b; }
  .toast-prod { position: fixed; bottom: 2rem; right: 2rem; background: #0f172a; color: #fff; padding: 1rem 1.5rem; border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; font-weight: 600; z-index: 9999; animation: toastIn 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 0.5rem; }
  .toast-prod.err { background: #dc2626; }
  @keyframes toastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .conflict-warning { background: #fef3c7; border: 1.5px solid #f59e0b; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.82rem; color: #92400e; margin-bottom: 1rem; }
  .react-datepicker { font-family: 'Plus Jakarta Sans', sans-serif !important; border: 1.5px solid #e2e8f0 !important; border-radius: 12px !important; }
  .react-datepicker__day--highlighted-custom { background: #fee2e2 !important; color: #dc2626 !important; border-radius: 4px; }
`;

// Ikona emoji dla sprzętu
function getIcon(marka = '', model = '') {
  const t = `${marka} ${model}`.toLowerCase();
  if (t.includes('drone') || t.includes('dji') || t.includes('mavic')) return '🚁';
  if (t.includes('laptop') || t.includes('macbook') || t.includes('thinkpad') || t.includes('latitude') || t.includes('elitebook') || t.includes('katana')) return '💻';
  if (t.includes('tablet') || t.includes('ipad') || t.includes('galaxy tab')) return '📱';
  if (t.includes('sony') || t.includes('canon') || t.includes('aparat') || t.includes('eos') || t.includes('a7')) return '📷';
  if (t.includes('projektor') || t.includes('epson') || t.includes('benq')) return '📽️';
  if (t.includes('monitor') || t.includes('ultrasharp')) return '🖥️';
  if (t.includes('mikrofon') || t.includes('rode') || t.includes('audio')) return '🎙️';
  if (t.includes('gimbal') || t.includes('rs 3') || t.includes('statyw') || t.includes('manfrotto')) return '🎬';
  if (t.includes('gopro') || t.includes('hero')) return '🎥';
  if (t.includes('godox') || t.includes('aputure') || t.includes('led') || t.includes('oświetlenie')) return '💡';
  if (t.includes('sigma') || t.includes('obiektyw')) return '🔭';
  return '🖥️';
}

export default function ProduktSzczegoly() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { czyZalogowany, uzytkownik } = useAuth();

  const [item, setItem]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [isAdding, setIsAdding]     = useState(false);
  const [isFav, setIsFav]           = useState(false);
  const [toast, setToast]           = useState(null);
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [bookedDates, setBookedDates] = useState([]); // Zajęte daty
  const [checking, setChecking]     = useState(false);
  const [conflict, setConflict]     = useState(false);

  const [dateRange, setDateRange] = useState([new Date(), addDays(new Date(), 3)]);
  const [startDate, endDate] = dateRange;

  // Pobierz dane sprzętu
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    axios.get(`/sprzet/${id}`)
      .then(res => setItem(res.data))
      .catch(() => showToast('Nie udało się załadować sprzętu.', true))
      .finally(() => setLoading(false));

    // Pobierz zajęte daty z wynajmy
    axios.get(`/booked-dates/${id}`)
      .then(res => {
        // Rozwiń zakresy dat na pojedyncze dni do blokowania w kalendarzu
        const blocked = [];
        res.data.forEach(({ data_start, data_koniec }) => {
          try {
            const days = eachDayOfInterval({
              start: parseISO(data_start),
              end:   parseISO(data_koniec),
            });
            blocked.push(...days);
          } catch {}
        });
        setBookedDates(blocked);
      })
      .catch(() => {}); // Ignoruj błąd - kalendarze działają bez blokowania

    return () => document.head.removeChild(style);
  }, [id]);

  // Sprawdź dostępność przy zmianie dat
  useEffect(() => {
    if (!startDate || !endDate || !item) return;

    const check = async () => {
      setChecking(true);
      try {
        const { data } = await axios.post('/check-availability', {
          id_egzemplarza: item.id_egzemplarza,
          data_start:     format(startDate, 'yyyy-MM-dd'),
          data_koniec:    format(endDate, 'yyyy-MM-dd'),
        });
        setConflict(!data.available);
      } catch {
        setConflict(false);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [startDate, endDate, item]);

  const showToast = (msg, isErr = false) => {
    setToast({ msg, isErr });
    setTimeout(() => setToast(null), 3500);
  };

  const dni = endDate ? Math.max(1, differenceInDays(endDate, startDate)) : 1;
  const suma = item ? (dni * parseFloat(item.cena_wypozyczenia_dzien)).toFixed(2) : '0.00';

  const handleAddToCart = () => {
    if (!endDate) { showToast('⚠️ Wybierz datę zwrotu!', true); return; }
    if (conflict)  { showToast('❌ Ten termin jest już zajęty!', true); return; }

    setIsAdding(true);
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];

    // Sprawdź czy ten sam egzemplarz w tych samych datach jest już w koszyku
    const alreadyInCart = currentCart.some(c =>
      c.id_egzemplarza === item.id_egzemplarza &&
      c.data_start === format(startDate, 'yyyy-MM-dd') &&
      c.data_koniec === format(endDate, 'yyyy-MM-dd')
    );

    if (alreadyInCart) {
      showToast('Ten sprzęt w tym terminie jest już w koszyku!', true);
      setIsAdding(false);
      return;
    }

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
      showToast('✅ Dodano do koszyka!');
      setIsAdding(false);
    }, 300);
  };

  const handleFav = async () => {
    if (!czyZalogowany) { navigate('/logowanie'); return; }
    if (isFav) {
      setIsFav(false);
      showToast('💔 Usunięto z ulubionych');
    } else {
      try { await axios.post('/ulubione', { sprzet_id: item.id_egzemplarza }); } catch {}
      setIsFav(true);
      showToast('❤️ Dodano do ulubionych');
    }
  };

  const handleReview = (e) => {
    e.preventDefault();
    if (!czyZalogowany) { navigate('/logowanie'); return; }
    if (!rating)        { showToast('⚠️ Wybierz ocenę przed wysłaniem', true); return; }
    showToast('✅ Dziękujemy za opinię!');
    setRating(0);
    setComment('');
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#94a3b8' }}>Ładowanie…</div>;
  if (!item)   return <div style={{ padding: '4rem', textAlign: 'center', color: '#dc2626' }}>Nie znaleziono sprzętu.</div>;

  const icon = getIcon(item.marka, item.nazwa_modelu);
  const isAvailable = item.status === 'Dostępny';

  return (
    <div className="product-wrap">
      {toast && <div className={`toast-prod ${toast.isErr ? 'err' : ''}`}>{toast.msg}</div>}

      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#2563eb', fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        ← Powrót do oferty
      </button>

      <div className="row g-5" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '2.5rem', alignItems: 'start' }}>

        {/* Lewa kolumna */}
        <div>
          {/* Placeholder obrazu */}
          <div className="product-main-img" style={{ marginBottom: '1.5rem' }}>
            <span>{icon}</span>
          </div>

          {/* Statystyki */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {[
              { icon: '⚡', label: 'Dostępność', val: item.status, cls: isAvailable ? '#16a34a' : '#dc2626' },
              { icon: '🏷️', label: 'Marka',      val: item.marka },
              { icon: '💻', label: 'Model',      val: item.nazwa_modelu },
              { icon: '✨', label: 'Stan',       val: 'Premium A+' },
            ].map(({ icon: ic, label, val, cls }) => (
              <div className="stat-block" key={label}>
                <div style={{ fontSize: '1.4rem' }}>{ic}</div>
                <div className="stat-label">{label}</div>
                <div className="stat-value" style={cls ? { color: cls } : {}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Opis */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', border: '1.5px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem' }}>O urządzeniu</h3>
            <p style={{ color: '#475569', lineHeight: '1.8', margin: 0 }}>
              <strong>{item.marka} {item.nazwa_modelu}</strong> to profesjonalny sprzęt klasy premium, poddany pełnej inspekcji technicznej przed każdym wypożyczeniem.
              Gwarantujemy niezawodność i doskonały stan techniczny. Urządzenie jest gotowe do pracy natychmiast po odbiorze.
            </p>
          </div>

          {/* Opinie */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', border: '1.5px solid #e2e8f0' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.5rem' }}>Opinie użytkowników</h3>

            {[
              { name: 'Rafał P.',  stars: 5, text: 'Sprzęt w świetnym stanie, dostawa szybka. Będę zamawiał ponownie!' },
              { name: 'Marta K.',  stars: 4, text: 'Bardzo dobra jakość. Obsługa pomocna, polecam.' },
            ].map(({ name, stars, text }) => (
              <div key={name} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{name}</span>
                  <span style={{ color: '#f59e0b' }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                </div>
                <p style={{ color: '#475569', fontSize: '0.875rem', margin: 0 }}>{text}</p>
              </div>
            ))}

            <form onSubmit={handleReview} style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
              <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' }}>Oceń sprzęt</h4>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" className={`star-btn ${s <= rating ? 'lit' : ''}`} onClick={() => setRating(s)}>★</button>
                ))}
              </div>
              <textarea
                style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.875rem', resize: 'vertical', minHeight: 80, outline: 'none', boxSizing: 'border-box' }}
                placeholder="Podziel się wrażeniami…"
                value={comment} onChange={e => setComment(e.target.value)}
              />
              <button type="submit" style={{ marginTop: '0.75rem', padding: '0.75rem 2rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                Publikuj recenzję
              </button>
            </form>
          </div>
        </div>

        {/* Prawa kolumna - karta rezerwacji */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div className="rent-card">
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.5rem', textAlign: 'center' }}>
              Zarezerwuj sprzęt
            </h2>

            {/* Wyświetl info o zalogowanym */}
            {czyZalogowany && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#166534' }}>
                ✅ Zalogowany jako <strong>{uzytkownik?.firstName} {uzytkownik?.lastName}</strong>
              </div>
            )}

            {/* Konflikt terminów */}
            {conflict && (
              <div className="conflict-warning">
                ⚠️ Wybrany termin jest już zajęty. Wybierz inne daty.
              </div>
            )}

            {/* Kalendarz */}
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem' }}>
                Wybierz termin wypożyczenia
              </p>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                minDate={new Date()}
                locale={pl}
                inline
                excludeDates={bookedDates}
                highlightDates={[{ "react-datepicker__day--highlighted-custom": bookedDates }]}
                calendarClassName="prod-calendar"
              />
            </div>

            {/* Wyświetlone daty */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className={`date-block ${startDate ? 'active' : ''}`}>
                <div className="date-block-label">Odbiór</div>
                <div className="date-block-value">{startDate ? format(startDate, 'dd.MM.yyyy') : '—'}</div>
              </div>
              <div className={`date-block ${endDate ? 'active' : ''}`}>
                <div className="date-block-label">Zwrot</div>
                <div className="date-block-value">{endDate ? format(endDate, 'dd.MM.yyyy') : '—'}</div>
              </div>
            </div>

            {/* Podsumowanie ceny */}
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.4rem' }}>
                <span>{dni} {dni === 1 ? 'dzień' : 'dni'} × {parseFloat(item.cena_wypozyczenia_dzien).toFixed(2)} zł</span>
                <span>{suma} zł</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#2563eb', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                <span>Łącznie</span>
                <span>{suma} zł</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-add-cart"
                onClick={handleAddToCart}
                disabled={isAdding || !isAvailable || conflict || checking}
                style={{ flex: 1 }}
              >
                {checking   ? '🔄 Sprawdzam…'          :
                 !isAvailable ? 'Niedostępny'            :
                 conflict    ? '❌ Termin zajęty'        :
                 isAdding    ? 'Dodawanie…'              :
                               '🛒 Dodaj do koszyka'}
              </button>
              <button
                onClick={handleFav}
                title={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                style={{ width: 48, height: 48, border: `1.5px solid ${isFav ? '#ef4444' : '#e2e8f0'}`, borderRadius: '10px', background: isFav ? '#fef2f2' : '#f8fafc', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0 }}
              >
                {isFav ? '❤️' : '🤍'}
              </button>
            </div>

            {!czyZalogowany && (
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                <a href="/logowanie" style={{ color: '#2563eb', fontWeight: 700 }}>Zaloguj się</a>, aby dane uzupełniły się automatycznie
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}