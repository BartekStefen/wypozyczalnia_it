import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

// Zakładki panelu klienta
const TABS = [
  { id: "dane",       label: "Moje dane",           icon: "👤" },
  { id: "historia",   label: "Historia wypożyczeń",  icon: "📦" },
  { id: "ulubione",   label: "Ulubione",             icon: "❤️" },
  { id: "adres",      label: "Adresy",               icon: "📍" },
  { id: "ustawienia", label: "Ustawienia",           icon: "⚙️" },
];

// Mapowanie statusów z bazy na style i etykiety UI
const STATUS_STYLE = {
  aktywne:      { bg: "#eff6ff", color: "#2563eb",  label: "Aktywne" },
  zwrócono:     { bg: "#f1f5f9", color: "#475569",  label: "Zakończone" },
  anulowano:    { bg: "#fef2f2", color: "#dc2626",  label: "Anulowane" },
  "Trwa":       { bg: "#eff6ff", color: "#2563eb",  label: "Aktywne" },
  "Zakończony": { bg: "#f1f5f9", color: "#475569",  label: "Zakończony" },
  "Anulowany":  { bg: "#fef2f2", color: "#dc2626",  label: "Anulowany" },
};

// ─── Dane osobowe ─────────────────────────────────────────────────────────
function TabDane({ user, onSave }) {
  const [form, setForm]   = useState({
    firstName: user?.firstName || user?.imie || "",
    lastName:  user?.lastName  || user?.nazwisko || "",
    email:     user?.email     || "",
    phone:     user?.phone     || "",
  });
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.put("/mnie", form);
      setSaved(true);
      onSave?.({ ...user, ...form });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Błąd zapisu danych.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Nagłówek z awatarem */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem", padding: "1.5rem", background: "linear-gradient(135deg, #1e3a8a, #2563eb)", borderRadius: "12px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          {(user?.firstName || user?.imie || "U")[0].toUpperCase()}
        </div>
        <div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", color: "#fff", fontWeight: 800, margin: "0 0 0.2rem" }}>
            {user?.firstName || user?.imie} {user?.lastName || user?.nazwisko}
          </p>
          <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", margin: 0 }}>{user?.email}</p>
          <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.65rem", padding: "0.15rem 0.6rem", borderRadius: "99px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
            {user?.rola === "admin" ? "Administrator" : "Klient"}
          </span>
        </div>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>{error}</div>}

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem 2rem" }}>
          {[
            { name: "firstName", label: "Imię" },
            { name: "lastName",  label: "Nazwisko" },
            { name: "email",     label: "Adres e-mail", type: "email" },
            { name: "phone",     label: "Telefon",      type: "tel" },
          ].map(({ name, label, type = "text" }) => (
            <div key={name}>
              <label style={ps.label}>{label}</label>
              <input type={type} value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} style={ps.input} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.5rem" }}>
          <button type="submit" disabled={saving} style={ps.btnPrimary}>
            {saving ? "Zapisywanie…" : "Zapisz zmiany"}
          </button>
          {saved && <span style={{ color: "#16a34a", fontSize: "0.82rem", fontWeight: 600 }}>✅ Zapisano</span>}
        </div>
      </form>
    </div>
  );
}

// ─── Historia wypożyczeń ──────────────────────────────────────────────────
function TabHistoria() {
  const [historia, setHistoria] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // Pobierz rzeczywistą historię z API — dane z tabel wypozyczenia + modele_sprzetu
    axios.get("/moje-wypozyczenia")
      .then(r => setHistoria(r.data))
      .catch(() => setHistoria([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Wczytywanie historii…</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      {historia.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📦</div>
          <p>Brak historii wypożyczeń</p>
          <Link to="/" style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.875rem" }}>Przeglądaj katalog</Link>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
              {["Numer", "Produkt", "Okres", "Kwota", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historia.map(row => {
              const s = STATUS_STYLE[row.status] || STATUS_STYLE["zwrócono"];
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "1rem", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>{row.id}</td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#374151" }}>{row.produkt}</td>
                  <td style={{ padding: "1rem", fontSize: "0.8rem", color: "#64748b" }}>{row.dataOd} – {row.dataDo}</td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 700, color: "#2563eb" }}>{row.kwota}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ background: s.bg, color: s.color, fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: "99px" }}>{s.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Ulubione ─────────────────────────────────────────────────────────────
function TabUlubione() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    axios.get("/ulubione").then(r => setFavorites(r.data)).catch(() => setFavorites([])).finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    try { await axios.delete(`/ulubione/${id}`); } catch {}
    setFavorites(p => p.filter(f => f.id !== id));
  };

  if (loading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Wczytywanie ulubionych…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.25rem" }}>
      {favorites.length === 0 ? (
        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🤍</div>
          <p>Brak ulubionych produktów</p>
          <Link to="/" style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.875rem" }}>Przeglądaj katalog</Link>
        </div>
      ) : favorites.map(item => (
        <div key={item.id} style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", position: "relative", transition: "box-shadow 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.1)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
          <button onClick={() => remove(item.id)} style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "#fef2f2", border: "none", borderRadius: "6px", width: 28, height: 28, cursor: "pointer", color: "#dc2626" }}>✕</button>
          <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.4rem" }}>{item.kategoria || "Sprzęt IT"}</p>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem", paddingRight: "1.5rem" }}>{item.nazwa}</p>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", margin: "0 0 1rem" }}>{item.cena}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: item.dostepny ? "#16a34a" : "#dc2626" }}>
              {item.dostepny ? "● Dostępny" : "● Niedostępny"}
            </span>
            <Link to={`/sprzet/${item.id_egzemplarza || item.sprzet_id}`}
              style={{ padding: "0.4rem 0.85rem", background: item.dostepny ? "#2563eb" : "#e2e8f0", color: item.dostepny ? "#fff" : "#94a3b8", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "0.78rem", pointerEvents: item.dostepny ? "auto" : "none" }}>
              Zarezerwuj
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Adresy ───────────────────────────────────────────────────────────────
function TabAdres() {
  const [adresy, setAdresy]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const emptyForm = { etykieta: "Adres główny", ulica: "", kod_pocztowy: "", miasto: "" };
  const [form, setForm] = useState(emptyForm);

  // Pobierz adresy z API — wymaga tokenu autoryzacji
  const fetchAdresy = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/adresy");
      setAdresy(data);
    } catch {
      setAdresy([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdresy(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.ulica || !form.kod_pocztowy || !form.miasto) {
      setError("Wypełnij wszystkie wymagane pola: ulica, kod pocztowy, miasto.");
      return;
    }
    setSaving(true);
    try {
      await axios.post("/adresy", form);
      setSuccess("Adres dodany pomyślnie.");
      setShowForm(false);
      setForm(emptyForm);
      await fetchAdresy();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Błąd zapisu adresu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Czy usunąć ten adres?")) return;
    try {
      await axios.delete(`/adresy/${id}`);
      setAdresy(p => p.filter(a => a.id_adresu !== id));
    } catch {}
  };

  const handleDomyslny = async (id) => {
    try {
      await axios.patch(`/adresy/${id}/domyslny`);
      setAdresy(p => p.map(a => ({ ...a, domyslny: a.id_adresu === id ? 1 : 0 })));
    } catch {}
  };

  if (loading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Wczytywanie adresów…</div>;

  return (
    <div>
      {error   && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>⚠️ {error}</div>}
      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>✅ {success}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        {adresy.map(a => (
          <div key={a.id_adresu} style={{ border: `2px solid ${a.domyslny ? "#2563eb" : "#e2e8f0"}`, borderRadius: "12px", padding: "1.5rem", position: "relative" }}>
            {a.domyslny ? (
              <span style={{ position: "absolute", top: "-10px", left: "1rem", background: "#2563eb", color: "#fff", fontSize: "0.62rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "99px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Domyślny</span>
            ) : null}
            <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 0.75rem" }}>{a.etykieta}</p>
            <p style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600, margin: "0 0 0.2rem" }}>{a.ulica}</p>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 1rem" }}>{a.kod_pocztowy} {a.miasto}</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {!a.domyslny && (
                <button onClick={() => handleDomyslny(a.id_adresu)} style={{ ...ps.btnGhost, fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}>
                  Ustaw domyślny
                </button>
              )}
              <button onClick={() => handleDelete(a.id_adresu)} style={{ marginLeft: "auto", background: "#fef2f2", border: "none", borderRadius: "6px", color: "#dc2626", cursor: "pointer", padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}>
                Usuń
              </button>
            </div>
          </div>
        ))}

        {/* Kafelek "Dodaj adres" */}
        <button onClick={() => { setShowForm(true); setError(""); }}
          style={{ border: "2px dashed #e2e8f0", borderRadius: "12px", padding: "1.5rem", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#94a3b8", minHeight: 140, transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#2563eb"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
          <span style={{ fontSize: "1.5rem" }}>+</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Dodaj adres</span>
        </button>
      </div>

      {/* Formularz nowego adresu */}
      {showForm && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem" }}>
          <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1.25rem" }}>Nowy adres</h4>
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={ps.label}>Etykieta (opcjonalna)</label>
                <input style={ps.input} placeholder="np. Dom, Praca" value={form.etykieta} onChange={e => setForm(p => ({ ...p, etykieta: e.target.value }))} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={ps.label}>Ulica i numer *</label>
                <input style={ps.input} placeholder="ul. Przykładowa 12/3" value={form.ulica} onChange={e => setForm(p => ({ ...p, ulica: e.target.value }))} required />
              </div>
              <div>
                <label style={ps.label}>Kod pocztowy *</label>
                <input style={ps.input} placeholder="00-000" value={form.kod_pocztowy} onChange={e => setForm(p => ({ ...p, kod_pocztowy: e.target.value }))} required />
              </div>
              <div>
                <label style={ps.label}>Miasto *</label>
                <input style={ps.input} placeholder="Warszawa" value={form.miasto} onChange={e => setForm(p => ({ ...p, miasto: e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button type="submit" style={ps.btnPrimary} disabled={saving}>{saving ? "Zapisywanie…" : "Zapisz adres"}</button>
              <button type="button" style={ps.btnGhost} onClick={() => { setShowForm(false); setError(""); }}>Anuluj</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Ustawienia ───────────────────────────────────────────────────────────
function TabUstawienia({ wyloguj }) {
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPass: "" });
  const [passMsg, setPassMsg]   = useState("");
  const [passErr, setPassErr]   = useState("");
  const [saving, setSaving]     = useState(false);

  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassErr(""); setPassMsg("");
    if (passForm.newPassword !== passForm.confirmPass) { setPassErr("Hasła się nie zgadzają."); return; }
    if (passForm.newPassword.length < 8) { setPassErr("Nowe hasło musi mieć min. 8 znaków."); return; }
    setSaving(true);
    try {
      await axios.post("/zmien-haslo", { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassMsg("Hasło zostało zmienione.");
      setPassForm({ currentPassword: "", newPassword: "", confirmPass: "" });
    } catch (err) {
      setPassErr(err.response?.data?.message || "Błąd. Sprawdź obecne hasło.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <form onSubmit={handlePassChange} style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1rem" }}>Zmiana hasła</h3>
        {[
          { name: "currentPassword", placeholder: "Obecne hasło" },
          { name: "newPassword",     placeholder: "Nowe hasło (min. 8 znaków)" },
          { name: "confirmPass",     placeholder: "Potwierdź nowe hasło" },
        ].map(({ name, placeholder }) => (
          <div key={name} style={{ marginBottom: "0.85rem" }}>
            <input type="password" placeholder={placeholder} value={passForm[name]}
              onChange={e => setPassForm(p => ({ ...p, [name]: e.target.value }))} style={ps.input} />
          </div>
        ))}
        {passErr && <p style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.75rem" }}>⚠️ {passErr}</p>}
        {passMsg && <p style={{ color: "#16a34a", fontSize: "0.82rem", marginBottom: "0.75rem" }}>✅ {passMsg}</p>}
        <button type="submit" style={ps.btnPrimary} disabled={saving}>{saving ? "Zmienianie…" : "Zmień hasło"}</button>
      </form>

      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.5rem" }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1rem" }}>Sesja</h3>
        <button onClick={wyloguj}
          style={{ background: "transparent", color: "#dc2626", border: "1.5px solid #dc2626", padding: "0.75rem 1.75rem", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.target.style.background = "#dc2626"; e.target.style.color = "#fff"; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#dc2626"; }}>
          Wyloguj się
        </button>
      </div>
    </div>
  );
}

// ─── Główny komponent panelu klienta ─────────────────────────────────────
export default function PanelKlienta() {
  const { uzytkownik, ladowanie, wyloguj, czyZalogowany } = useAuth();
  const [activeTab, setActiveTab] = useState("dane");

  if (ladowanie) return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Ładowanie…</div>;
  if (!czyZalogowany) return <Navigate to="/logowanie" state={{ from: { pathname: "/panel" } }} replace />;

  const imie = uzytkownik?.firstName || uzytkownik?.imie || "Kliencie";

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

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .panel-tabs { display: flex; gap: 0; overflow-x: auto; border-bottom: none; }
        .panel-tab { padding: 0.9rem 1.25rem; background: transparent; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; font-weight: 600; cursor: pointer; color: rgba(255,255,255,0.6); border-bottom: 3px solid transparent; white-space: nowrap; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
        .panel-tab:hover { color: rgba(255,255,255,0.9); }
        .panel-tab.active { color: #fff; border-bottom-color: #60a5fa; }
        input:focus, select:focus, textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; outline: none; }
      `}</style>

      {/* Nagłówek z nawigacją zakładkową */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a8a)", paddingTop: "1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem 0" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#60a5fa", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>Panel klienta</p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.8rem", color: "#fff", fontWeight: 800, margin: "0.2rem 0 0" }}>Witaj, {imie}</h1>
          </div>
          <div className="panel-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`panel-tab${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Treść zakładki */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "2rem", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
            {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Style współdzielone w panelu klienta
const ps = {
  label:      { display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.35rem" },
  input:      { width: "100%", padding: "0.7rem 1rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.875rem", color: "#0f172a", boxSizing: "border-box", transition: "border-color 0.2s" },
  btnPrimary: { padding: "0.75rem 1.75rem", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", border: "none", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.3)", transition: "all 0.2s" },
  btnGhost:   { padding: "0.75rem 1.25rem", background: "#fff", color: "#475569", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
};