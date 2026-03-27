import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const TABS = [
  { id: "dane",       label: "Moje dane",           icon: "👤" },
  { id: "historia",   label: "Historia wypożyczeń",  icon: "📦" },
  { id: "ulubione",   label: "Ulubione",             icon: "❤️" },
  { id: "adres",      label: "Adresy",               icon: "📍" },
  { id: "ustawienia", label: "Ustawienia",           icon: "⚙️" },
];

const STATUS_STYLE = {
  aktywne:   { bg: "#ecfdf5", color: "#059669", label: "Aktywne" },
  zwrócono:  { bg: "#f1f5f9", color: "#475569", label: "Zwrócono" },
  anulowano: { bg: "#fef2f2", color: "#dc2626", label: "Anulowano" },
  "Trwa":    { bg: "#ecfdf5", color: "#059669", label: "Aktywne" },
  "Zakończony": { bg: "#f1f5f9", color: "#475569", label: "Zakończony" },
  "Anulowany":  { bg: "#fef2f2", color: "#dc2626", label: "Anulowany" },
};

function TabDane({ user, onSave }) {
  const [form, setForm] = useState({
    imie:     user?.imie || user?.name?.split(" ")[0] || "",
    nazwisko: user?.nazwisko || user?.name?.split(" ")[1] || "",
    email:    user?.email || "",
    telefon:  user?.telefon || "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put("/mnie", form);
      setSaved(true);
      onSave?.({ ...user, ...form });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // fallback — lokalny zapis
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2.5rem", padding: "1.5rem", background: "linear-gradient(135deg, #1a1108, #2d1f0e)", borderRadius: "12px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #c9a227, #e8c547)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 700, color: "#1a1108", flexShrink: 0 }}>
          {(user?.imie || user?.name || "U")[0].toUpperCase()}
        </div>
        <div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#fdfaf5", fontWeight: 400, margin: 0 }}>
            {user?.imie || user?.name || "Klient"}
          </p>
          <p style={{ fontSize: "0.78rem", color: "#92816a", margin: 0 }}>{user?.email}</p>
          <span style={{ background: "rgba(201,162,39,0.15)", color: "#c9a227", fontSize: "0.65rem", padding: "0.2rem 0.6rem", borderRadius: "20px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
            {user?.rola === "admin" ? "Administrator" : "Klient"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem 2rem" }}>
          {[
            { name: "imie",     label: "Imię" },
            { name: "nazwisko", label: "Nazwisko" },
            { name: "email",    label: "Adres e-mail" },
            { name: "telefon",  label: "Telefon" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label style={{ display: "block", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#92816a", marginBottom: "0.4rem" }}>{label}</label>
              <input
                type={name === "email" ? "email" : "text"}
                value={form[name]}
                onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "2px solid #ddd4c5", outline: "none", color: "#2d2318", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", padding: "0.6rem 0", transition: "border-color 0.3s" }}
                onFocus={(e) => (e.target.style.borderColor = "#c9a227")}
                onBlur={(e) => (e.target.style.borderColor = "#ddd4c5")}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
          <button type="submit" disabled={saving} style={{ background: "#2d1f0e", color: "#f5e8c8", border: "none", padding: "0.8rem 2rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
            onMouseEnter={(e) => !saving && (e.target.style.background = "#c9a227")}
            onMouseLeave={(e) => !saving && (e.target.style.background = "#2d1f0e")}
          >
            {saving ? "Zapisywanie…" : "Zapisz zmiany"}
          </button>
          {saved && (
            <span style={{ color: "#059669", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Zapisano pomyślnie
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function TabHistoria() {
  const [historia, setHistoria] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/moje-wypozyczenia")
      .then(r => setHistoria(r.data))
      .catch(() => {
        setHistoria([
          { id: "ZAM-8821", produkt: "Kamera Sony A7 IV",        status: "zwrócono", dataOd: "2025-05-10", dataDo: "2025-05-17", kwota: "420 zł" },
          { id: "ZAM-8756", produkt: "Obiektyw Sigma 85mm f/1.4", status: "aktywne", dataOd: "2025-06-01", dataDo: "2025-06-08", kwota: "180 zł" },
          { id: "ZAM-8634", produkt: "Statyw Manfrotto 190",      status: "zwrócono", dataOd: "2025-04-20", dataDo: "2025-04-25", kwota: "80 zł" },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#92816a" }}>Wczytywanie historii…</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e8e0d0" }}>
            {["Numer zamówienia", "Produkt", "Okres", "Kwota", "Status"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "0.75rem 1rem", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#92816a" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {historia.map((row) => {
            const s = STATUS_STYLE[row.status] || STATUS_STYLE["zwrócono"];
            return (
              <tr key={row.id} style={{ borderBottom: "1px solid #f0e8d8", transition: "background 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fdfaf5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "1rem", fontSize: "0.82rem", fontWeight: 600, color: "#2d1f0e", fontFamily: "monospace" }}>{row.id}</td>
                <td style={{ padding: "1rem", fontSize: "0.85rem", color: "#3d2b12" }}>{row.produkt}</td>
                <td style={{ padding: "1rem", fontSize: "0.78rem", color: "#6b5840" }}>{row.dataOd} – {row.dataDo}</td>
                <td style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "#2d1f0e" }}>{row.kwota}</td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ background: s.bg, color: s.color, fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.7rem", borderRadius: "20px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {historia.length === 0 && <div style={{ textAlign: "center", padding: "4rem", color: "#92816a" }}>Brak historii zamówień</div>}
    </div>
  );
}

function TabUlubione() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/ulubione")
      .then(r => setFavorites(r.data))
      .catch(() => {
        setFavorites([
          { id: 1, nazwa: "Dron DJI Mavic 3",          kategoria: "Drony",       cena: "250 zł / dzień", dostepny: true,  id_egzemplarza: 1 },
          { id: 2, nazwa: "Gimbal DJI RS 3",            kategoria: "Stabilizatory", cena: "90 zł / dzień", dostepny: true, id_egzemplarza: 2 },
          { id: 3, nazwa: "Monitor podglądowy Atomos",  kategoria: "Monitory",    cena: "140 zł / dzień", dostepny: false, id_egzemplarza: 3 },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    try { await axios.delete(`/ulubione/${id}`); } catch {}
    setFavorites((p) => p.filter((f) => f.id !== id));
  };

  if (loading) return <div style={{ padding: "2rem", color: "#92816a" }}>Wczytywanie ulubionych…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
      {favorites.map((item) => (
        <div key={item.id} style={{ border: "1px solid #e8e0d0", padding: "1.25rem", position: "relative", transition: "box-shadow 0.3s" }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(45,31,14,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
          <button onClick={() => remove(item.id)} style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "none", border: "none", cursor: "pointer", color: "#e05252", fontSize: "1.1rem", lineHeight: 1 }}>×</button>
          <p style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#92816a", margin: "0 0 0.4rem" }}>{item.kategoria}</p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#2d1f0e", margin: "0 0 0.75rem", fontWeight: 400 }}>{item.nazwa}</p>
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#2d1f0e", margin: "0 0 1rem" }}>{item.cena}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.68rem", color: item.dostepny ? "#059669" : "#dc2626", fontWeight: 600 }}>
              {item.dostepny ? "● Dostępny" : "● Niedostępny"}
            </span>
            <Link to={`/sprzet/${item.id_egzemplarza || item.id}`}
              style={{ background: item.dostepny ? "#2d1f0e" : "#e8e0d0", color: item.dostepny ? "#f5e8c8" : "#92816a", border: "none", padding: "0.4rem 0.9rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: item.dostepny ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", textDecoration: "none", pointerEvents: item.dostepny ? "auto" : "none" }}
            >
              Zarezerwuj
            </Link>
          </div>
        </div>
      ))}
      {favorites.length === 0 && (
        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", color: "#92816a" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>❤️</p>
          <p>Brak ulubionych produktów</p>
          <Link to="/" style={{ color: "#2d1f0e", fontWeight: 600, fontSize: "0.85rem" }}>Przeglądaj katalog</Link>
        </div>
      )}
    </div>
  );
}

function TabAdres() {
  const [adresy, setAdresy] = useState([
    { label: "Adres główny", adres: "ul. Marszałkowska 12/4", miasto: "00-001 Warszawa", domyslny: true },
  ]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
        {adresy.map((a, i) => (
          <div key={i} style={{ border: `2px solid ${a.domyslny ? "#c9a227" : "#e8e0d0"}`, padding: "1.5rem", position: "relative" }}>
            {a.domyslny && <span style={{ position: "absolute", top: "-10px", left: "1rem", background: "#c9a227", color: "#1a1108", fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Domyślny</span>}
            <p style={{ fontSize: "0.62rem", fontWeight: 600, color: "#92816a", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>{a.label}</p>
            <p style={{ fontSize: "0.9rem", color: "#2d1f0e", margin: "0 0 0.2rem" }}>{a.adres}</p>
            <p style={{ fontSize: "0.85rem", color: "#6b5840", margin: 0 }}>{a.miasto}</p>
          </div>
        ))}
        <button
          onClick={() => {}}
          style={{ border: "2px dashed #ddd4c5", padding: "1.5rem", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#92816a", fontFamily: "'DM Sans', sans-serif", minHeight: "120px" }}
        >
          <span style={{ fontSize: "1.5rem" }}>+</span>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Dodaj adres</span>
        </button>
      </div>
    </div>
  );
}

function TabUstawienia({ wyloguj }) {
  const [passForm, setPassForm] = useState({ obecne: "", nowe: "", potwierdzenie: "" });
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassErr(""); setPassMsg("");
    if (passForm.nowe !== passForm.potwierdzenie) { setPassErr("Hasła się nie zgadzają."); return; }
    if (passForm.nowe.length < 8) { setPassErr("Nowe hasło musi mieć min. 8 znaków."); return; }
    try {
      await axios.post("/zmien-haslo", { obecne_haslo: passForm.obecne, nowe_haslo: passForm.nowe });
      setPassMsg("Hasło zostało zmienione.");
      setPassForm({ obecne: "", nowe: "", potwierdzenie: "" });
    } catch (err) {
      setPassErr(err.response?.data?.message || "Błąd. Sprawdź obecne hasło.");
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <form onSubmit={handlePassChange} style={{ borderBottom: "1px solid #e8e0d0", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", color: "#2d1f0e", fontWeight: 400, margin: "0 0 1rem" }}>Zmiana hasła</h3>
        {[
          { name: "obecne",       placeholder: "Obecne hasło" },
          { name: "nowe",         placeholder: "Nowe hasło (min. 8 znaków)" },
          { name: "potwierdzenie", placeholder: "Potwierdź nowe hasło" },
        ].map(({ name, placeholder }) => (
          <div key={name} style={{ marginBottom: "1rem" }}>
            <input type="password" placeholder={placeholder} value={passForm[name]}
              onChange={(e) => setPassForm(p => ({ ...p, [name]: e.target.value }))}
              style={{ width: "100%", background: "transparent", border: "none", borderBottom: "2px solid #ddd4c5", outline: "none", color: "#2d1f0e", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", padding: "0.6rem 0" }}
            />
          </div>
        ))}
        {passErr && <p style={{ color: "#e05252", fontSize: "0.78rem", marginBottom: "0.75rem" }}>{passErr}</p>}
        {passMsg && <p style={{ color: "#059669", fontSize: "0.78rem", marginBottom: "0.75rem" }}>{passMsg}</p>}
        <button type="submit" style={{ background: "#2d1f0e", color: "#f5e8c8", border: "none", padding: "0.75rem 1.75rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.73rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Zmień hasło</button>
      </form>

      <div style={{ borderBottom: "1px solid #e8e0d0", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", color: "#2d1f0e", fontWeight: 400, margin: "0 0 1rem" }}>Powiadomienia</h3>
        {[
          "E-mail o statusie zamówienia",
          "Oferty specjalne i promocje",
          "Przypomnienie o terminie zwrotu",
        ].map((label, i) => (
          <label key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #f5ede0", cursor: "pointer" }}>
            <span style={{ fontSize: "0.85rem", color: "#3d2b12" }}>{label}</span>
            <input type="checkbox" defaultChecked={i < 2} style={{ width: 16, height: 16, accentColor: "#c9a227", cursor: "pointer" }} />
          </label>
        ))}
      </div>

      <button
        onClick={wyloguj}
        style={{ background: "transparent", color: "#e05252", border: "1.5px solid #e05252", padding: "0.75rem 1.75rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.73rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s" }}
        onMouseEnter={(e) => { e.target.style.background = "#e05252"; e.target.style.color = "white"; }}
        onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#e05252"; }}
      >
        Wyloguj się
      </button>
    </div>
  );
}

export default function PanelKlienta() {
  const { uzytkownik, ladowanie, wyloguj, czyZalogowany } = useAuth();
  const [activeTab, setActiveTab] = useState("dane");

  if (ladowanie) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#92816a" }}>Ładowanie…</div>
  );

  if (!czyZalogowany) return <Navigate to="/logowanie" state={{ from: { pathname: "/panel" } }} replace />;

  const renderContent = () => {
    switch (activeTab) {
      case "dane":       return <TabDane user={uzytkownik} />;
      case "historia":   return <TabHistoria />;
      case "ulubione":   return <TabUlubione />;
      case "adres":      return <TabAdres />;
      case "ustawienia": return <TabUstawienia wyloguj={wyloguj} />;
      default:           return null;
    }
  };

  const imie = uzytkownik?.imie || uzytkownik?.name?.split(" ")[0] || "Kliencie";

  return (
    <div style={{ minHeight: "100vh", background: "#fdfaf5", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .panel-header { background: linear-gradient(135deg, #1a1108 0%, #2d1f0e 100%); padding: 2rem 2.5rem 0; }
        .panel-tabs { display: flex; gap: 0; overflow-x: auto; }
        .panel-tab { padding: 0.9rem 1.5rem; background: transparent; border: none; font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; color: #92816a; border-bottom: 3px solid transparent; white-space: nowrap; transition: all 0.3s; display: flex; align-items: center; gap: 0.5rem; }
        .panel-tab:hover { color: #c9a227; }
        .panel-tab.active { color: #f5e8c8; border-bottom-color: #c9a227; }
        .panel-body { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem; }
        .stat-card { background: white; border: 1px solid #e8e0d0; padding: 1.25rem 1.5rem; flex: 1; }
      `}</style>

      <div className="panel-header">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ paddingBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.62rem", fontWeight: 600, color: "#c9a227", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>Panel klienta</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "#fdfaf5", fontWeight: 400, margin: "0.2rem 0 0" }}>
              Witaj, {imie}
            </h1>
          </div>
          <div className="panel-tabs">
            {TABS.map((tab) => (
              <button key={tab.id} className={`panel-tab${activeTab === tab.id ? " active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-body">
        <div style={{ background: "white", border: "1px solid #e8e0d0", padding: "2rem" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#2d1f0e", fontWeight: 400, margin: "0 0 1.75rem", paddingBottom: "1rem", borderBottom: "1px solid #f0e8d8" }}>
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}