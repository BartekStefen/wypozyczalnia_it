<?php
require_once 'db.php';

// Zabezpieczenie: Auto-tworzenie tabeli pracownicy
$conn->query("CREATE TABLE IF NOT EXISTS pracownicy (
    id_pracownika INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    haslo VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");

$sprawdz = $conn->query("SELECT * FROM pracownicy WHERE login='admin'");
if($sprawdz->num_rows == 0) {
    $zahaszowane_haslo = password_hash('admin123', PASSWORD_DEFAULT);
    $conn->query("INSERT INTO pracownicy (login, haslo) VALUES ('admin', '$zahaszowane_haslo')");
}

if (isset($_GET['action']) && $_GET['action'] == 'wyloguj') {
    unset($_SESSION['zalogowany']); header("Location: pracownik.php"); exit;
}

// Bezpieczne logowanie z bazy
$blad_logowania = "";
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['logowanie'])) {
    $login = $conn->real_escape_string($_POST['login']);
    $haslo_wpisane = $_POST['haslo'];
    
    $wynik = $conn->query("SELECT haslo FROM pracownicy WHERE login='$login'");
    if ($wynik->num_rows > 0) {
        $wiersz = $wynik->fetch_assoc();
        if (password_verify($haslo_wpisane, $wiersz['haslo'])) {
            $_SESSION['zalogowany'] = true;
        } else { $blad_logowania = "<div class='alert alert-danger text-center'>❌ Błędne hasło!</div>"; }
    } else { $blad_logowania = "<div class='alert alert-danger text-center'>❌ Brak użytkownika w bazie!</div>"; }
}

if (!isset($_SESSION['zalogowany']) || $_SESSION['zalogowany'] !== true) {
?>
    <!DOCTYPE html>
    <html lang="pl">
    <head><meta charset="UTF-8"><title>Logowanie IT</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
    <body class="bg-dark d-flex align-items-center justify-content-center" style="height: 100vh;">
        <div class="card shadow-lg p-4" style="width: 350px;">
            <h3 class="text-center mb-4 fw-bold text-primary">💻 Logowanie Bezpieczne</h3>
            <?php echo $blad_logowania; ?>
            <form method="POST">
                <input type="hidden" name="logowanie" value="1">
                <div class="mb-3"><input type="text" name="login" class="form-control" required placeholder="Login (admin)"></div>
                <div class="mb-4"><input type="password" name="haslo" class="form-control" required placeholder="Hasło (admin123)"></div>
                <button type="submit" class="btn btn-primary w-100 fw-bold">Zaloguj</button>
            </form>
        </div>
    </body>
    </html>
<?php exit; }

$wiadomosc = "";

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['naloz_kare'])) {
    $id_szczegolow = (int)$_POST['id_szczegolow'];
    $kwota = (float)$_POST['kwota_kary'];
    $powod = $conn->real_escape_string($_POST['powod_kary']);
    
    $conn->query("INSERT IGNORE INTO rodzaje_kar (id_rodzaju, nazwa_przewinienia) VALUES (1, 'Uszkodzenie sprzętu / Opóźnienie')");
    $conn->query("INSERT INTO naliczone_kary (id_szczegolow, id_rodzaju, ostateczna_kwota, czy_oplacona) VALUES ($id_szczegolow, 1, $kwota, 0)");
    $conn->query("INSERT INTO zgloszenia_serwisowe (opis_sytuacji) VALUES ('$powod')");
    $id_serwisu = $conn->insert_id;
    
    $info = $conn->query("SELECT id_egzemplarza, id_wypozyczenia FROM szczegoly_wypozyczenia WHERE id_szczegolow = $id_szczegolow")->fetch_assoc();
    $conn->query("INSERT INTO serwis_egzemplarze (id_serwisu, id_egzemplarza, koszt_naprawy) VALUES ($id_serwisu, {$info['id_egzemplarza']}, $kwota)");
    $conn->query("UPDATE egzemplarze SET status = 'W serwisie' WHERE id_egzemplarza = {$info['id_egzemplarza']}");
    $conn->query("UPDATE wypozyczenia SET status_transakcji = 'Zakończone (Kara)' WHERE id_wypozyczenia = {$info['id_wypozyczenia']}");
    
    $wiadomosc = "<div class='alert alert-danger shadow-sm border-0 fw-bold'>🚨 Wystawiono karę $kwota zł. Sprzęt wysłano do serwisu. (Wysłano e-mail do klienta)</div>";
}

if (isset($_GET['action']) && $_GET['action'] == 'zmien') {
    $id = (int)$_GET['id'];
    $nowy_status = ($_GET['status'] == 'Dostępny') ? 'W serwisie' : 'Dostępny';
    $conn->query("UPDATE egzemplarze SET status = '$nowy_status' WHERE id_egzemplarza = $id");
}

