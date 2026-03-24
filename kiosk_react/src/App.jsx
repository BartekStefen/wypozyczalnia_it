import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [sprzet, setSprzet] = useState([]);

  useEffect(() => {
    
    axios.get('http://127.0.0.1:8000/api/sprzet')
      .then(response => {
        setSprzet(response.data);
      })
      .catch(error => console.error("Błąd pobierania danych:", error));
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4 text-primary">Kiosk IT - Katalog Sprzętu</h1>
      <div className="row">
        {sprzet.length > 0 ? (
          sprzet.map((item) => (
            <div className="col-md-4 mb-4" key={item.id_egzemplarza}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title fw-bold">{item.marka} {item.nazwa_modelu}</h5>
                  <p className="card-text text-muted small">S/N: {item.numer_seryjny}</p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className={`badge ${item.status === 'Dostępny' ? 'bg-success' : 'bg-warning'}`}>
                      {item.status}
                    </span>
                    <span className="fw-bold fs-5 text-dark">{item.cena_wypozyczenia_dzien} zł</span>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-top-0 pb-3">
                  <button className="btn btn-primary w-100 py-2">Wypożycz sprzęt</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Ładowanie produktów z bazy danych...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;