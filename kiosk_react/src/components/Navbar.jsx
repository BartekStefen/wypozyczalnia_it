import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled]   = useState(false);
  const location = useLocation();

  const updateCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const total = cart.reduce((acc, item) => acc + 1, 0);
    setCartCount(total);
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('storage', updateCount);
    return () => window.removeEventListener('storage', updateCount);
  }, []);

  useEffect(() => {
    updateCount();
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className="navbar navbar-expand-lg navbar-light bg-white fixed-top py-3"
      style={{
        transition: 'box-shadow 0.3s ease, border-bottom 0.3s ease',
        boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.08)' : '0 1px 0 0 #e2e8f0',
        borderBottom: 'none',
      }}
    >
      <div className="container">
        <Link
          className="navbar-brand fw-bold text-primary fs-3"
          style={{ letterSpacing: '-1.5px' }}
          to="/"
        >
          Kiosk IT<span className="text-dark">.</span>
        </Link>

        <div className="d-flex align-items-center gap-4">
          <Link
            to="/"
            className={`nav-link fw-bold text-uppercase small ${location.pathname === '/' ? 'text-primary' : 'text-secondary'}`}
            style={{ letterSpacing: '1px', fontSize: '0.8rem' }}
          >
            Katalog
          </Link>
          <Link
            to="/admin"
            className={`nav-link fw-bold text-uppercase small ${location.pathname === '/admin' ? 'text-primary' : 'text-secondary'}`}
            style={{ letterSpacing: '1px', fontSize: '0.8rem' }}
          >
            Admin
          </Link>

          <Link
            to="/koszyk"
            className="btn btn-dark rounded-pill px-4 d-flex align-items-center gap-2 position-relative shadow-sm border-0"
            style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
          >
            <span className="fw-bold">Koszyk</span>
            <span>🛒</span>
            {cartCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white"
                style={{ fontSize: '0.7rem', animation: 'pulse 0.3s ease' }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}