$sprzet = $conn->query("SELECT e.id_egzemplarza, m.marka, m.nazwa_modelu, e.numer_seryjny, e.status FROM egzemplarze e JOIN modele_sprzetu m ON e.id_modelu = m.id_modelu");

// POTĘŻNE ZAPYTANIE: Wypożyczenia + Płatności + Scoring (Kary klienta)
$zapytanie_aktywne = "
    SELECT w.id_wypozyczenia, k.imie, k.nazwisko, w.planowana_data_zwrotu, m.nazwa_modelu, sw.id_szczegolow, p.metoda, p.kwota,
           (SELECT COUNT(*) FROM naliczone_kary nk JOIN szczegoly_wypozyczenia sw2 ON nk.id_szczegolow = sw2.id_szczegolow JOIN wypozyczenia w2 ON sw2.id_wypozyczenia = w2.id_wypozyczenia WHERE w2.id_klienta = k.id_klienta) as historyczne_kary
    FROM wypozyczenia w 
    JOIN klienci k ON w.id_klienta = k.id_klienta 
    JOIN szczegoly_wypozyczenia sw ON w.id_wypozyczenia = sw.id_wypozyczenia 
    JOIN egzemplarze e ON sw.id_egzemplarza = e.id_egzemplarza 
    JOIN modele_sprzetu m ON e.id_modelu = m.id_modelu
    LEFT JOIN wypozyczenia_platnosci wp ON w.id_wypozyczenia = wp.id_wypozyczenia
    LEFT JOIN platnosci p ON wp.id_platnosci = p.id_platnosci
    WHERE w.status_transakcji = 'Trwa'
";
$aktywne = $conn->query($zapytanie_aktywne);

