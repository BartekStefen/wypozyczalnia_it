import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Koszyk() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(data);
  }, []);

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('storage'));
  };

  const total = cart.reduce((acc, item) => acc + parseFloat(item.suma), 0).toFixed(2);

  return (
    <div className="container mt-5 pt-5">
      <h2 className="fw-bold mb-4">Twój Koszyk 🛒</h2>
      {cart.length === 0 ? (
        <div className="alert alert-info">Koszyk jest pusty. <button onClick={() => navigate('/')} className="btn btn-link">Wróć do katalogu</button></div>
      ) : (
        <div className="row">
          <div className="col-md-8">
            {cart.map((item, index) => (
              <div key={index} className="card mb-3 p-3 shadow-sm border-0 rounded-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="fw-bold mb-1">{item.marka} {item.model}</h5>
                    <small className="text-muted">Okres: {item.data_start} do {item.data_koniec} ({item.dni} dni)</small>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold h5 mb-0">{item.suma} zł</div>
                    <button onClick={() => removeItem(index)} className="btn btn-sm btn-outline-danger mt-2">Usuń</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="col-md-4">
            <div className="card p-4 bg-dark text-white rounded-4 shadow">
              <h5 className="mb-4">Podsumowanie</h5>
              <div className="d-flex justify-content-between h4 mb-4">
                <span>Suma:</span>
                <span>{total} zł</span>
              </div>
              <button onClick={() => navigate('/zamowienie')} className="btn btn-primary w-100 py-3 fw-bold">PRZEJDŹ DO ZAMÓWIENIA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}