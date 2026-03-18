<?php
require_once 'db.php';
if (!isset($_GET['id'])) { header("Location: index.php"); exit; }

$id = (int)$_GET['id'];
$sql = "SELECT e.id_egzemplarza, m.marka, m.nazwa_modelu, e.status, e.cena_wypozyczenia_dzien, e.numer_seryjny 
        FROM egzemplarze e JOIN modele_sprzetu m ON e.id_modelu = m.id_modelu WHERE e.id_egzemplarza = $id";
$wynik = $conn->query($sql);

if ($wynik->num_rows == 0) die("Sprzęt nie istnieje.");
$produkt = $wynik->fetch_assoc();

$opis = "Ten sprzęt to absolutna nowość w naszej ofercie. Idealnie sprawdzi się zarówno do pracy, jak i zastosowań domowych.";
$zastosowanie = "Biuro, Praca zdalna, Rozrywka";
if (strpos(strtolower($produkt['nazwa_modelu']), 'dron') !== false || strpos(strtolower($produkt['marka']), 'dji') !== false) {
    $opis = "Wyposażony w zaawansowaną kamerę 4K i systemy stabilizacji lotu. Doskonały wybór do nagrywania materiałów wideo.";
    $zastosowanie = "Fotografia, Wideo marketing";
} elseif (strpos(strtolower($produkt['marka']), 'dell') !== false || strpos(strtolower($produkt['marka']), 'macbook') !== false) {
    $opis = "Potężny procesor i duża ilość RAM zamknięte w smukłej obudowie. Poradzi sobie z montażem wideo i programowaniem.";
    $zastosowanie = "Programowanie, Praca biurowa";
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title><?php echo $produkt['marka']." ".$produkt['nazwa_modelu']; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="pt-5 mt-4 bg-light">
    <nav class="navbar navbar-expand-lg navbar-custom fixed-top">
        <div class="container">
            <a class="navbar-brand" href="index.php">💻 Kiosk IT</a>
            <ul class="navbar-nav ms-auto align-items-center">
                <li class="nav-item me-3"><a class="nav-link fw-bold text-warning" href="koszyk.php">🛒 Koszyk (<?php echo count($_SESSION['koszyk']); ?>)</a></li>
                <li class="nav-item"><a class="nav-link" href="index.php">← Powrót</a></li>
            </ul>
        </div>
    </nav>
    <div class="container mt-5 mb-5">
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="row g-0">
                <div class="col-md-5 bg-dark text-white d-flex align-items-center justify-content-center flex-column py-5">
                    <h1 class="display-1">💻</h1>
                    <p class="mt-3 text-secondary">S/N: <?php echo $produkt['numer_seryjny']; ?></p>
                </div>
                <div class="col-md-7 p-5">
                    <h2 class="fw-bold mb-0"><?php echo $produkt['marka']." ".$produkt['nazwa_modelu']; ?></h2>
                    <span class="badge <?php echo ($produkt['status'] == 'Dostępny') ? 'bg-success' : 'bg-danger'; ?> mt-2 mb-4 fs-6">Status: <?php echo $produkt['status']; ?></span>
                    <h3 class="text-success fw-bold mb-4"><?php echo $produkt['cena_wypozyczenia_dzien']; ?> zł <small class="text-muted fs-6">/ dzień</small></h3>
                    <h5 class="fw-bold border-bottom pb-2">Opis Urządzenia</h5>
                    <p class="text-muted lh-lg"><?php echo $opis; ?></p>
                    <h5 class="fw-bold border-bottom pb-2 mt-4">Najlepsze zastosowanie:</h5>
                    <p class="text-primary fw-bold">🚀 <?php echo $zastosowanie; ?></p>
                    <div class="mt-5">
                        <?php if ($produkt['status'] == 'Dostępny') { ?>
                            <a href="index.php?dodaj_id=<?php echo $produkt['id_egzemplarza']; ?>" class="btn btn-primary btn-lg px-5 rounded-pill shadow">🛒 Dodaj do koszyka</a>
                        <?php } else { ?>
                            <button class="btn btn-secondary btn-lg px-5 rounded-pill" disabled>Sprzęt niedostępny</button>
                        <?php } ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>