$stat_dostepne = $conn->query("SELECT COUNT(*) as c FROM egzemplarze WHERE status='Dostępny'")->fetch_assoc()['c'];
$stat_wypozyczone = $conn->query("SELECT COUNT(*) as c FROM egzemplarze WHERE status='Wypożyczony'")->fetch_assoc()['c'];
$stat_serwis = $conn->query("SELECT COUNT(*) as c FROM egzemplarze WHERE status='W serwisie'")->fetch_assoc()['c'];
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Panel Pracownika</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-custom fixed-top">
        <div class="container">
            <a class="navbar-brand" href="pracownik.php">💻 Panel Admina Enterprise</a>
            <ul class="navbar-nav ms-auto"><li class="nav-item"><a class="nav-link" href="index.php">Sklep</a></li><li class="nav-item"><a class="nav-link text-danger fw-bold" href="pracownik.php?action=wyloguj">Wyloguj</a></li></ul>
        </div>
    </nav>
    <div class="container-fluid mt-4 pt-5 mb-5 px-4">
        <h2 class="fw-bold mb-4">Dashboard Analityczny</h2>
        <?php echo $wiadomosc; ?>
        
        <div class="row mb-5">
            <div class="col-md-3">
                <div class="card shadow-sm border-0 h-100 p-3 text-center">
                    <h5 class="fw-bold text-muted">Stan Magazynu</h5>
                    <canvas id="magazynChart"></canvas>
                </div>
            </div>
            <div class="col-md-9 d-flex flex-column gap-3">
                <div class="card bg-success text-white shadow-sm border-0 p-4">
                    <h3>✅ <?php echo $stat_dostepne; ?> szt.</h3><p class="mb-0">Sprzętu gotowego do wynajmu</p>
                </div>
                <div class="card bg-primary text-white shadow-sm border-0 p-4">
                    <h3>🚀 <?php echo $stat_wypozyczone; ?> szt.</h3><p class="mb-0">Aktywnych urządzeń u klientów</p>
                </div>
                <div class="card bg-danger text-white shadow-sm border-0 p-4">
                    <h3>🔧 <?php echo $stat_serwis; ?> szt.</h3><p class="mb-0">Urządzeń w trakcie serwisu</p>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-5">
            <div class="col-md-8">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                        <span>📅 Aktywne Wypożyczenia z Bazy</span>
                        <span class="badge bg-light text-success">Live</span>
                    </div>
                    <div class="card-body p-0">
                        <table class="table align-middle table-hover m-0 text-center">
                            <thead class="table-light">
                                <tr>
                                    <th>Scoring</th>
                                    <th>Klient</th>
                                    <th>Sprzęt</th>
                                    <th>Płatność</th>
                                    <th>Do kiedy</th>
                                    <th>Akcja</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php 
                                if($aktywne->num_rows > 0) {
                                    while($rez = $aktywne->fetch_assoc()) {
                                        // Logika Scoringu
                                        $scoring = ($rez['historyczne_kary'] > 0) ? "<span class='badge bg-danger'>⚠️ Ryzyko (Kary: {$rez['historyczne_kary']})</span>" : "<span class='badge bg-warning text-dark'>⭐ Klient VIP</span>";
                                        
                                        // Dane o płatności
                                        $metoda = $rez['metoda'] ? $rez['metoda'] : "Brak danych";
                                        $kwota = $rez['kwota'] ? "{$rez['kwota']} zł" : "—";
                                        $ikona_platnosci = (strpos($metoda, 'BLIK') !== false) ? '📱' : '💳';
                                        
                                        echo "<tr>
                                                <td>$scoring</td>
                                                <td class='fw-bold'>{$rez['imie']} {$rez['nazwisko']}</td>
                                                <td>{$rez['nazwa_modelu']}</td>
                                                <td><span class='text-success fw-bold'>$kwota</span> <br><small class='text-muted'>$ikona_platnosci $metoda</small></td>
                                                <td>".date('Y-m-d', strtotime($rez['planowana_data_zwrotu']))."</td>
                                                <td><button class='btn btn-sm btn-outline-primary' onclick='alert(\"Symulacja: Wysłano przypomnienie SMS na numer klienta.\")'>Powiadom 📧</button></td>
                                              </tr>";
                                    }
                                } else { echo "<tr><td colspan='6' class='text-center text-muted py-4'>Brak aktywnych wypożyczeń.</td></tr>"; }
                                ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card shadow-sm border-0 h-100 border-danger border-top border-4">
                    <div class="card-header bg-white text-danger fw-bold fs-5 border-0 pt-4">🚨 Nakładanie Kar na Bazę</div>
                    <div class="card-body">
                        <form method="POST" class="bg-light p-3 rounded">
                            <input type="hidden" name="naloz_kare" value="1">
                            <div class="mb-3">
                                <label class="form-label text-muted small">Wybierz sprzęt klienta</label>
                                <select name="id_szczegolow" class="form-select" required>
                                    <?php 
                                    $aktywne->data_seek(0); 
                                    while($rez = $aktywne->fetch_assoc()) {
                                        echo "<option value='{$rez['id_szczegolow']}'>{$rez['imie']} {$rez['nazwisko']} - {$rez['nazwa_modelu']}</option>";
                                    }
                                    ?>
                                </select>
                            </div>
                            <div class="mb-3"><label class="form-label text-muted small">Opis usterki (protokół)</label><textarea name="powod_kary" class="form-control" rows="2" required></textarea></div>
                            <div class="mb-3"><label class="form-label text-muted small">Kwota kary (zł)</label><input type="number" step="0.01" name="kwota_kary" class="form-control" required></div>
                            <button type="submit" class="btn btn-danger w-100 fw-bold shadow-sm">Zaksięguj Karę i Serwis</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card shadow-sm border-0 mt-5">
            <div class="card-header bg-dark text-white fw-bold">⚙️ Baza Magazynowa (z kodami QR)</div>
            <div class="card-body p-0">
                <table class="table table-striped align-middle mb-0 text-center">
                    <thead class="table-dark"><tr><th>QR Code</th><th>Model</th><th>S/N</th><th>Status</th><th>Akcja</th></tr></thead>
                    <tbody>
                        <?php while($row = $sprzet->fetch_assoc()) { 
                            $status_badge = ($row['status'] == 'Dostępny') ? "<span class='badge bg-success'>Dostępny</span>" : (($row['status'] == 'Wypożyczony') ? "<span class='badge bg-primary'>Wypożyczony</span>" : "<span class='badge bg-danger'>W serwisie</span>");
                            $przycisk = ($row['status'] == 'Dostępny') ? "<a href='pracownik.php?action=zmien&id={$row['id_egzemplarza']}&status=Dostępny' class='btn btn-sm btn-outline-warning fw-bold'>Do serwisu 🔧</a>" : (($row['status'] == 'Wypożyczony') ? "<button class='btn btn-sm btn-secondary fw-bold' disabled>U klienta 🔒</button>" : "<a href='pracownik.php?action=zmien&id={$row['id_egzemplarza']}&status=W serwisie' class='btn btn-sm btn-success fw-bold'>Przywróć ✅</a>");
                            
                            $qr_url = "https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=" . urlencode($row['numer_seryjny']);

                            echo "<tr>
                                    <td><img src='$qr_url' alt='QR' class='shadow-sm rounded'></td>
                                    <td class='fw-bold'>{$row['marka']} {$row['nazwa_modelu']}</td>
                                    <td class='text-muted'>{$row['numer_seryjny']}</td>
                                    <td>$status_badge</td>
                                    <td>$przycisk</td>
                                  </tr>";
                        } ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('magazynChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Dostępne', 'Wypożyczone', 'W serwisie'],
                datasets: [{
                    data: [<?php echo $stat_dostepne; ?>, <?php echo $stat_wypozyczone; ?>, <?php echo $stat_serwis; ?>],
                    backgroundColor: ['#198754', '#0d6efd', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '70%', plugins: { legend: { display: false } } }
        });
    </script>
</body>
</html>