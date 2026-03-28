import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function EyeIcon({ visible }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {visible
        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  );
}

export default function Logowanie() {
  const { zaloguj } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/panel";

  const [form, setForm]               = useState({ email: "", password: "" });
  const [errors, setErrors]           = useState({});
  const [touched, setTouched]         = useState({});
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPass, setShowPass]       = useState(false);

  // Walidacja formularza logowania
  const validate = (values) => {
    const errs = {};
    if (!values.email)    errs.email    = "E-mail jest wymagany";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
                          errs.email    = "Nieprawidłowy format e-mail";
    if (!values.password) errs.password = "Hasło jest wymagane";
    return errs;
  };

  useEffect(() => {
    if (Object.keys(touched).length > 0) setErrors(validate(form));
  }, [form]);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setServerError("");
  };

  const handleBlur = (e) => {
    setTouched(p => ({ ...p, [e.target.name]: true }));
    setErrors(validate(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await zaloguj(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || "Nieprawidłowy e-mail lub hasło.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <style>{GLOBAL_CSS}</style>

      {/* Lewa dekoracyjna kolumna */}
      <div style={styles.leftPanel}>
        <div style={styles.decoGrid} />
        <div style={styles.decoBubble1} />
        <div style={styles.decoBubble2} />

        <div style={styles.leftInner}>
          <div style={styles.brand}>
            <span style={{ fontSize: "1.5rem" }}>⚡</span>
            <span style={styles.brandText}>Kiosk IT</span>
          </div>

          <h2 style={styles.heroHeading}>
            Wypożycz sprzęt<br/>szybko i wygodnie
          </h2>
          <p style={styles.heroSub}>
            Zaloguj się, aby zarządzać wypożyczeniami, śledzić zamówienia i korzystać z ofert specjalnych.
          </p>

          {/* Statystyki promocyjne */}
          <div style={styles.statsRow}>
            {[
              { val: "500+", label: "Urządzeń" },
              { val: "2400", label: "Klientów" },
              { val: "4.9★", label: "Ocena" },
            ].map(({ val, label }) => (
              <div key={label} style={styles.statBox}>
                <div style={styles.statVal}>{val}</div>
                <div style={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prawa kolumna - formularz */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>

          <div style={{ marginBottom: "2rem" }}>
            <p style={styles.tagline}>Witaj ponownie 👋</p>
            <h1 style={styles.formTitle}>Zaloguj się</h1>
          </div>

          {serverError && (
            <div style={styles.errorBox}>
              <span>⚠️</span> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Pole e-mail */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={styles.label}>Adres e-mail</label>
              <input
                name="email" type="email"
                className={`log-input ${touched.email && errors.email ? "log-input-err" : ""}`}
                value={form.email} onChange={handleChange} onBlur={handleBlur}
                placeholder="jan.kowalski@email.pl" autoComplete="email" autoFocus
              />
              {touched.email && errors.email && <p style={styles.fieldError}>{errors.email}</p>}
            </div>

            {/* Pole hasło */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label style={styles.label}>Hasło</label>
                <Link to="/zapomniane-haslo" style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                  Zapomniałeś hasła?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  name="password" type={showPass ? "text" : "password"}
                  className={`log-input ${touched.password && errors.password ? "log-input-err" : ""}`}
                  style={{ paddingRight: "3rem" }}
                  value={form.password} onChange={handleChange} onBlur={handleBlur}
                  placeholder="Twoje hasło" autoComplete="current-password"
                />
                <button type="button" className="log-eye" onClick={() => setShowPass(p => !p)}>
                  <EyeIcon visible={showPass} />
                </button>
              </div>
              {touched.password && errors.password && <p style={styles.fieldError}>{errors.password}</p>}
            </div>

            <button type="submit" className="log-btn" disabled={loading} style={{ marginTop: "1.5rem" }}>
              {loading
                ? <span className="log-spinner" />
                : "Zaloguj się"
              }
            </button>
          </form>

          {/* Separator */}
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>lub</span>
            <span style={styles.dividerLine} />
          </div>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
            Nie masz jeszcze konta?{" "}
            <Link to="/rejestracja" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
              Zarejestruj się za darmo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root:       { minHeight: "100vh", display: "flex", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  leftPanel:  { flex: 1, background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  leftInner:  { position: "relative", zIndex: 1, padding: "3rem", maxWidth: 420 },
  brand:      { display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "3rem" },
  brandText:  { fontFamily: "'Syne', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" },
  heroHeading:{ fontFamily: "'Syne', sans-serif", fontSize: "2.6rem", fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 1rem" },
  heroSub:    { fontSize: "1rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.7, margin: "0 0 2.5rem" },
  statsRow:   { display: "flex", gap: "1rem" },
  statBox:    { flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem", textAlign: "center", backdropFilter: "blur(4px)" },
  statVal:    { fontFamily: "'Syne', sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "#fff", lineHeight: 1 },
  statLabel:  { fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", marginTop: "0.25rem" },
  decoGrid:   { position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px" },
  decoBubble1:{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.03)", top: -150, right: -150 },
  decoBubble2:{ position: "absolute", width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.03)", bottom: -80, left: -80 },

  rightPanel: { width: 500, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "2.5rem 2rem" },
  formCard:   { width: "100%", maxWidth: 400 },
  tagline:    { fontSize: "0.875rem", color: "#64748b", fontWeight: 500, margin: "0 0 0.3rem" },
  formTitle:  { fontFamily: "'Syne', sans-serif", fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", margin: 0 },
  label:      { display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" },
  errorBox:   { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.85rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" },
  fieldError: { color: "#ef4444", fontSize: "0.72rem", marginTop: "0.3rem", fontWeight: 600 },
  divider:    { display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" },
  dividerLine:{ flex: 1, height: 1, background: "#e2e8f0" },
  dividerText:{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 },
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  .log-input {
    width: 100%; padding: 0.75rem 1rem;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem;
    color: #0f172a; background: #fff; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .log-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .log-input-err { border-color: #ef4444 !important; }
  .log-btn {
    width: 100%; padding: 0.9rem;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff; border: none; border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.95rem; font-weight: 700; cursor: pointer;
    transition: all 0.2s; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(37,99,235,0.3);
  }
  .log-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8, #1e40af);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(37,99,235,0.4);
  }
  .log-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .log-eye {
    position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #94a3b8; display: flex;
  }
  .log-spinner {
    width: 22px; height: 22px;
    border: 2.5px solid rgba(255,255,255,0.4);
    border-top-color: #fff; border-radius: 50%;
    animation: logSpin 0.7s linear infinite;
  }
  @keyframes logSpin { to { transform: rotate(360deg); } }
  @media (max-width: 768px) {
    .log-left { display: none; }
  }
`;