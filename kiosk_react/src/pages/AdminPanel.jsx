import { useState, useEffect, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

// ─── Pomocnicze komponenty UI ─────────────────────────────────────────────

// Karta KPI na dashboardzie — wyświetla ikonę, wartość, etykietę i trend procentowy
function StatCard({ icon, label, value, sub, color = "#2563eb", trend }) {
  return (
    <div style={sc.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ ...sc.iconWrap, background: `${color}18` }}>
          <span style={{ fontSize: "1.4rem" }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: trend >= 0 ? "#16a34a" : "#dc2626", background: trend >= 0 ? "#f0fdf4" : "#fef2f2", padding: "0.2rem 0.5rem", borderRadius: "99px" }}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <div style={{ ...sc.statValue, color }}>{value}</div>
        <div style={sc.statLabel}>{label}</div>
        {sub && <div style={sc.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

// Badge statusu — mapuje wartości z bazy na kolory
function StatusBadge({ status }) {
  const map = {
    "Dostępny":   { bg: "#f0fdf4", color: "#16a34a" },
    "Wypożyczony":{ bg: "#eff6ff", color: "#2563eb" },
    "Serwis":     { bg: "#fefce8", color: "#ca8a04" },
    "Trwa":       { bg: "#eff6ff", color: "#2563eb" },
    "Zakończony": { bg: "#f1f5f9", color: "#475569" },
    "Anulowany":  { bg: "#fef2f2", color: "#dc2626" },
    "admin":      { bg: "#fdf4ff", color: "#9333ea" },
    "klient":     { bg: "#f0fdf4", color: "#16a34a" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: "99px", letterSpacing: "0.03em" }}>
      {status}
    </span>
  );
}

// Paginacja tabeli — pojawia się tylko gdy jest więcej niż jedna strona
function Pagination({ page, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "1rem 1.5rem", borderTop: "1px solid #f1f5f9" }}>
      <button style={pb.btn} disabled={page === 1} onClick={() => onPageChange(page - 1)}>← Poprzednia</button>
      <span style={pb.info}>Strona {page} z {lastPage}</span>
      <button style={pb.btn} disabled={page === lastPage} onClick={() => onPageChange(page + 1)}>Następna →</button>
    </div>
  );
}
const pb = {
  btn:  { padding: "0.4rem 0.9rem", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "#475569" },
  info: { display: "flex", alignItems: "center", padding: "0 0.5rem", fontSize: "0.82rem", color: "#94a3b8" },
};

// Szkielet ładowania wierszy — animowany placeholder podczas fetcha
function TableSkeleton({ rows = 5, cols = 4 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} style={{ padding: "1rem 1.25rem" }}>
          <div style={{ height: 16, background: "#f1f5f9", borderRadius: 4, width: j === 0 ? "60%" : "80%", animation: "adminShimmer 1.4s infinite" }} />
        </td>
      ))}
    </tr>
  ));
}

