import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Logowanie() {
  const { zaloguj } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/panel";

  const [form, setForm] = useState({ email: "", haslo: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validate = (values) => {
    const e = {};
    if (!values.email) e.email = "E-mail jest wymagany";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = "Nieprawidłowy adres e-mail";
    if (!values.haslo) e.haslo = "Hasło jest wymagane";
    else if (values.haslo.length < 6) e.haslo = "Hasło musi mieć min. 6 znaków";
    return e;
  };

  useEffect(() => {
    if (Object.keys(touched).length > 0) setErrors(validate(form));
  }, [form]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setServerError("");
  };

  const handleBlur = (e) => {
    setTouched((p) => ({ ...p, [e.target.name]: true }));
    setErrors(validate(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, haslo: true });
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await zaloguj(form.email, form.haslo);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || "Nieprawidłowe dane logowania.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .auth-panel-left {
          flex: 1;
          background: linear-gradient(160deg, #1a1108 0%, #2d1f0e 40%, #3d2b12 100%);
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 3rem; position: relative; overflow: hidden;
        }
        @media (max-width: 768px) { .auth-panel-left { display: none; } }
        .auth-panel-left::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a227' fill-opacity='0.04'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .auth-panel-left .glow-circle { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .auth-panel-right {
          width: 480px; background: #fdfaf5;
          display: flex; flex-direction: column; justify-content: center;
          padding: 4rem 3.5rem;
        }
        @media (max-width: 768px) { .auth-panel-right { width: 100%; padding: 2.5rem 1.5rem; } }
        .input-field { position: relative; margin-bottom: 2rem; }
        .input-field label { display: block; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #92816a; margin-bottom: 0.5rem; }
        .input-field input { width: 100%; background: transparent; border: none; border-bottom: 2px solid #ddd4c5; outline: none; color: #2d2318; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; padding: 0.75rem 0; transition: border-color 0.3s; }
        .input-field input:focus { border-color: #c9a227; }
        .input-field input.has-error { border-color: #e05252; }
        .field-error { font-size: 0.72rem; color: #e05252; margin-top: 0.4rem; }
        .btn-submit { width: 100%; background: #2d1f0e; color: #f5e8c8; border: none; padding: 1rem; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; transition: all 0.3s ease; }
        .btn-submit:hover:not(:disabled) { background: #c9a227; color: #1a1108; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .divider { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; }
        .divider span { font-size: 0.7rem; color: #b0a090; letter-spacing: 0.1em; text-transform: uppercase; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #ddd4c5; }
        .server-error { background: #fef2f2; border-left: 3px solid #e05252; color: #b91c1c; padding: 0.75rem 1rem; font-size: 0.8rem; margin-bottom: 1.5rem; }
        .password-toggle { position: absolute; right: 0; bottom: 0.75rem; background: none; border: none; cursor: pointer; color: #92816a; padding: 0.25rem; display: flex; align-items: center; }
        .log-spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: logSpin 0.7s linear infinite; display: inline-block; vertical-align: middle; }
        @keyframes logSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="auth-panel-left">
        <div className="glow-circle" style={{ width: 300, height: 300, background: "rgba(201,162,39,0.15)", top: -80, right: -80 }} />
        <div className="glow-circle" style={{ width: 200, height: 200, background: "rgba(201,162,39,0.08)", bottom: 100, left: -60 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.75rem", color: "#c9a227", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem" }}>Twoje konto</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "3.2rem", color: "#fdfaf5", lineHeight: 1.1, fontWeight: 400, marginBottom: "1.5rem" }}>
            Wypożyczalnia<br /><em>premium</em>
          </h2>
          <p style={{ color: "#92816a", fontSize: "0.875rem", lineHeight: 1.7, maxWidth: 320 }}>
            Zaloguj się, aby zarządzać swoimi wypożyczeniami, przeglądać historię zamówień i korzystać z ofert specjalnych.
          </p>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2.5rem" }}>
            {["Szybkie zamówienia", "Historia", "Ulubione"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c9a227" }} />
                <span style={{ color: "#92816a", fontSize: "0.75rem", letterSpacing: "0.05em" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel-right">
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#92816a", marginBottom: "0.5rem" }}>Witaj ponownie</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.4rem", color: "#1a1108", fontWeight: 400, lineHeight: 1.1 }}>Zaloguj się</h1>
        </div>

        {serverError && <div className="server-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-field">
            <label htmlFor="email">Adres e-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email}
              onChange={handleChange} onBlur={handleBlur}
              className={touched.email && errors.email ? "has-error" : ""}
              placeholder="twoj@email.pl"
            />
            {touched.email && errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="input-field">
            <label htmlFor="haslo">Hasło</label>
            <div style={{ position: "relative" }}>
              <input id="haslo" name="haslo" type={showPassword ? "text" : "password"}
                autoComplete="current-password" value={form.haslo}
                onChange={handleChange} onBlur={handleBlur}
                className={touched.haslo && errors.haslo ? "has-error" : ""}
                placeholder="••••••••" style={{ paddingRight: "2.5rem" }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>
            {touched.haslo && errors.haslo && <p className="field-error">{errors.haslo}</p>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem", marginTop: "-1rem" }}>
            <Link to="/zapomniane-haslo" style={{ fontSize: "0.72rem", color: "#92816a", textDecoration: "none" }}>Zapomniałeś hasła?</Link>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <><span className="log-spinner" /> &nbsp;Logowanie…</> : "Zaloguj się"}
          </button>
        </form>

        <div className="divider"><span>lub</span></div>

        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#92816a" }}>
          Nie masz konta?{" "}
          <Link to="/rejestracja" style={{ color: "#2d1f0e", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid #c9a227" }}>
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}