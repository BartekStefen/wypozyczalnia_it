import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Zamowienie() {
  const navigate = useNavigate();
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const [user, setUser] = useState({ imie: '', nazwisko: '', email: '', telefon: '', numer_dokumentu: '' });

  const total = cart.reduce((acc, item) => acc + parseFloat(item.suma), 0).toFixed(2);

  const handleFinalize = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/finalizuj', { klient: user, produkty: cart });
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('storage'));
      navigate('/sukces');
    } catch (err) { alert("Błąd podczas składania zamówienia."); }
  };

  return (
    <div className="container mt-5 pt-5">
      <div className="row g-5">
        <div className="col-md-7">
          <div className="bg-white p-5 rounded-4 shadow-sm">
            <h3 className="fw-bold mb-4">Dane Najemcy (Gość)</h3>
            <form onSubmit={handleFinalize}>
              <div className="row g-3">
                <div className="col-6"><input type="text" className="form-control p-3" placeholder="Imię" required onChange={e => setUser({...user, imie: e.target.value})} /></div>
                <div className="col-6"><input type="text" className="form-control p-3" placeholder="Nazwisko" required onChange={e => setUser({...user, nazwisko: e.target.value})} /></div>
                <div className="col-12"><input type="email" className="form-control p-3" placeholder="E-mail" required onChange={e => setUser({...user, email: e.target.value})} /></div>
                <div className="col-6"><input type="text" className="form-control p-3" placeholder="Telefon" required onChange={e => setUser({...user, telefon: e.target.value})} /></div>
                <div className="col-6"><input type="text" className="form-control p-3" placeholder="Nr Dokumentu" required onChange={e => setUser({...user, numer_dokumentu: e.target.value})} /></div>
              </div>
              <button className="btn btn-primary w-100 py-3 mt-4 fw-bold rounded-3">POTWIERDZAM WYNAJEM</button>
            </form>
          </div>
        </div>
        <div className="col-md-5">
          <div className="bg-light p-4 rounded-4">
             <h5 className="fw-bold">Zestawienie</h5>
             {cart.map((i, idx) => ( <div key={idx} className="small d-flex justify-content-between border-bottom py-2"><span>{i.marka} {i.model}</span><b>{i.suma} zł</b></div> ))}
             <div className="h3 fw-bold mt-3 text-end">{total} zł</div>
          </div>
        </div>
      </div>
    </div>
  );
}