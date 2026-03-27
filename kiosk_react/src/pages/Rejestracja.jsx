import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const STRENGTH_LEVELS = [
  { label: "Bardzo słabe", color: "#e05252", width: "20%" },
  { label: "Słabe",        color: "#f59e0b", width: "40%" },
  { label: "Średnie",      color: "#eab308", width: "60%" },
  { label: "Mocne",        color: "#22c55e", width: "80%" },
  { label: "Bardzo mocne", color: "#16a34a", width: "100%" },
];

function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.max(0, score - 1);
}

export default function Rejestracja() {
  const { zarejestruj } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ imie: "", nazwisko: "", email: "", haslo: "", potwierdzenie: "", zgoda: false });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState(1);

  const validate = (values) => {
    const e = {};
    if (!values.imie.trim()) e.imie = "Imię jest wymagane";
    if (!values.nazwisko.trim()) e.nazwisko = "Nazwisko jest wymagane";
    if (!values.email) e.email = "E-mail jest wymagany";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = "Nieprawidłowy adres e-mail";
    if (!values.haslo) e.haslo = "Hasło jest wymagane";
    else if (values.haslo.length < 8) e.haslo = "Hasło musi mieć min. 8 znaków";
    if (!values.potwierdzenie) e.potwierdzenie = "Potwierdź hasło";
    else if (values.haslo !== values.potwierdzenie) e.potwierdzenie = "Hasła się nie zgadzają";
    if (!values.zgoda) e.zgoda = "Akceptacja regulaminu jest wymagana";
    return e;
  };

  useEffect(() => {
    if (Object.keys(touched).length > 0) setErrors(validate(form));
  }, [form]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setServerError("");
  };

  const handleBlur = (e) => {
    setTouched((p) => ({ ...p, [e.target.name]: true }));
    setErrors(validate(form));
  };

  const step1Fields = ["imie", "nazwisko", "email"];
  const step1Valid = step1Fields.every((f) => !validate(form)[f]);

  const handleNext = () => {
    const touchStep1 = Object.fromEntries(step1Fields.map((f) => [f, true]));
    setTouched((p) => ({ ...p, ...touchStep1 }));
    setErrors(validate(form));
    if (step1Valid) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await zarejestruj({
        imie: form.imie,
        nazwisko: form.nazwisko,
        email: form.email,
        password: form.haslo,
        rola: 'klient',
      });
      navigate("/panel");
    } catch (err) {
      setServerError(err.response?.data?.message || "Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const strengthIdx = form.haslo ? getStrength(form.haslo) : -1;
  const strength = strengthIdx >= 0 ? STRENGTH_LEVELS[strengthIdx] : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .reg-left { flex: 1; background: linear-gradient(145deg, #0d1f1a 0%, #132d24 50%, #1a3d2e 100%); display: flex; flex-direction: column; justify-content: space-between; padding: 3rem; position: relative; overflow: hidden; }
        @media (max-width: 768px) { .reg-left { display: none; } }
        .reg-left::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 80% 20%, rgba(52,211,153,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(16,185,129,0.06) 0%, transparent 60%); }
        .reg-right { width: 500px; background: #f9faf8; display: flex; flex-direction: column; justify-content: center; padding: 3.5rem; }
        @media (max-width: 768px) { .reg-right { width: 100%; padding: 2rem 1.5rem; } }
        .reg-input-wrap { margin-bottom: 1.5rem; }
        .reg-input-wrap label { display: block; font-size: 0.62rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #6b8a77; margin-bottom: 0.4rem; }
        .reg-input-wrap input[type="text"], .reg-input-wrap input[type="email"], .reg-input-wrap input[type="password"] { width: 100%; background: transparent; border: none; border-bottom: 2px solid #c8d5c0; outline: none; color: #162011; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; padding: 0.7rem 2rem 0.7rem 0; transition: border-color 0.3s; }
        .reg-input-wrap input:focus { border-color: #2d7a4f; }
        .reg-input-wrap input.err { border-color: #e05252; }
        .field-err { font-size: 0.7rem; color: #e05252; margin-top: 0.35rem; }
        .step-indicator { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2.5rem; }
        .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; transition: all 0.4s ease; }
        .step-dot.active { background: #162011; color: #c8e6c3; }
        .step-dot.done { background: #2d7a4f; color: white; }
        .step-dot.inactive { background: #dde5d8; color: #8a9e86; }
        .step-line { flex: 1; height: 2px; background: #dde5d8; position: relative; overflow: hidden; }
        .step-line.done::after { content: ''; position: absolute; inset: 0; background: #2d7a4f; }
        .btn-primary-reg { background: #162011; color: #c8e6c3; border: none; padding: 0.95rem 1.5rem; width: 100%; font-family: 'DM Sans', sans-serif; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; }
        .btn-primary-reg:hover:not(:disabled) { background: #2d7a4f; color: white; }
        .btn-primary-reg:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline-reg { background: transparent; color: #6b8a77; border: 1.5px solid #c8d5c0; padding: 0.95rem 1.5rem; font-family: 'DM Sans', sans-serif; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; flex: 0 0 auto; }
        .btn-outline-reg:hover { border-color: #6b8a77; color: #162011; }
        .strength-bar { height: 3px; background: #dde5d8; border-radius: 2px; margin-top: 0.5rem; overflow: hidden; }
        .strength-fill { height: 100%; border-radius: 2px; transition: width 0.4s, background 0.4s; }
        .checkbox-wrap { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1.5rem; cursor: pointer; }
        .checkbox-wrap input[type="checkbox"] { width: 16px; height: 16px; margin-top: 3px; accent-color: #2d7a4f; flex-shrink: 0; cursor: pointer; }
        .checkbox-label { font-size: 0.78rem; color: #6b8a77; line-height: 1.5; }
        .server-err { background: #fef2f2; border-left: 3px solid #e05252; color: #b91c1c; padding: 0.75rem 1rem; font-size: 0.78rem; margin-bottom: 1.25rem; }
        .toggle-btn-r { position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #6b8a77; padding: 0.25rem; display: flex; align-items: center; }
        .reg-spinner { width: 15px; height: 15px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: regSpin 0.7s linear infinite; display: inline-block; vertical-align: middle; }
        @keyframes regSpin { to { transform: rotate(360deg); } }
        .benefit-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
        .benefit-icon { width: 36px; height: 36px; border-radius: 50%; background: rgba(52,211,153,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      `}</style>

      <div className="reg-left">
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.7rem", color: "#6ecb95", letterSpacing: "0.2em", textTransform: "uppercase" }}>Dołącz do nas</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.8rem", color: "#f0faf4", lineHeight: 1.15, fontWeight: 400, marginTop: "0.5rem" }}>
            Wypożyczalnia<br /><em>bez granic</em>
          </h2>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          {[
            { icon: "⚡", title: "Ekspresowe zamówienia", desc: "Złóż zamówienie w mniej niż 2 minuty" },
            { icon: "📦", title: "Śledzenie na żywo", desc: "Monitoruj status każdego wypożyczenia" },
            { icon: "⭐", title: "Program lojalnościowy", desc: "Zbieraj punkty i wymieniaj na nagrody" },
          ].map(({ icon, title, desc }) => (
            <div className="benefit-item" key={title}>
              <div className="benefit-icon"><span style={{ fontSize: "1rem" }}>{icon}</span></div>
              <div>
                <p style={{ color: "#c8e6c3", fontSize: "0.82rem", fontWeight: 600, margin: 0 }}>{title}</p>
                <p style={{ color: "#5a8a6e", fontSize: "0.73rem", margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="reg-right">
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6b8a77", marginBottom: "0.4rem" }}>Nowe konto</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", color: "#162011", fontWeight: 400, lineHeight: 1.1 }}>Zarejestruj się</h1>
        </div>

        <div className="step-indicator">
          <div className={`step-dot ${step === 1 ? "active" : "done"}`}>
            {step > 1 ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : "1"}
          </div>
          <div className={`step-line ${step > 1 ? "done" : ""}`} />
          <div className={`step-dot ${step === 2 ? "active" : "inactive"}`}>2</div>
          <p style={{ fontSize: "0.7rem", color: "#6b8a77", marginBottom: 0 }}>{step === 1 ? "Dane osobowe" : "Hasło i zgody"}</p>
        </div>

        {serverError && <div className="server-err">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {step === 1 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
                {[{ name: "imie", label: "Imię", placeholder: "Jan" }, { name: "nazwisko", label: "Nazwisko", placeholder: "Kowalski" }].map(({ name, label, placeholder }) => (
                  <div className="reg-input-wrap" key={name}>
                    <label>{label}</label>
                    <input type="text" name={name} value={form[name]} onChange={handleChange} onBlur={handleBlur} className={touched[name] && errors[name] ? "err" : ""} placeholder={placeholder} />
                    {touched[name] && errors[name] && <p className="field-err">{errors[name]}</p>}
                  </div>
                ))}
              </div>
              <div className="reg-input-wrap">
                <label>Adres e-mail</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur} className={touched.email && errors.email ? "err" : ""} placeholder="twoj@email.pl" />
                {touched.email && errors.email && <p className="field-err">{errors.email}</p>}
              </div>
              <button type="button" className="btn-primary-reg" onClick={handleNext}>Dalej →</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="reg-input-wrap">
                <label>Hasło</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} name="haslo" value={form.haslo} onChange={handleChange} onBlur={handleBlur} className={touched.haslo && errors.haslo ? "err" : ""} placeholder="Min. 8 znaków" />
                  <button type="button" className="toggle-btn-r" onClick={() => setShowPass((p) => !p)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                    </svg>
                  </button>
                </div>
                {strength && (
                  <div>
                    <div className="strength-bar"><div className="strength-fill" style={{ width: strength.width, background: strength.color }} /></div>
                    <p style={{ fontSize: "0.68rem", color: strength.color, marginTop: "0.3rem" }}>{strength.label}</p>
                  </div>
                )}
                {touched.haslo && errors.haslo && <p className="field-err">{errors.haslo}</p>}
              </div>

              <div className="reg-input-wrap">
                <label>Potwierdź hasło</label>
                <div style={{ position: "relative" }}>
                  <input type={showConfirm ? "text" : "password"} name="potwierdzenie" value={form.potwierdzenie} onChange={handleChange} onBlur={handleBlur} className={touched.potwierdzenie && errors.potwierdzenie ? "err" : ""} placeholder="Powtórz hasło" />
                  <button type="button" className="toggle-btn-r" onClick={() => setShowConfirm((p) => !p)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showConfirm ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                    </svg>
                  </button>
                </div>
                {touched.potwierdzenie && errors.potwierdzenie && <p className="field-err">{errors.potwierdzenie}</p>}
              </div>

              <label className="checkbox-wrap">
                <input type="checkbox" name="zgoda" checked={form.zgoda} onChange={handleChange} onBlur={handleBlur} />
                <span className="checkbox-label">
                  Akceptuję <Link to="/regulamin" style={{ color: "#2d7a4f", textDecoration: "none" }}>Regulamin</Link>{" "}
                  i <Link to="/polityka-prywatnosci" style={{ color: "#2d7a4f", textDecoration: "none" }}>Politykę prywatności</Link>
                </span>
              </label>
              {touched.zgoda && errors.zgoda && <p className="field-err" style={{ marginTop: "-1rem", marginBottom: "1rem" }}>{errors.zgoda}</p>}

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button type="button" className="btn-outline-reg" onClick={() => setStep(1)}>← Wróć</button>
                <button type="submit" className="btn-primary-reg" disabled={loading} style={{ flex: 1 }}>
                  {loading ? <><span className="reg-spinner" /> &nbsp;Tworzenie konta…</> : "Utwórz konto"}
                </button>
              </div>
            </>
          )}
        </form>

        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#6b8a77", marginTop: "2rem" }}>
          Masz już konto?{" "}
          <Link to="/logowanie" style={{ color: "#162011", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid #2d7a4f" }}>Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
}