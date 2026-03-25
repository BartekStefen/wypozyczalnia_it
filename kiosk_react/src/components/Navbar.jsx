import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);

  const updateCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartCount(cart.length);
  };

  useEffect(() => {
    updateCount();
    // Nasłuchiwanie na zmiany w koszyku
    window.addEventListener('storage', updateCount);
    return () => window.removeEventListener('storage', updateCount);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top py-3">
      <div className="container">
        {/* Lewa strona: Logo */}
        <Link className="navbar-brand fw-bold text-primary fs-3" style={{letterSpacing: '-1.5px'}} to="/">
          Kiosk IT<span className="text-dark">.</span>
        </Link>
        
        {/* Prawa strona: Linki i Koszyk */}
        <div className="d-flex align-items-center gap-4">
          <Link to="/" className="nav-link fw-bold text-secondary text-uppercase small" style={{letterSpacing: '1px'}}>Katalog</Link>
          <Link to="/admin" className="nav-link fw-bold text-secondary text-uppercase small" style={{letterSpacing: '1px'}}>Admin</Link>
          
          <Link to="/koszyk" className="btn btn-dark rounded-pill px-4 d-flex align-items-center gap-2 position-relative shadow-sm border-0">
            <span className="fw-bold">Koszyk</span>
            <span>🛒</span>
            {cartCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white" style={{fontSize: '0.7rem'}}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}