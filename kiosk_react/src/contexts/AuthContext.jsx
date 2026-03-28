import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

// Globalny baseURL - wszystkie komponenty korzystają z tej konfiguracji
axios.defaults.baseURL = 'http://127.0.0.1:8000/api';

// Interceptor 401 - automatyczne wylogowanie przy wygaśnięciu tokenu
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
    return Promise.reject(err);
  }
);

export function AuthProvider({ children }) {
  const [uzytkownik, setUzytkownik] = useState(null);
  const [ladowanie, setLadowanie]   = useState(true);

  // Odczyt tokenu przy starcie - przywrócenie sesji
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/mnie')
        .then(r => setUzytkownik(r.data))
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLadowanie(false));
    } else {
      setLadowanie(false);
    }
  }, []);

  // Logowanie - zwraca dane użytkownika z API
  const zaloguj = useCallback(async (email, haslo) => {
    const { data } = await axios.post('/logowanie', { email, password: haslo });
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUzytkownik(data.uzytkownik);
    return data.uzytkownik;
  }, []);

  // Wylogowanie - usuwa token i czyści stan
  const wyloguj = useCallback(async () => {
    try { await axios.post('/wylogowanie'); } catch {}
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUzytkownik(null);
  }, []);

  // Rejestracja - wysyła dane i zapisuje token
  const zarejestruj = useCallback(async (dane) => {
    const { data } = await axios.post('/rejestracja', dane);
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUzytkownik(data.uzytkownik);
    return data.uzytkownik;
  }, []);

  const value = {
    uzytkownik,
    ladowanie,
    zaloguj,
    wyloguj,
    zarejestruj,

    // Flagi pomocnicze
    czyZalogowany: !!uzytkownik,
    czyAdmin:      uzytkownik?.role === 'admin' || uzytkownik?.rola === 'admin',

    // Aliasy angielskie dla komponentów wygenerowanych wcześniej
    user:          uzytkownik,
    isAuthenticated: !!uzytkownik,
    login:         zaloguj,
    logout:        wyloguj,
    register:      zarejestruj,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth musi być użyty wewnątrz <AuthProvider>');
  return ctx;
}