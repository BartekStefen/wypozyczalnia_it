import { Component } from 'react';
import { Link } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .error-page { font-family: 'Plus Jakarta Sans', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 2rem; }
  .error-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 3rem 2.5rem; text-align: center; max-width: 480px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.06); }
  .error-code { font-family: 'Syne', sans-serif; font-size: 5rem; font-weight: 800; color: #e2e8f0; margin: 0 0 0.5rem; line-height: 1; }
  .error-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.75rem; }
  .error-desc { font-size: 0.9rem; color: #64748b; line-height: 1.7; margin: 0 0 2rem; }
  .error-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.85rem 2rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.9rem; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
  .error-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
  .error-btn-ghost { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.5rem; border: 1.5px solid #e2e8f0; color: #475569; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 0.9rem; margin-left: 0.75rem; transition: all 0.2s; }
  .error-btn-ghost:hover { border-color: #2563eb; color: #2563eb; }
`;

// Strona 404 — nieznana trasa
export function NotFound() {
  return (
    <div className="error-page">
      <style>{CSS}</style>
      <div className="error-card">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
        <div className="error-code">404</div>
        <h1 className="error-title">Strona nie istnieje</h1>
        <p className="error-desc">
          Podany adres URL nie istnieje lub strona została przeniesiona.<br />
          Sprawdź czy adres jest poprawny.
        </p>
        <Link to="/" className="error-btn">← Wróć na stronę główną</Link>
        <Link to="/katalog" className="error-btn-ghost">Przeglądaj katalog</Link>
      </div>
    </div>
  );
}

// Strona błędu — wyświetlana przez ErrorBoundary przy niezłapanym wyjątku
export function ErrorPage({ error, onReset }) {
  return (
    <div className="error-page">
      <style>{CSS}</style>
      <div className="error-card">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <div className="error-code">Błąd</div>
        <h1 className="error-title">Coś poszło nie tak</h1>
        <p className="error-desc">
          Wystąpił nieoczekiwany błąd aplikacji. Spróbuj odświeżyć stronę.<br />
          {error?.message && (
            <code style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
              {error.message}
            </code>
          )}
        </p>
        <button onClick={onReset} className="error-btn" style={{ border: 'none', cursor: 'pointer' }}>
          🔄 Odśwież
        </button>
        <Link to="/" className="error-btn-ghost">Strona główna</Link>
      </div>
    </div>
  );
}

/**
 * ErrorBoundary — łapie niezłapane wyjątki Reacta i wyświetla przyjazną stronę błędu.
 * Użycie w App.jsx: <ErrorBoundary><App /></ErrorBoundary>
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Tutaj można podpiąć Sentry lub inny monitoring błędów
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          error={this.state.error}
          onReset={() => {
            this.setState({ hasError: false, error: null });
            window.location.href = '/';
          }}
        />
      );
    }
    return this.props.children;
  }
}