// ─── Dashboard ────────────────────────────────────────────────────────────
function TabDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    // Pobierz rzeczywiste statystyki z bazy — endpoint zwraca zagregowane dane
    axios.get("/admin/stats")
      .then(r => setStats(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Ładowanie statystyk…</div>;

  if (error || !stats) return (
    <div style={{ padding: "2rem" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "1rem 1.25rem", color: "#dc2626", fontSize: "0.875rem" }}>
        ⚠️ Nie udało się pobrać statystyk. Sprawdź czy backend Laravel jest uruchomiony.
      </div>
    </div>
  );

  return (
    <div>
      {/* Karty KPI — dane z /admin/stats */}
      <div style={tab.statsGrid}>
        <StatCard icon="🖥️" label="Sprzęt ogółem"       value={stats.equipment.total}    sub={`${stats.equipment.available} dostępnych`} color="#2563eb" />
        <StatCard icon="📦" label="Aktywne wypożyczenia" value={stats.rentals.active}     sub={`${stats.rentals.total} łącznie`}          color="#7c3aed" />
        <StatCard icon="👥" label="Klienci"              value={stats.users}              sub="zarejestrowanych"                          color="#0891b2" />
        <StatCard icon="💰" label="Przychód"             value={`${parseFloat(stats.totalRevenue || 0).toLocaleString("pl-PL")} zł`}     color="#16a34a" />
      </div>

      {/* Paski postępu stanu magazynowego */}
      <div style={{ ...tab.section, marginTop: "1.5rem" }}>
        <h3 style={tab.sectionTitle}>Stan magazynowy</h3>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {[
            { label: "Dostępny",    val: stats.equipment.available, color: "#16a34a", bg: "#f0fdf4" },
            { label: "Wypożyczony", val: stats.equipment.rented,    color: "#2563eb", bg: "#eff6ff" },
            { label: "Serwis",      val: stats.equipment.service,   color: "#ca8a04", bg: "#fefce8" },
          ].map(({ label, val, color, bg }) => {
            const pct = stats.equipment.total > 0 ? Math.round((val / stats.equipment.total) * 100) : 0;
            return (
              <div key={label} style={{ flex: 1, minWidth: 180, background: bg, borderRadius: 12, padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.5rem", fontWeight: 800, color, marginTop: "0.5rem" }}>{val}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sprzęt ───────────────────────────────────────────────────────────────
function TabEquipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [meta, setMeta]           = useState({ last_page: 1, total: 0 });
  const [statusFilter, setFilter] = useState("");
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditing]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  // Listy rozwijane pobierane z bazy — marki i modele już istniejące w systemie
  const [marki, setMarki]   = useState([]);
  const [modele, setModele] = useState([]);

  const emptyForm = { marka: "", marka_nowa: "", nazwa_modelu: "", nazwa_modelu_nowa: "", numer_seryjny: "", cena_wypozyczenia_dzien: "", status: "Dostępny" };
  const [form, setForm] = useState(emptyForm);

  // Pobierz dostępne marki i modele dla selectów formularza
  useEffect(() => {
    axios.get("/admin/modele")
      .then(r => {
        // Unikalne marki z listy modeli
        const unikMarki = [...new Set(r.data.map(m => m.marka))].sort();
        setMarki(unikMarki);
        setModele(r.data);
      })
      .catch(() => {});
  }, []);

  const fetchEquipment = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (statusFilter) params.append("status", statusFilter);
      if (search)       params.append("search", search);
      const { data } = await axios.get(`/admin/equipment?${params}`);
      setEquipment(data.data ?? data);
      setMeta({ last_page: data.last_page ?? 1, total: data.total ?? 0 });
    } catch {
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchEquipment(page); }, [page, statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => fetchEquipment(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Modele pasujące do wybranej marki — filtruje listę po lewej stronie selecta
  const modeleDlaMarki = form.marka
    ? modele.filter(m => m.marka === form.marka)
    : modele;

  const handleSave = async () => {
    setSaveError("");
    // Użyj wpisanej wartości jeśli wybrano "Nowa...", inaczej wartość z selecta
    const markaFinalna      = form.marka      === "__nowa__" ? form.marka_nowa      : form.marka;
    const modelFinalny      = form.nazwa_modelu === "__nowy__" ? form.nazwa_modelu_nowa : form.nazwa_modelu;

    if (!markaFinalna || !modelFinalny || !form.numer_seryjny || !form.cena_wypozyczenia_dzien) {
      setSaveError("Wypełnij wszystkie wymagane pola: Marka, Model, Nr seryjny, Cena.");
      return;
    }

    const payload = {
      marka:                   markaFinalna,
      nazwa_modelu:            modelFinalny,
      numer_seryjny:           form.numer_seryjny,
      cena_wypozyczenia_dzien: form.cena_wypozyczenia_dzien,
      status:                  form.status,
    };

    setSaving(true);
    try {
      if (editingId) {
        await axios.patch(`/admin/equipment/${editingId}`, payload);
      } else {
        await axios.post("/admin/equipment", payload);
      }
      await fetchEquipment(page);
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(" ") || "Błąd zapisu."
        : "Błąd zapisu.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      marka:                   item.marka,
      marka_nowa:              "",
      nazwa_modelu:            item.nazwa_modelu,
      nazwa_modelu_nowa:       "",
      numer_seryjny:           item.numer_seryjny,
      cena_wypozyczenia_dzien: item.cena_wypozyczenia_dzien,
      status:                  item.status,
    });
    setEditing(item.id_egzemplarza);
    setShowForm(true);
    setSaveError("");
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Usuń sprzęt: ${name}?`)) return;
    try {
      await axios.delete(`/admin/equipment/${id}`);
      setEquipment(prev => prev.filter(e => e.id_egzemplarza !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Błąd usuwania.");
    }
  };

  const handleStatusQuick = async (id, status) => {
    try {
      await axios.patch(`/admin/equipment/${id}`, { status });
      setEquipment(prev => prev.map(e => e.id_egzemplarza === id ? { ...e, status } : e));
    } catch {}
  };

  return (
    <div>
      <div style={tab.toolbar}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative" }}>
            <svg style={tab.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={tab.searchInput} placeholder="Szukaj sprzętu…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={tab.filterSelect} value={statusFilter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
            <option value="">Wszystkie statusy</option>
            <option value="Dostępny">Dostępny</option>
            <option value="Wypożyczony">Wypożyczony</option>
            <option value="Serwis">Serwis</option>
          </select>
        </div>
        <span style={tab.count}>{meta.total} egzemplarzy</span>
        <button style={tab.addBtn} onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); setSaveError(""); }}>
          + Dodaj sprzęt
        </button>
      </div>

      {/* Formularz dodawania/edycji z inteligentnymi selectami */}
      {showForm && (
        <div style={tab.formPanel}>
          <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1.25rem" }}>
            {editingId ? "Edytuj egzemplarz" : "Dodaj nowy sprzęt"}
          </h4>

          {saveError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "0.75rem 1rem", color: "#dc2626", fontSize: "0.85rem", marginBottom: "1rem" }}>
              ⚠️ {saveError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>

            {/* Marka — select z istniejących lub wpisz nową */}
            <div>
              <label style={tab.formLabel}>Marka *</label>
              <select style={tab.formInput} value={form.marka} onChange={e => setForm(p => ({ ...p, marka: e.target.value, nazwa_modelu: "" }))}>
                <option value="">— wybierz markę —</option>
                {marki.map(m => <option key={m} value={m}>{m}</option>)}
                <option value="__nowa__">➕ Wpisz nową markę…</option>
              </select>
              {form.marka === "__nowa__" && (
                <input style={{ ...tab.formInput, marginTop: "0.4rem" }} placeholder="Nazwa nowej marki"
                  value={form.marka_nowa} onChange={e => setForm(p => ({ ...p, marka_nowa: e.target.value }))} />
              )}
            </div>

            {/* Model — filtrowany po wybranej marce lub wpisz nowy */}
            <div>
              <label style={tab.formLabel}>Model *</label>
              <select style={tab.formInput} value={form.nazwa_modelu} onChange={e => setForm(p => ({ ...p, nazwa_modelu: e.target.value }))}>
                <option value="">— wybierz model —</option>
                {modeleDlaMarki.map(m => <option key={m.id_modelu} value={m.nazwa_modelu}>{m.nazwa_modelu}</option>)}
                <option value="__nowy__">➕ Wpisz nowy model…</option>
              </select>
              {form.nazwa_modelu === "__nowy__" && (
                <input style={{ ...tab.formInput, marginTop: "0.4rem" }} placeholder="Nazwa nowego modelu"
                  value={form.nazwa_modelu_nowa} onChange={e => setForm(p => ({ ...p, nazwa_modelu_nowa: e.target.value }))} />
              )}
            </div>

            {/* Numer seryjny */}
            <div>
              <label style={tab.formLabel}>Nr seryjny *</label>
              <input type="text" style={tab.formInput} placeholder="np. SN-DELL-025"
                value={form.numer_seryjny} onChange={e => setForm(p => ({ ...p, numer_seryjny: e.target.value }))} />
            </div>

            {/* Cena dzienna */}
            <div>
              <label style={tab.formLabel}>Cena / dzień (zł) *</label>
              <input type="number" min="0.01" step="0.01" style={tab.formInput} placeholder="np. 85.00"
                value={form.cena_wypozyczenia_dzien} onChange={e => setForm(p => ({ ...p, cena_wypozyczenia_dzien: e.target.value }))} />
            </div>

            {/* Status — tylko Dostępny lub Serwis przy tworzeniu */}
            <div>
              <label style={tab.formLabel}>Status</label>
              <select style={tab.formInput} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="Dostępny">Dostępny</option>
                <option value="Serwis">Serwis</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button style={tab.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? "Zapisywanie…" : editingId ? "Zapisz zmiany" : "Dodaj sprzęt"}
            </button>
            <button style={tab.cancelBtn} onClick={() => { setShowForm(false); setEditing(null); setSaveError(""); }}>
              Anuluj
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={tab.table}>
          <thead>
            <tr style={tab.thead}>
              {["ID", "Marka / Model", "Nr seryjny", "Cena/dzień", "Status", "Akcje"].map(h => (
                <th key={h} style={tab.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton rows={8} cols={6} /> : equipment.map(e => (
              <tr key={e.id_egzemplarza} style={tab.tr}>
                <td style={{ ...tab.td, fontFamily: "monospace", color: "#94a3b8", fontSize: "0.8rem" }}>#{e.id_egzemplarza}</td>
                <td style={tab.td}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>{e.marka}</div>
                  <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{e.nazwa_modelu}</div>
                </td>
                <td style={tab.td}><code style={{ fontSize: "0.8rem", color: "#64748b" }}>{e.numer_seryjny}</code></td>
                <td style={{ ...tab.td, fontWeight: 700, color: "#2563eb" }}>{parseFloat(e.cena_wypozyczenia_dzien).toFixed(2)} zł</td>
                <td style={tab.td}>
                  <select
                    value={e.status}
                    onChange={ev => handleStatusQuick(e.id_egzemplarza, ev.target.value)}
                    style={{ ...tab.roleSelect, color: e.status === "Dostępny" ? "#16a34a" : e.status === "Serwis" ? "#ca8a04" : "#2563eb" }}
                    disabled={e.status === "Wypożyczony"}
                  >
                    <option value="Dostępny">Dostępny</option>
                    <option value="Wypożyczony">Wypożyczony</option>
                    <option value="Serwis">Serwis</option>
                  </select>
                </td>
                <td style={tab.td}>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button style={tab.editBtn} onClick={() => handleEdit(e)} title="Edytuj">✏️</button>
                    <button style={tab.deleteBtn} onClick={() => handleDelete(e.id_egzemplarza, `${e.marka} ${e.nazwa_modelu}`)} title="Usuń">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} lastPage={meta.last_page} onPageChange={setPage} />
    </div>
  );
}

// ─── Użytkownicy ──────────────────────────────────────────────────────────
function TabUsers() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [meta, setMeta]     = useState({ last_page: 1, total: 0 });
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/admin/users?page=${p}&perPage=15${search ? `&search=${search}` : ""}`);
      setUsers(data.data ?? data);
      setMeta({ last_page: data.last_page ?? 1, total: data.total ?? 0 });
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(page); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.patch(`/admin/users/${id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.message || "Błąd zmiany roli.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Czy na pewno chcesz usunąć konto: ${name}?`)) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Błąd usuwania.");
    }
  };

  return (
    <div>
      <div style={tab.toolbar}>
        <div style={{ position: "relative" }}>
          <svg style={tab.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={tab.searchInput} placeholder="Szukaj użytkownika…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={tab.count}>{meta.total} użytkowników</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={tab.table}>
          <thead>
            <tr style={tab.thead}>
              {["Użytkownik", "E-mail", "Telefon", "Rola", "Wypożyczenia", "Data rej.", "Akcje"].map(h => (
                <th key={h} style={tab.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton rows={8} cols={7} /> : users.map(u => (
              <tr key={u.id} style={tab.tr}>
                <td style={tab.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={tab.avatar}>{(u.firstName || "?")[0].toUpperCase()}</div>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{u.firstName} {u.lastName}</div>
                  </div>
                </td>
                <td style={tab.td}><span style={{ color: "#64748b", fontSize: "0.85rem" }}>{u.email}</span></td>
                <td style={tab.td}><span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>{u.phone || "—"}</span></td>
                <td style={tab.td}>
                  <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{ ...tab.roleSelect, color: u.role === "admin" ? "#9333ea" : "#16a34a" }}>
                    <option value="klient">klient</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td style={{ ...tab.td, textAlign: "center" }}>
                  <span style={{ fontWeight: 700, color: "#2563eb" }}>{u.rentalsCount ?? 0}</span>
                </td>
                <td style={tab.td}><span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString("pl-PL") : "—"}</span></td>
                <td style={tab.td}>
                  <button style={tab.deleteBtn} onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)} title="Usuń konto">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} lastPage={meta.last_page} onPageChange={setPage} />
    </div>
  );
}

// ─── Wypożyczenia ─────────────────────────────────────────────────────────
function TabRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({ last_page: 1, total: 0 });

  useEffect(() => {
    setLoading(true);
    axios.get(`/admin/rentals?page=${page}`)
      .then(({ data }) => {
        setRentals(data.data ?? data);
        setMeta({ last_page: data.last_page ?? 1, total: data.total ?? 0 });
      })
      .catch(() => setRentals([]))
      .finally(() => setLoading(false));
  }, [page]);

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`/admin/rentals/${id}`, { status });
      setRentals(prev => prev.map(r => r.id_wypozyczenia === id ? { ...r, status_transakcji: status } : r));
    } catch (err) {
      alert(err.response?.data?.message || "Błąd.");
    }
  };

  return (
    <div>
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{meta.total} wypożyczeń</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={tab.table}>
          <thead>
            <tr style={tab.thead}>
              {["ID", "Klient", "Sprzęt", "Data wydania", "Planowany zwrot", "Kwota", "Status", "Akcje"].map(h => (
                <th key={h} style={tab.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton rows={8} cols={8} /> : rentals.map(r => (
              <tr key={r.id_wypozyczenia} style={tab.tr}>
                <td style={{ ...tab.td, fontFamily: "monospace", color: "#94a3b8", fontSize: "0.8rem" }}>#{r.id_wypozyczenia}</td>
                <td style={tab.td}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>{r.clientFirstName} {r.clientLastName}</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{r.clientEmail}</div>
                </td>
                <td style={{ ...tab.td, maxWidth: 180 }}><span style={{ fontSize: "0.85rem", color: "#374151" }}>{r.equipmentName || "—"}</span></td>
                <td style={{ ...tab.td, fontSize: "0.82rem", color: "#64748b" }}>{r.data_wydania ? new Date(r.data_wydania).toLocaleDateString("pl-PL") : "—"}</td>
                <td style={{ ...tab.td, fontSize: "0.82rem", color: "#64748b" }}>{r.planowana_data_zwrotu ? new Date(r.planowana_data_zwrotu).toLocaleDateString("pl-PL") : "—"}</td>
                <td style={{ ...tab.td, fontWeight: 700, color: "#2563eb" }}>{r.koszt_pozycji ? `${parseFloat(r.koszt_pozycji).toFixed(2)} zł` : "—"}</td>
                <td style={tab.td}><StatusBadge status={r.status_transakcji} /></td>
                <td style={tab.td}>
                  {r.status_transakcji === "Trwa" && (
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button style={tab.editBtn} onClick={() => handleStatusChange(r.id_wypozyczenia, "Zakończony")} title="Zakończ">✅</button>
                      <button style={tab.deleteBtn} onClick={() => handleStatusChange(r.id_wypozyczenia, "Anulowany")} title="Anuluj">❌</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} lastPage={meta.last_page} onPageChange={setPage} />
    </div>
  );
}

// ─── Serwis sprzętu ───────────────────────────────────────────────────────
function TabSerwis() {
  const [serwis, setSerwis]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [sprzetList, setSprzetList] = useState([]);

  // Stan formularza zgłoszenia serwisowego
  const emptyForm = { id_egzemplarza: "", opis_sytuacji: "", koszt_naprawy: "" };
  const [form, setForm] = useState(emptyForm);

  const fetchSerwis = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/admin/serwis");
      setSerwis(data);
    } catch {
      setSerwis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobierz dostępny sprzęt do zgłoszenia (Dostępny lub już w Serwis)
  useEffect(() => {
    fetchSerwis();
    axios.get("/admin/equipment?perPage=200")
      .then(({ data }) => setSprzetList(data.data ?? data))
      .catch(() => {});
  }, []);

  // Zgłoszenie sprzętu do serwisu — blokuje go dla klientów
  const handleZglos = async () => {
    if (!form.id_egzemplarza || !form.opis_sytuacji) {
      alert("Wybierz sprzęt i podaj opis usterki.");
      return;
    }
    setSaving(true);
    try {
      await axios.post("/admin/serwis/zglos", form);
      setShowForm(false);
      setForm(emptyForm);
      await fetchSerwis();
    } catch (err) {
      alert(err.response?.data?.message || "Błąd zgłoszenia.");
    } finally {
      setSaving(false);
    }
  };

  // Przywrócenie sprzętu — zmienia status na Dostępny
  const handlePrzywroc = async (idSerwisu) => {
    if (!confirm("Czy sprzęt po naprawie jest gotowy do wypożyczenia?")) return;
    try {
      await axios.patch(`/admin/serwis/${idSerwisu}/przywroc`);
      await fetchSerwis();
    } catch (err) {
      alert(err.response?.data?.message || "Błąd.");
    }
  };

  return (
    <div>
      <div style={tab.toolbar}>
        <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
          🔧 Sprzęt w serwisie: {serwis.filter(s => s.status === "Serwis").length}
        </span>
        <button style={tab.addBtn} onClick={() => setShowForm(v => !v)}>
          + Zgłoś do serwisu
        </button>
      </div>

      {showForm && (
        <div style={tab.formPanel}>
          <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1.25rem" }}>
            Nowe zgłoszenie serwisowe
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={tab.formLabel}>Egzemplarz *</label>
              <select style={tab.formInput} value={form.id_egzemplarza} onChange={e => setForm(p => ({ ...p, id_egzemplarza: e.target.value }))}>
                <option value="">— wybierz sprzęt —</option>
                {sprzetList.filter(e => e.status !== "Wypożyczony").map(e => (
                  <option key={e.id_egzemplarza} value={e.id_egzemplarza}>
                    #{e.id_egzemplarza} {e.marka} {e.nazwa_modelu} ({e.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={tab.formLabel}>Szacowany koszt naprawy (zł)</label>
              <input type="number" min="0" step="0.01" style={tab.formInput} placeholder="opcjonalnie"
                value={form.koszt_naprawy} onChange={e => setForm(p => ({ ...p, koszt_naprawy: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={tab.formLabel}>Opis usterki *</label>
              <textarea style={{ ...tab.formInput, minHeight: 80, resize: "vertical" }} placeholder="Opisz usterkę i jej objawy…"
                value={form.opis_sytuacji} onChange={e => setForm(p => ({ ...p, opis_sytuacji: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button style={tab.saveBtn} onClick={handleZglos} disabled={saving}>{saving ? "Zapisywanie…" : "Zgłoś do serwisu"}</button>
            <button style={tab.cancelBtn} onClick={() => setShowForm(false)}>Anuluj</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={tab.table}>
          <thead>
            <tr style={tab.thead}>
              {["ID", "Sprzęt", "Nr seryjny", "Opis usterki", "Data zgłoszenia", "Koszt naprawy", "Status", "Akcje"].map(h => (
                <th key={h} style={tab.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton rows={5} cols={8} /> : serwis.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Brak zgłoszeń serwisowych</td></tr>
            ) : serwis.map(s => (
              <tr key={s.id_serwisu} style={tab.tr}>
                <td style={{ ...tab.td, fontFamily: "monospace", color: "#94a3b8", fontSize: "0.8rem" }}>#{s.id_serwisu}</td>
                <td style={tab.td}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>{s.nazwa_sprzetu}</div>
                </td>
                <td style={tab.td}><code style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.numer_seryjny}</code></td>
                <td style={{ ...tab.td, maxWidth: 240, fontSize: "0.82rem", color: "#374151" }}>{s.opis_sytuacji}</td>
                <td style={{ ...tab.td, fontSize: "0.82rem", color: "#64748b" }}>{new Date(s.data_zgloszenia).toLocaleDateString("pl-PL")}</td>
                <td style={{ ...tab.td, fontWeight: 700, color: s.koszt_naprawy ? "#ca8a04" : "#94a3b8" }}>
                  {s.koszt_naprawy ? `${parseFloat(s.koszt_naprawy).toFixed(2)} zł` : "—"}
                </td>
                <td style={tab.td}><StatusBadge status={s.status} /></td>
                <td style={tab.td}>
                  {s.status === "Serwis" && (
                    <button style={{ ...tab.editBtn, background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
                      onClick={() => handlePrzywroc(s.id_serwisu)}>
                      ✅ Przywróć
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── System kar ───────────────────────────────────────────────────────────
function TabKary() {
  const [kary, setKary]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [meta, setMeta]         = useState({ last_page: 1, total: 0 });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [rodzaje, setRodzaje]   = useState([]);
  const [wypozyczenia, setWyp]  = useState([]);

  const emptyForm = { id_wypozyczenia: "", id_rodzaju: "", ostateczna_kwota: "", opis: "" };
  const [form, setForm] = useState(emptyForm);

  const fetchKary = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/admin/kary?page=${p}`);
      setKary(data.data ?? data);
      setMeta({ last_page: data.last_page ?? 1, total: data.total ?? 0 });
    } catch { setKary([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchKary(page);
    // Pobierz rodzaje kar i aktywne wypożyczenia do formularza
    axios.get("/admin/kary/rodzaje").then(r => setRodzaje(r.data)).catch(() => {});
    axios.get("/admin/rentals?page=1&perPage=100").then(r => setWyp(r.data.data ?? [])).catch(() => {});
  }, [page]);

  // Zmiana rodzaju kary automatycznie ustawia domyślną kwotę
  const handleRodzajChange = (idRodzaju) => {
    const rodzaj = rodzaje.find(r => r.id_rodzaju == idRodzaju);
    setForm(p => ({ ...p, id_rodzaju: idRodzaju, ostateczna_kwota: rodzaj?.domyslna_kwota || "" }));
  };

  const handleNalicz = async () => {
    if (!form.id_wypozyczenia || !form.id_rodzaju || !form.ostateczna_kwota) {
      alert("Wybierz wypożyczenie, rodzaj kary i podaj kwotę.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.post("/admin/kary", form);
      alert(data.email_wyslany
        ? "Kara naliczona. Powiadomienie e-mail wysłane do klienta."
        : "Kara naliczona. Brak możliwości wysyłki e-maila (brak adresu klienta).");
      setShowForm(false);
      setForm(emptyForm);
      await fetchKary(1);
    } catch (err) {
      alert(err.response?.data?.message || "Błąd zapisu.");
    } finally {
      setSaving(false);
    }
  };

  const handleOplacona = async (id) => {
    try {
      await axios.patch(`/admin/kary/${id}/oplacona`);
      setKary(prev => prev.map(k => k.id_kary === id ? { ...k, czy_oplacona: 1 } : k));
    } catch {}
  };

  return (
    <div>
      <div style={tab.toolbar}>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Nieopłacone: <strong style={{ color: "#dc2626" }}>{kary.filter(k => !k.czy_oplacona).length}</strong>
        </span>
        <button style={tab.addBtn} onClick={() => setShowForm(v => !v)}>+ Nalicz karę</button>
      </div>

      {showForm && (
        <div style={tab.formPanel}>
          <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1.25rem" }}>
            Nowa kara finansowa
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={tab.formLabel}>Wypożyczenie *</label>
              <select style={tab.formInput} value={form.id_wypozyczenia} onChange={e => setForm(p => ({ ...p, id_wypozyczenia: e.target.value }))}>
                <option value="">— wybierz wypożyczenie —</option>
                {wypozyczenia.map(w => (
                  <option key={w.id_wypozyczenia} value={w.id_wypozyczenia}>
                    #{w.id_wypozyczenia} — {w.clientFirstName} {w.clientLastName} ({w.equipmentName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={tab.formLabel}>Rodzaj przewinienia *</label>
              <select style={tab.formInput} value={form.id_rodzaju} onChange={e => handleRodzajChange(e.target.value)}>
                <option value="">— wybierz rodzaj kary —</option>
                {rodzaje.map(r => (
                  <option key={r.id_rodzaju} value={r.id_rodzaju}>{r.nazwa_przewinienia} (domyślnie: {r.domyslna_kwota} zł)</option>
                ))}
              </select>
            </div>
            <div>
              <label style={tab.formLabel}>Kwota kary (zł) *</label>
              <input type="number" min="0.01" step="0.01" style={tab.formInput}
                value={form.ostateczna_kwota} onChange={e => setForm(p => ({ ...p, ostateczna_kwota: e.target.value }))} />
            </div>
            <div>
              <label style={tab.formLabel}>Uwagi (opcjonalne)</label>
              <input type="text" style={tab.formInput} placeholder="np. zarysowanie ekranu"
                value={form.opis} onChange={e => setForm(p => ({ ...p, opis: e.target.value }))} />
            </div>
          </div>
          <div style={{ background: "#eff6ff", borderRadius: 8, padding: "0.65rem 1rem", marginTop: "0.75rem", fontSize: "0.8rem", color: "#1d4ed8" }}>
            📧 Po naliczeniu kary system automatycznie wyśle e-mail do klienta z powiadomieniem.
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button style={tab.saveBtn} onClick={handleNalicz} disabled={saving}>{saving ? "Zapisywanie…" : "Nalicz karę"}</button>
            <button style={tab.cancelBtn} onClick={() => setShowForm(false)}>Anuluj</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={tab.table}>
          <thead>
            <tr style={tab.thead}>
              {["ID", "Klient", "Sprzęt", "Przewinienie", "Kwota", "Uwagi", "Data", "Opłacona", "Akcje"].map(h => (
                <th key={h} style={tab.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton rows={6} cols={9} /> : kary.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Brak naliczonych kar</td></tr>
            ) : kary.map(k => (
              <tr key={k.id_kary} style={tab.tr}>
                <td style={{ ...tab.td, fontFamily: "monospace", color: "#94a3b8", fontSize: "0.8rem" }}>#{k.id_kary}</td>
                <td style={tab.td}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{k.klient_nazwa}</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{k.klient_email}</div>
                </td>
                <td style={{ ...tab.td, fontSize: "0.82rem", color: "#374151" }}>{k.sprzet_nazwa || "—"}</td>
                <td style={{ ...tab.td, fontSize: "0.82rem" }}>{k.nazwa_przewinienia}</td>
                <td style={{ ...tab.td, fontWeight: 800, color: "#dc2626" }}>{parseFloat(k.ostateczna_kwota).toFixed(2)} zł</td>
                <td style={{ ...tab.td, fontSize: "0.8rem", color: "#64748b", maxWidth: 180 }}>{k.opis || "—"}</td>
                <td style={{ ...tab.td, fontSize: "0.8rem", color: "#94a3b8" }}>{k.created_at ? new Date(k.created_at).toLocaleDateString("pl-PL") : "—"}</td>
                <td style={tab.td}>
                  {k.czy_oplacona
                    ? <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "0.8rem" }}>✅ Tak</span>
                    : <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.8rem" }}>❌ Nie</span>}
                </td>
                <td style={tab.td}>
                  {!k.czy_oplacona && (
                    <button style={{ ...tab.editBtn, background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: "0.78rem", padding: "0.35rem 0.7rem" }}
                      onClick={() => handleOplacona(k.id_kary)}>
                      Oznacz opłaconą
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} lastPage={meta.last_page} onPageChange={setPage} />
    </div>
  );
}

// ─── Konfiguracja zakładek ────────────────────────────────────────────────
const TABS_CONFIG = [
  { id: "dashboard", label: "Dashboard",    icon: "📊", sub: "Przegląd kluczowych wskaźników" },
  { id: "equipment", label: "Sprzęt",       icon: "🖥️", sub: "Zarządzaj egzemplarzami" },
  { id: "serwis",    label: "Serwis",       icon: "🔧", sub: "Sprzęt w naprawie" },
  { id: "users",     label: "Użytkownicy",  icon: "👥", sub: "Lista klientów" },
  { id: "rentals",   label: "Wypożyczenia", icon: "📦", sub: "Aktywne i archiwalne" },
  { id: "kary",      label: "Kary",         icon: "⚠️", sub: "System kar finansowych" },
];

export default function AdminPanel() {
  const { uzytkownik, ladowanie, czyAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (ladowanie) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      Weryfikacja uprawnień…
    </div>
  );
  if (!czyAdmin) return <Navigate to="/" replace />;

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <TabDashboard />;
      case "equipment": return <TabEquipment />;
      case "serwis":    return <TabSerwis />;
      case "users":     return <TabUsers />;
      case "rentals":   return <TabRentals />;
      case "kary":      return <TabKary />;
      default:          return null;
    }
  };

  const activeConfig = TABS_CONFIG.find(t => t.id === activeTab);

  return (
    <div style={ap.root}>
      <style>{ADMIN_CSS}</style>

      {/* Boczny sidebar z nawigacją */}
      <aside style={ap.sidebar}>
        <div style={ap.sidebarTop}>
          <div style={ap.sidebarBrand}>
            <span style={{ fontSize: "1.25rem" }}>⚡</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>Kiosk IT</span>
          </div>
          <div style={ap.adminBadge}>Panel Administratora</div>
        </div>

        <nav style={{ padding: "0.5rem" }}>
          {TABS_CONFIG.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              ...ap.navItem,
              background:  activeTab === t.id ? "rgba(255,255,255,0.12)" : "transparent",
              color:       activeTab === t.id ? "#fff" : "rgba(255,255,255,0.65)",
              borderLeft:  activeTab === t.id ? "3px solid #60a5fa" : "3px solid transparent",
            }}>
              <span style={{ fontSize: "1.1rem", width: 24 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div style={ap.sidebarFooter}>
          <div style={ap.adminAvatar}>{(uzytkownik?.firstName || "A")[0]}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {uzytkownik?.firstName} {uzytkownik?.lastName}
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)" }}>Administrator</div>
          </div>
          <Link to="/" style={{ marginLeft: "auto", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textDecoration: "none" }} title="Wróć do katalogu">← Sklep</Link>
        </div>
      </aside>

      <main style={ap.main}>
        <header style={ap.header}>
          <div>
            <h1 style={ap.pageTitle}>{activeConfig?.icon} {activeConfig?.label}</h1>
            <p style={ap.pageSub}>{activeConfig?.sub}</p>
          </div>
          <div style={ap.headerDate}>{new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}</div>
        </header>

        <div style={ap.content}>
          <div style={ap.panel}>{renderTab()}</div>
        </div>
      </main>
    </div>
  );
}

// ─── Style ────────────────────────────────────────────────────────────────
const ap = {
  root:         { display: "flex", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f1f5f9" },
  sidebar:      { width: 240, background: "linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 },
  sidebarTop:   { padding: "1.5rem 1rem 1rem" },
  sidebarBrand: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" },
  adminBadge:   { background: "rgba(96,165,250,0.15)", color: "#60a5fa", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.25rem 0.6rem", borderRadius: "4px", display: "inline-block" },
  navItem:      { width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 0.85rem", border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.875rem", fontWeight: 600, transition: "all 0.15s", textAlign: "left", marginBottom: "0.15rem" },
  sidebarFooter:{ marginTop: "auto", padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.6rem" },
  adminAvatar:  { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, color: "#fff", flexShrink: 0 },
  main:         { marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" },
  header:       { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 },
  pageTitle:    { fontFamily: "'Syne', sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.15rem" },
  pageSub:      { fontSize: "0.82rem", color: "#94a3b8", margin: 0 },
  headerDate:   { fontSize: "0.82rem", color: "#64748b", fontWeight: 500 },
  content:      { padding: "1.5rem 2rem", flex: 1 },
  panel:        { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden" },
};

const tab = {
  statsGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", padding: "1.5rem" },
  section:      { padding: "0 1.5rem 1.5rem" },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1rem" },
  toolbar:      { padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" },
  searchInput:  { padding: "0.55rem 0.75rem 0.55rem 2.25rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", outline: "none", width: 220, color: "#374151" },
  searchIcon:   { position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  filterSelect: { padding: "0.55rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", outline: "none", color: "#374151", cursor: "pointer" },
  count:        { marginLeft: "auto", fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" },
  addBtn:       { padding: "0.6rem 1.25rem", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", border: "none", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" },
  table:        { width: "100%", borderCollapse: "collapse" },
  thead:        { background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th:           { padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" },
  tr:           { borderBottom: "1px solid #f8fafc", transition: "background 0.15s" },
  td:           { padding: "0.875rem 1.25rem", verticalAlign: "middle" },
  avatar:       { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, color: "#fff", flexShrink: 0 },
  roleSelect:   { border: "none", background: "transparent", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", outline: "none" },
  editBtn:      { padding: "0.3rem 0.5rem", background: "#eff6ff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" },
  deleteBtn:    { padding: "0.3rem 0.5rem", background: "#fef2f2", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" },
  formPanel:    { padding: "1.25rem 1.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  formLabel:    { display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.3rem" },
  formInput:    { width: "100%", padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.875rem", outline: "none", color: "#0f172a", boxSizing: "border-box" },
  saveBtn:      { padding: "0.65rem 1.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" },
  cancelBtn:    { padding: "0.65rem 1.25rem", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" },
};

const sc = {
  card:      { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", transition: "box-shadow 0.2s" },
  iconWrap:  { width: 44, height: 44, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: "'Syne', sans-serif", fontSize: "1.8rem", fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: "0.8rem", color: "#64748b", marginTop: "0.3rem", fontWeight: 500 },
  statSub:   { fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.15rem" },
};

const ADMIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes adminShimmer { 0%,100% { background-color: #f1f5f9; } 50% { background-color: #e2e8f0; } }
  tbody tr:hover { background: #f8fafc !important; }
  select:focus, input:focus, textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
`;