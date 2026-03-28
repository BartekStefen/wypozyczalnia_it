import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Logika siły hasła - zwraca indeks 0-4
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.max(0, score - 1);
}

const STRENGTH_LEVELS = [
  { label: "Bardzo słabe", color: "#ef4444", bg: "#fef2f2", width: "20%" },
  { label: "Słabe",        color: "#f97316", bg: "#fff7ed", width: "40%" },
  { label: "Średnie",      color: "#eab308", bg: "#fefce8", width: "60%" },
  { label: "Mocne",        color: "#22c55e", bg: "#f0fdf4", width: "80%" },
  { label: "Bardzo mocne", color: "#16a34a", bg: "#f0fdf4", width: "100%" },
];

// Ikona oka do toggle hasła
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

export default function Rejestracja() {
  const { zarejestruj } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched]         = useState({});

  const [form, setForm] = useState({
    firstName:    "",
    lastName:     "",
    email:        "",
    password:     "",
    confirmPass:  "",
    terms:        false,
  });

  // Walidacja pól formularza - zwraca obiekt błędów
  const validate = (values) => {
    const errors = {};
    if (!values.firstName.trim())     errors.firstName   = "Imię jest wymagane";
    if (!values.email)                errors.email       = "E-mail jest wymagany";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
                                      errors.email       = "Nieprawidłowy adres e-mail";
    if (!values.password)             errors.password    = "Hasło jest wymagane";
    else if (values.password.length < 8)
                                      errors.password    = "Minimum 8 znaków";
    if (values.password !== values.confirmPass)
                                      errors.confirmPass = "Hasła się nie zgadzają";
    if (!values.terms)                errors.terms       = "Wymagana akceptacja regulaminu";
    return errors;
  };

  const [errors, setErrors] = useState({});

  // Ponowna walidacja przy zmianie pól (tylko dla dotkniętych)
  useEffect(() => {
    if (Object.keys(touched).length > 0) setErrors(validate(form));
  }, [form]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setServerError("");
  };

  const handleBlur = (e) => {
    setTouched(p => ({ ...p, [e.target.name]: true }));
    setErrors(validate(form));
  };

  // Przejście do kroku 2 - waliduje tylko pola kroku 1
  const handleNextStep = () => {
    const step1Fields = { firstName: true, email: true };
    setTouched(p => ({ ...p, ...step1Fields }));
    const errs = validate(form);
    setErrors(errs);
    const step1Errors = Object.keys(errs).filter(k => ['firstName', 'email'].includes(k));
    if (step1Errors.length === 0) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      // Wysyłamy firstName/lastName - zgodne z nowym AuthController
      await zarejestruj({
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
      });
      navigate("/panel");
    } catch (err) {
      setServerError(err.response?.data?.message || "Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const strengthIdx = form.password ? getPasswordStrength(form.password) : -1;
  const strength    = strengthIdx >= 0 ? STRENGTH_LEVELS[strengthIdx] : null;

  return (
    <div style={styles.root}>
      <style>{GLOBAL_CSS}</style>

      {/* Lewa dekoracyjna kolumna */}
      <div style={styles.leftPanel}>
        <div style={styles.leftInner}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>⚡</span>
            <span style={styles.brandText}>Kiosk IT</span>
          </div>
          <div style={styles.heroText}>
            <h2 style={styles.heroHeading}>Profesjonalny sprzęt<br/>na wyciągnięcie ręki</h2>
            <p style={styles.heroSub}>Dołącz do tysięcy klientów korzystających z naszej wypożyczalni.</p>
          </div>
          <div style={styles.featureList}>
            {[
              { icon: "🚀", text: "Ekspresowe zamówienie online" },
              { icon: "🔒", text: "Bezpieczne płatności" },
              { icon: "📦", text: "Śledzenie statusu w czasie rzeczywistym" },
              { icon: "⭐", text: "Program punktów lojalnościowych" },
            ].map(({ icon, text }) => (
              <div key={text} style={styles.featureItem}>
                <span style={styles.featureIcon}>{icon}</span>
                <span style={styles.featureText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Dekoracja geometryczna */}
        <div style={styles.decoBubble1} />
        <div style={styles.decoBubble2} />
        <div style={styles.decoGrid} />
      </div>

      {/* Prawa kolumna - formularz */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>

          {/* Nagłówek */}
          <div style={styles.formHeader}>
            <h1 style={styles.formTitle}>Utwórz konto</h1>
            <p style={styles.formSubtitle}>
              Masz już konto?{" "}
              <Link to="/logowanie" style={styles.link}>Zaloguj się</Link>
            </p>
          </div>

          {/* Pasek kroków */}
          <div style={styles.stepBar}>
            {[
              { num: 1, label: "Dane osobowe" },
              { num: 2, label: "Hasło i zgody" },
            ].map(({ num, label }, i) => (
              <div key={num} style={styles.stepWrap}>
                <div style={{
                  ...styles.stepDot,
                  background: step > num ? "#2563eb" : step === num ? "#2563eb" : "#e2e8f0",
                  color: step >= num ? "#fff" : "#94a3b8",
                }}>
                  {step > num
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    : num
                  }
                </div>
                <span style={{ ...styles.stepLabel, color: step >= num ? "#1e40af" : "#94a3b8", fontWeight: step === num ? 700 : 500 }}>
                  {label}
                </span>
                {i < 1 && (
                  <div style={{ ...styles.stepLine, background: step > 1 ? "#2563eb" : "#e2e8f0" }} />
                )}
              </div>
            ))}
          </div>

          {/* Błąd serwera */}
          {serverError && (
            <div style={styles.errorBox}>
              <span style={{ fontSize: "1rem" }}>⚠️</span>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* KROK 1 */}
            {step === 1 && (
              <div className="reg-step">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
                  <Field label="Imię *" error={touched.firstName && errors.firstName}>
                    <input name="firstName" type="text" className="reg-input"
                      style={{ borderColor: touched.firstName && errors.firstName ? "#ef4444" : undefined }}
                      value={form.firstName} onChange={handleChange} onBlur={handleBlur}
                      placeholder="Jan" autoFocus />
                  </Field>
                  <Field label="Nazwisko" error={false}>
                    <input name="lastName" type="text" className="reg-input"
                      value={form.lastName} onChange={handleChange}
                      placeholder="Kowalski (opcjonalne)" />
                  </Field>
                </div>
                <Field label="Adres e-mail *" error={touched.email && errors.email}>
                  <input name="email" type="email" className="reg-input"
                    style={{ borderColor: touched.email && errors.email ? "#ef4444" : undefined }}
                    value={form.email} onChange={handleChange} onBlur={handleBlur}
                    placeholder="jan.kowalski@email.pl" />
                </Field>
                <button type="button" className="reg-btn-primary" onClick={handleNextStep}>
                  Dalej <span style={{ marginLeft: "0.5rem" }}>→</span>
                </button>
              </div>
            )}

            {/* KROK 2 */}
            {step === 2 && (
              <div className="reg-step">
                <Field label="Hasło *" error={touched.password && errors.password}>
                  <div style={{ position: "relative" }}>
                    <input name="password" type={showPass ? "text" : "password"} className="reg-input"
                      style={{ paddingRight: "3rem", borderColor: touched.password && errors.password ? "#ef4444" : undefined }}
                      value={form.password} onChange={handleChange} onBlur={handleBlur}
                      placeholder="Minimum 8 znaków" />
                    <button type="button" className="reg-eye" onClick={() => setShowPass(p => !p)}>
                      <EyeIcon visible={showPass} />
                    </button>
                  </div>
                  {/* Pasek siły hasła */}
                  {form.password && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={styles.strengthTrack}>
                        <div style={{ ...styles.strengthFill, width: strength?.width, background: strength?.color }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", color: strength?.color, fontWeight: 600 }}>{strength?.label}</span>
                    </div>
                  )}
                </Field>

                <Field label="Potwierdź hasło *" error={touched.confirmPass && errors.confirmPass}>
                  <div style={{ position: "relative" }}>
                    <input name="confirmPass" type={showConfirm ? "text" : "password"} className="reg-input"
                      style={{ paddingRight: "3rem", borderColor: touched.confirmPass && errors.confirmPass ? "#ef4444" : undefined }}
                      value={form.confirmPass} onChange={handleChange} onBlur={handleBlur}
                      placeholder="Powtórz hasło" />
                    <button type="button" className="reg-eye" onClick={() => setShowConfirm(p => !p)}>
                      <EyeIcon visible={showConfirm} />
                    </button>
                  </div>
                </Field>

                {/* Checkbox regulamin */}
                <label style={styles.checkWrap}>
                  <input type="checkbox" name="terms" checked={form.terms}
                    onChange={handleChange} onBlur={handleBlur}
                    style={{ width: 16, height: 16, accentColor: "#2563eb", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
                    Akceptuję{" "}
                    <Link to="/regulamin" style={styles.link}>Regulamin</Link>{" "}
                    i{" "}
                    <Link to="/polityka-prywatnosci" style={styles.link}>Politykę prywatności</Link>
                  </span>
                </label>
                {touched.terms && errors.terms && <p style={styles.fieldError}>{errors.terms}</p>}

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="button" className="reg-btn-ghost" onClick={() => setStep(1)}>
                    ← Wróć
                  </button>
                  <button type="submit" className="reg-btn-primary" disabled={loading} style={{ flex: 1 }}>
                    {loading ? <span className="reg-spinner" /> : "Utwórz konto"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// Pomocniczy wrapper pola z etykietą i błędem
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
        {label}
      </label>
      {children}
      {error && <p style={styles.fieldError}>{error}</p>}
    </div>
  );
}

// Style obiekty
const styles = {
  root:         { minHeight: "100vh", display: "flex", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  leftPanel:    { flex: 1, background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  leftInner:    { position: "relative", zIndex: 1, padding: "3rem", maxWidth: 420 },
  brand:        { display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "3rem" },
  brandIcon:    { fontSize: "1.5rem" },
  brandText:    { fontFamily: "'Syne', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" },
  heroHeading:  { fontFamily: "'Syne', sans-serif", fontSize: "2.4rem", fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 1rem" },
  heroSub:      { fontSize: "1rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 2.5rem" },
  featureList:  { display: "flex", flexDirection: "column", gap: "1rem" },
  featureItem:  { display: "flex", alignItems: "center", gap: "0.75rem" },
  featureIcon:  { width: 36, height: 36, borderRadius: "10px", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 },
  featureText:  { color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" },
  decoBubble1:  { position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: -100, right: -100 },
  decoBubble2:  { position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", bottom: -60, left: -60 },
  decoGrid:     { position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px" },
  heroText:     {},

  rightPanel:   { width: 520, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "2.5rem 2rem" },
  formCard:     { width: "100%", maxWidth: 420 },
  formHeader:   { marginBottom: "2rem" },
  formTitle:    { fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.4rem" },
  formSubtitle: { fontSize: "0.875rem", color: "#64748b", margin: 0 },
  link:         { color: "#2563eb", fontWeight: 700, textDecoration: "none" },

  stepBar:      { display: "flex", alignItems: "center", gap: "0", marginBottom: "2rem" },
  stepWrap:     { display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 },
  stepDot:      { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, transition: "all 0.3s" },
  stepLabel:    { fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" },
  stepLine:     { flex: 1, height: 2, margin: "0 0.5rem", transition: "background 0.4s" },

  errorBox:     { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.85rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" },
  fieldError:   { color: "#ef4444", fontSize: "0.72rem", marginTop: "0.3rem", fontWeight: 600 },
  strengthTrack:{ height: 4, background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" },
  strengthFill: { height: "100%", borderRadius: "2px", transition: "width 0.4s, background 0.4s" },
  checkWrap:    { display: "flex", alignItems: "flex-start", gap: "0.6rem", marginBottom: "1.25rem", cursor: "pointer" },
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  .reg-input {
    width: 100%; padding: 0.75rem 1rem;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem;
    color: #0f172a; background: #fff; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .reg-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  .reg-btn-primary {
    width: 100%; padding: 0.85rem 1.5rem;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff; border: none; border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.9rem; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(37,99,235,0.3);
  }
  .reg-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8, #1e40af);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(37,99,235,0.4);
  }
  .reg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .reg-btn-ghost {
    padding: 0.85rem 1.25rem;
    background: transparent; color: #64748b;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.85rem; font-weight: 600; cursor: pointer;
    transition: all 0.2s;
  }
  .reg-btn-ghost:hover { background: #f1f5f9; }
  .reg-eye {
    position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #94a3b8;
    display: flex; align-items: center;
  }
  .reg-step { animation: fadeSlideIn 0.25s ease; }
  @keyframes fadeSlideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
  .reg-spinner {
    width: 20px; height: 20px;
    border: 2.5px solid rgba(255,255,255,0.4);
    border-top-color: #fff; border-radius: 50%;
    animation: regSpin 0.7s linear infinite;
  }
  @keyframes regSpin { to { transform: rotate(360deg); } }
  @media (max-width: 768px) {
    .reg-left { display: none !important; }
    .reg-right { width: 100% !important; }
  }
`;