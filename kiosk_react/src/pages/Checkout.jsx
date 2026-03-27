import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const STEPS = [
  { id: 1, label: "Koszyk" },
  { id: 2, label: "Dane" },
  { id: 3, label: "Podsumowanie" },
];

const MOCK_CART = [
  { id: 1, nazwa: "Kamera Sony A7 IV", dni: 3, cenaDzien: 140, dostepna: true },
  { id: 2, nazwa: "Obiektyw Sigma 85mm f/1.4", dni: 3, cenaDzien: 60, dostepna: true },
  { id: 3, nazwa: "Statyw Manfrotto 190", dni: 3, cenaDzien: 27, dostepna: false },
];

function StepIndicator({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "3rem" }}>
      {STEPS.map((step, idx) => (
        <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: current >= step.id ? "#2d1f0e" : "#e8e0d0",
              color: current >= step.id ? "#f5e8c8" : "#92816a",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: current > step.id ? "0.8rem" : "0.82rem", fontWeight: 700,
              transition: "all 0.4s", flexShrink: 0,
            }}>
              {current > step.id
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : step.id
              }
            </div>
            <span style={{ fontSize: "0.62rem", fontWeight: current === step.id ? 700 : 500, letterSpacing: "0.1em", textTransform: "uppercase", color: current >= step.id ? "#2d1f0e" : "#92816a", whiteSpace: "nowrap" }}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div style={{ width: 80, height: 2, background: "#e8e0d0", margin: "0 0.75rem", marginBottom: "1.4rem", position: "relative", overflow: "hidden" }}>
              {current > step.id && <div style={{ position: "absolute", inset: 0, background: "#2d1f0e" }} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Koszyk({ cart, setCart, onNext }) {
  const remove = (id) => setCart((p) => p.filter((i) => i.id !== id));
  const total = cart.reduce((sum, i) => sum + i.cenaDzien * i.dni, 0);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        {cart.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 0", borderBottom: "1px solid #f0e8d8" }}>
            <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #f5ede0, #e8d8c0)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
              📷
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", color: "#2d1f0e", margin: "0 0 0.2rem" }}>{item.nazwa}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {!item.dostepna && (
                  <span style={{ fontSize: "0.65rem", background: "#fef2f2", color: "#dc2626", padding: "0.1rem 0.5rem", fontWeight: 600, borderRadius: "3px" }}>Niedostępna</span>
                )}
                <span style={{ fontSize: "0.75rem", color: "#92816a" }}>{item.dni} dni × {item.cenaDzien} zł</span>
              </div>
            </div>
            <p style={{ fontWeight: 700, color: "#2d1f0e", fontSize: "1rem", margin: 0 }}>{item.cenaDzien * item.dni} zł</p>
            <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#92816a", padding: "0.25rem", display: "flex", alignItems: "center" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e05252")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#92816a")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {cart.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#92816a" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛒</p>
          <p style={{ fontSize: "0.9rem" }}>Twój koszyk jest pusty</p>
          <Link to="/" style={{ color: "#2d1f0e", fontWeight: 600, fontSize: "0.8rem" }}>Wróć do oferty</Link>
        </div>
      )}

      {cart.length > 0 && (
        <>
          <div style={{ background: "#fdfaf5", border: "1px solid #e8e0d0", padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", color: "#6b5840" }}>Suma netto</span>
              <span style={{ fontSize: "0.82rem", color: "#2d1f0e" }}>{total} zł</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.82rem", color: "#6b5840" }}>VAT (23%)</span>
              <span style={{ fontSize: "0.82rem", color: "#2d1f0e" }}>{Math.round(total * 0.23)} zł</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e8e0d0", paddingTop: "0.75rem" }}>
              <span style={{ fontWeight: 700, color: "#2d1f0e", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>Łącznie z VAT</span>
              <span style={{ fontWeight: 700, color: "#2d1f0e", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem" }}>{Math.round(total * 1.23)} zł</span>
            </div>
          </div>

          <button onClick={onNext} style={{ width: "100%", background: "#2d1f0e", color: "#f5e8c8", border: "none", padding: "1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.3s" }}
            onMouseEnter={(e) => (e.target.style.background = "#c9a227")}
            onMouseLeave={(e) => (e.target.style.background = "#2d1f0e")}
          >
            Przejdź do danych →
          </button>
        </>
      )}
    </div>
  );
}

function GuestChoice({ onChoice }) {
  const [hover, setHover] = useState(null);

  const options = [
    { id: "login", icon: "🔑", title: "Zaloguj się", desc: "Skorzystaj z zapisanych danych i historii zamówień", cta: "Zaloguj się", href: "/logowanie" },
    { id: "register", icon: "✨", title: "Załóż konto", desc: "Szybka rejestracja — zyskaj punkty lojalnościowe", cta: "Zarejestruj się", href: "/rejestracja" },
    { id: "guest", icon: "👤", title: "Kontynuuj jako gość", desc: "Zamów bez zakładania konta — jednorazowo", cta: "Kontynuuj", action: () => onChoice("guest") },
  ];

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#2d1f0e", fontWeight: 400, margin: "0 0 0.4rem" }}>Jak chcesz kontynuować?</p>
        <p style={{ fontSize: "0.8rem", color: "#92816a" }}>Wybierz opcję, aby przejść do formularza dostawy</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {options.map((opt) => (
          <div key={opt.id}
            style={{ border: `2px solid ${hover === opt.id ? "#2d1f0e" : "#e8e0d0"}`, padding: "1.75rem 1.25rem", textAlign: "center", cursor: "pointer", transition: "all 0.3s", background: hover === opt.id ? "#fdfaf5" : "white" }}
            onMouseEnter={() => setHover(opt.id)}
            onMouseLeave={() => setHover(null)}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{opt.icon}</div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", color: "#2d1f0e", fontWeight: 400, margin: "0 0 0.5rem" }}>{opt.title}</p>
            <p style={{ fontSize: "0.72rem", color: "#92816a", lineHeight: 1.5, margin: "0 0 1.25rem" }}>{opt.desc}</p>
            {opt.href ? (
              <Link to={opt.href} style={{ display: "block", background: "#2d1f0e", color: "#f5e8c8", padding: "0.65rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
                {opt.cta}
              </Link>
            ) : (
              <button onClick={opt.action} style={{ width: "100%", background: "transparent", border: "1.5px solid #2d1f0e", color: "#2d1f0e", padding: "0.65rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                {opt.cta}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DaneDostawy({ user, onNext, onBack }) {
  const [form, setForm] = useState({
    imie: user?.name?.split(" ")[0] || "",
    nazwisko: user?.name?.split(" ")[1] || "",
    email: user?.email || "",
    telefon: "",
    ulica: "",
    numer: "",
    miasto: "",
    kodPocztowy: "",
    uwagi: "",
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(form);
  };

  const inputStyle = (half = false) => ({
    width: "100%",
    background: "transparent", border: "none",
    borderBottom: "2px solid #ddd4c5", outline: "none",
    color: "#2d1f0e", fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.9rem", padding: "0.6rem 0",
    transition: "border-color 0.3s",
  });

  const labelStyle = {
    display: "block", fontSize: "0.6rem", fontWeight: 600,
    letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#92816a", marginBottom: "0.35rem",
  };

  const fieldWrap = { marginBottom: "1.5rem" };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#2d1f0e", fontWeight: 400, margin: "0 0 1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f0e8d8" }}>
        Dane odbiorcy
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
        {[
          { name: "imie", label: "Imię" },
          { name: "nazwisko", label: "Nazwisko" },
        ].map(({ name, label }) => (
          <div style={fieldWrap} key={name}>
            <label style={labelStyle}>{label}</label>
            <input name={name} value={form[name]} onChange={handleChange} required style={inputStyle()}
              onFocus={(e) => (e.target.style.borderColor = "#c9a227")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd4c5")}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
        {[
          { name: "email", label: "E-mail", type: "email" },
          { name: "telefon", label: "Telefon" },
        ].map(({ name, label, type = "text" }) => (
          <div style={fieldWrap} key={name}>
            <label style={labelStyle}>{label}</label>
            <input name={name} type={type} value={form[name]} onChange={handleChange} required={name === "email"} style={inputStyle()}
              onFocus={(e) => (e.target.style.borderColor = "#c9a227")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd4c5")}
            />
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#2d1f0e", fontWeight: 400, margin: "0.5rem 0 1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f0e8d8" }}>
        Adres dostawy
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0 1.5rem" }}>
        {[
          { name: "ulica", label: "Ulica" },
          { name: "numer", label: "Numer" },
        ].map(({ name, label }) => (
          <div style={fieldWrap} key={name}>
            <label style={labelStyle}>{label}</label>
            <input name={name} value={form[name]} onChange={handleChange} required style={inputStyle()}
              onFocus={(e) => (e.target.style.borderColor = "#c9a227")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd4c5")}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0 1.5rem" }}>
        {[
          { name: "kodPocztowy", label: "Kod pocztowy" },
          { name: "miasto", label: "Miasto" },
        ].map(({ name, label }) => (
          <div style={fieldWrap} key={name}>
            <label style={labelStyle}>{label}</label>
            <input name={name} value={form[name]} onChange={handleChange} required style={inputStyle()}
              onFocus={(e) => (e.target.style.borderColor = "#c9a227")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd4c5")}
            />
          </div>
        ))}
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>Uwagi do zamówienia (opcjonalnie)</label>
        <textarea name="uwagi" value={form.uwagi} onChange={handleChange} rows={2}
          style={{ ...inputStyle(), resize: "none", borderBottom: "none", border: "1.5px solid #ddd4c5", padding: "0.6rem 0.75rem" }}
          onFocus={(e) => (e.target.style.borderColor = "#c9a227")}
          onBlur={(e) => (e.target.style.borderColor = "#ddd4c5")}
        />
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" onClick={onBack} style={{ background: "transparent", color: "#92816a", border: "1.5px solid #ddd4c5", padding: "0.9rem 1.5rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
          ← Wróć
        </button>
        <button type="submit" style={{ flex: 1, background: "#2d1f0e", color: "#f5e8c8", border: "none", padding: "0.9rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.3s" }}
          onMouseEnter={(e) => (e.target.style.background = "#c9a227")}
          onMouseLeave={(e) => (e.target.style.background = "#2d1f0e")}
        >
          Przejdź do podsumowania →
        </button>
      </div>
    </form>
  );
}

function Podsumowanie({ cart, formData, onBack, onSubmit, loading }) {
  const total = cart.reduce((sum, i) => sum + i.cenaDzien * i.dni, 0);
  const vat = Math.round(total * 0.23);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "#fdfaf5", border: "1px solid #e8e0d0", padding: "1.25rem" }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#92816a", margin: "0 0 0.75rem" }}>Dane odbiorcy</p>
          <p style={{ fontSize: "0.88rem", color: "#2d1f0e", margin: "0 0 0.2rem", fontWeight: 600 }}>{formData.imie} {formData.nazwisko}</p>
          <p style={{ fontSize: "0.82rem", color: "#6b5840", margin: "0 0 0.2rem" }}>{formData.email}</p>
          <p style={{ fontSize: "0.82rem", color: "#6b5840", margin: 0 }}>{formData.telefon}</p>
        </div>
        <div style={{ background: "#fdfaf5", border: "1px solid #e8e0d0", padding: "1.25rem" }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#92816a", margin: "0 0 0.75rem" }}>Adres dostawy</p>
          <p style={{ fontSize: "0.88rem", color: "#2d1f0e", margin: "0 0 0.2rem" }}>{formData.ulica} {formData.numer}</p>
          <p style={{ fontSize: "0.82rem", color: "#6b5840", margin: 0 }}>{formData.kodPocztowy} {formData.miasto}</p>
        </div>
      </div>

      <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#92816a", margin: "0 0 0.75rem" }}>Zamawiane produkty</p>
      {cart.map((item) => (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #f0e8d8" }}>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#2d1f0e", margin: 0 }}>{item.nazwa}</p>
            <p style={{ fontSize: "0.72rem", color: "#92816a", margin: 0 }}>{item.dni} dni × {item.cenaDzien} zł</p>
          </div>
          <p style={{ fontWeight: 600, color: "#2d1f0e", margin: 0 }}>{item.cenaDzien * item.dni} zł</p>
        </div>
      ))}

      <div style={{ background: "linear-gradient(135deg, #1a1108, #2d1f0e)", padding: "1.25rem 1.5rem", margin: "1.5rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.78rem", color: "#92816a" }}>Suma netto</span>
          <span style={{ fontSize: "0.78rem", color: "#c8b88a" }}>{total} zł</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.78rem", color: "#92816a" }}>VAT (23%)</span>
          <span style={{ fontSize: "0.78rem", color: "#c8b88a" }}>{vat} zł</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(201,162,39,0.3)", paddingTop: "0.75rem" }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#fdfaf5" }}>Łącznie</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#c9a227", fontWeight: 600 }}>{total + vat} zł</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" onClick={onBack} style={{ background: "transparent", color: "#92816a", border: "1.5px solid #ddd4c5", padding: "0.9rem 1.5rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
          ← Wróć
        </button>
        <button type="button" onClick={onSubmit} disabled={loading} style={{ flex: 1, background: "#c9a227", color: "#1a1108", border: "none", padding: "0.9rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.3s" }}>
          {loading ? "Przetwarzanie…" : "✓ Złóż zamówienie"}
        </button>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState(MOCK_CART.filter((i) => i.dostepna));
  const [guestMode, setGuestMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleStep2Choice = (choice) => {
    if (choice === "guest") setGuestMode(true);
  };

  const handleDaneSubmit = (data) => {
    setFormData(data);
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdfaf5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');`}</style>
        <div style={{ textAlign: "center", maxWidth: 480, padding: "2rem" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #2d7a4f, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", color: "#2d1f0e", fontWeight: 400, margin: "0 0 0.75rem" }}>Zamówienie złożone!</h1>
          <p style={{ fontSize: "0.88rem", color: "#92816a", lineHeight: 1.7, margin: "0 0 2rem" }}>
            Dziękujemy! Potwierdzenie zostało wysłane na podany adres e-mail. Skontaktujemy się z Tobą w ciągu 1 dnia roboczego.
          </p>
          <Link to="/" style={{ display: "inline-block", background: "#2d1f0e", color: "#f5e8c8", padding: "0.9rem 2.5rem", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", textDecoration: "none" }}>
            Wróć do sklepu
          </Link>
        </div>
      </div>
    );
  }

  const showGuestChoice = step === 2 && !isAuthenticated && !guestMode;

  return (
    <div style={{ minHeight: "100vh", background: "#fdfaf5", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .checkout-grid { display: grid; grid-template-columns: 1fr 360px; gap: 2rem; max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.5rem; }
        @media (max-width: 900px) { .checkout-grid { grid-template-columns: 1fr; } .checkout-sidebar { display: none; } }
      `}</style>

      <div style={{ background: "linear-gradient(135deg, #1a1108, #2d1f0e)", padding: "1.5rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#fdfaf5", fontWeight: 400, margin: 0 }}>Zamówienie</h1>
          <Link to="/koszyk" style={{ color: "#92816a", fontSize: "0.75rem", textDecoration: "none", letterSpacing: "0.05em" }}>← Powrót do sklepu</Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem 1rem" }}>
        <StepIndicator current={step} />
      </div>

      <div className="checkout-grid">
        <div style={{ background: "white", border: "1px solid #e8e0d0", padding: "2rem" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#2d1f0e", fontWeight: 400, margin: "0 0 1.75rem", paddingBottom: "1rem", borderBottom: "1px solid #f0e8d8" }}>
            {step === 1 ? "Twój koszyk" : step === 2 ? showGuestChoice ? "Opcje konta" : "Dane dostawy" : "Podsumowanie"}
          </h2>

          {step === 1 && <Koszyk cart={cart} setCart={setCart} onNext={() => setStep(2)} />}

          {step === 2 && showGuestChoice && <GuestChoice onChoice={handleStep2Choice} />}

          {step === 2 && !showGuestChoice && (
            <DaneDostawy user={user} onNext={handleDaneSubmit} onBack={() => setStep(1)} />
          )}

          {step === 3 && (
            <Podsumowanie cart={cart} formData={formData} onBack={() => setStep(2)} onSubmit={handlePlaceOrder} loading={loading} />
          )}
        </div>

        <div className="checkout-sidebar">
          <div style={{ background: "white", border: "1px solid #e8e0d0", padding: "1.5rem", position: "sticky", top: "1.5rem" }}>
            <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#92816a", margin: "0 0 1rem" }}>Twój koszyk</p>
            {cart.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid #f5ede0" }}>
                <div style={{ flex: 1, paddingRight: "0.5rem" }}>
                  <p style={{ fontSize: "0.82rem", color: "#2d1f0e", margin: 0 }}>{item.nazwa}</p>
                  <p style={{ fontSize: "0.68rem", color: "#92816a", margin: 0 }}>{item.dni} dni</p>
                </div>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2d1f0e" }}>{item.cenaDzien * item.dni} zł</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "2px solid #2d1f0e" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", color: "#2d1f0e" }}>Łącznie z VAT</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 600, color: "#2d1f0e" }}>
                {Math.round(cart.reduce((s, i) => s + i.cenaDzien * i.dni, 0) * 1.23)} zł
              </span>
            </div>
          </div>

          <div style={{ background: "#fdfaf5", border: "1px solid #e8e0d0", padding: "1.25rem 1.5rem", marginTop: "1rem" }}>
            <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#92816a", margin: "0 0 0.75rem" }}>Bezpieczeństwo</p>
            {["Szyfrowane płatności (SSL)", "Gwarancja zwrotu w 24h", "Ochrona kupującego"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2d7a4f" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: "0.75rem", color: "#6b5840" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}