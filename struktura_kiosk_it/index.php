<?php
require_once 'db.php';
$komunikat = "";

if (isset($_GET['dodaj_id'])) {
    $id = (int)$_GET['dodaj_id'];
    if (!in_array($id, $_SESSION['koszyk'])) {
        $_SESSION['koszyk'][] = $id;
        $komunikat = "<div class='alert alert-success text-center shadow-sm'>🛒 Sprzęt dodany do koszyka!</div>";
    }
}

$zapytanie_sql = "SELECT e.id_egzemplarza, m.marka, m.nazwa_modelu, e.status, e.cena_wypozyczenia_dzien 
                   FROM egzemplarze e JOIN modele_sprzetu m ON e.id_modelu = m.id_modelu ORDER BY e.status ASC";
$katalog = $conn->query($zapytanie_sql);
$ilosc_w_koszyku = count($_SESSION['koszyk']);
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Kiosk IT - Sklep</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="d-flex flex-column min-vh-100">
    <nav class="navbar navbar-expand-lg navbar-custom fixed-top">
        <div class="container">
            <a class="navbar-brand" href="index.php">💻 Kiosk IT</a>
            <ul class="navbar-nav ms-auto align-items-center">
                <li class="nav-item me-3">
                    <a class="nav-link fw-bold text-warning" href="koszyk.php">🛒 Koszyk (<?php echo $ilosc_w_koszyku; ?>)</a>
                </li>
                <li class="nav-item"><a class="nav-link" href="pracownik.php">Pracownik 🔒</a></li>
            </ul>
        </div>
    </nav>

    <div class="container mt-4 pt-5 flex-grow-1">
        <h2 class="text-center mb-4 fw-bold">Katalog Sprzętu</h2>
        
        <div class="d-flex justify-content-center mb-5">
            <input type="text" id="wyszukiwarka" class="form-control w-50 shadow-sm form-control-lg" placeholder="Wpisz np. Dell, DJI..." onkeyup="filtrujSprzet()">
        </div>

        <?php echo $komunikat; ?>

        <div id="brak-wynikow" class="text-center py-5" style="display:none;">
            <h1 class="display-1 text-muted">😕</h1>
            <h3 class="text-muted mt-3">Przykro nam, nie mamy takiego produktu w ofercie.</h3>
        </div>

        <div class="row g-4" id="lista-produktow">
            <?php
            while($row = $katalog->fetch_assoc()) {
                $dostepny = ($row["status"] == "Dostępny");
                $badge = $dostepny ? "<span class='badge bg-success status-badge'>Dostępny</span>" : "<span class='badge bg-danger status-badge'>Wypożyczony / Serwis</span>";
                
                $btn_koszyk = in_array($row["id_egzemplarza"], $_SESSION['koszyk']) 
                    ? "<button class='btn btn-success rounded-pill px-3' disabled>W koszyku ✓</button>" 
                    : ($dostepny ? "<a href='index.php?dodaj_id=".$row["id_egzemplarza"]."' class='btn btn-primary rounded-pill px-3'>Do koszyka</a>" : "<button class='btn btn-secondary rounded-pill px-3' disabled>Niedostępny</button>");
                
                echo "
                <div class='col-12 col-md-4 karta-sprzetu'>
                    <div class='card h-100 shadow-sm product-card position-relative'>
                        $badge
                        <div class='card-body text-center pt-5'>
                            <h4 class='fw-bold nazwa-sprzetu'>".$row["marka"]." ".$row["nazwa_modelu"]."</h4>
                            <p class='card-price mt-3'>".$row["cena_wypozyczenia_dzien"]." zł / dzień</p>
                            <div class='mt-4 d-flex justify-content-center gap-2'>
                                <a href='produkt.php?id=".$row["id_egzemplarza"]."' class='btn btn-outline-info rounded-pill px-3'>Szczegóły</a>
                                $btn_koszyk
                            </div>
                        </div>
                    </div>
                </div>";
            }
            ?>
        </div>
    </div>

    <footer class="bg-dark text-white text-center py-4 mt-5">
        <div class="container">
            <h5 class="fw-bold text-info">💻 Kiosk IT</h5>
            <p class="text-muted mb-2">Najlepszy sprzęt na wyciągnięcie ręki. Szybko, pewnie i bez kaucji.</p>
            <p class="small text-secondary mb-0">&copy; 2026 Kiosk IT. Projekt Studencki.</p>
        </div>
    </footer>

    <script>
    function filtrujSprzet() {
        let input = document.getElementById('wyszukiwarka').value.toLowerCase();
        let karty = document.getElementsByClassName('karta-sprzetu');
        let widoczne = 0;

        for (let i = 0; i < karty.length; i++) {
            let nazwa = karty[i].querySelector('.nazwa-sprzetu').innerText.toLowerCase();
            if (nazwa.includes(input)) {
                karty[i].style.display = "";
                widoczne++;
            } else {
                karty[i].style.display = "none";
            }
        }
        document.getElementById('brak-wynikow').style.display = (widoczne === 0) ? "block" : "none";
    }
    </script>
</body>
</html>