<?php
require_once 'db.php';
$komunikat = "";

if (isset($_GET['usun_id'])) {
    $id = (int)$_GET['usun_id'];
    if (($key = array_search($id, $_SESSION['koszyk'])) !== false) {
        unset($_SESSION['koszyk'][$key]);
        $_SESSION['koszyk'] = array_values($_SESSION['koszyk']);
    }
    header("Location: koszyk.php"); exit;
}

if (isset($_POST['zloz_zamowienie'])) {
    $imie = $conn->real_escape_string($_POST['imie']);
    $nazwisko = $conn->real_escape_string($_POST['nazwisko']);
    $telefon = $conn->real_escape_string($_POST['telefon']);
    $metoda_platnosci = $conn->real_escape_string($_POST['metoda_platnosci']);
    
    $wybrana_data = $conn->real_escape_string($_POST['data_zwrotu']);
    $data_zwrotu = $wybrana_data . ' 12:00:00';
    
    $dzisiaj_obj = new DateTime();
    $zwrot_obj = new DateTime($wybrana_data);
    $roznica = $dzisiaj_obj->diff($zwrot_obj);
    $dni = ($roznica->days < 1) ? 1 : $roznica->days;
    
    $ids = implode(',', $_SESSION['koszyk']);
    $sql_cena = "SELECT SUM(cena_wypozyczenia_dzien) as suma FROM egzemplarze WHERE id_egzemplarza IN ($ids)";
    $suma_dzien = $conn->query($sql_cena)->fetch_assoc()['suma'];
    $kwota_calkowita = $suma_dzien * $dni;

    $conn->query("INSERT INTO klienci (imie, nazwisko, telefon) VALUES ('$imie', '$nazwisko', '$telefon')");
    $id_klienta = $conn->insert_id; 

    $conn->query("INSERT INTO wypozyczenia (id_klienta, planowana_data_zwrotu, status_transakcji) VALUES ($id_klienta, '$data_zwrotu', 'Trwa')");
    $id_wypozyczenia = $conn->insert_id;
    
    $conn->query("INSERT INTO platnosci (kwota, metoda) VALUES ($kwota_calkowita, '$metoda_platnosci')");
    $id_platnosci = $conn->insert_id;
    $conn->query("INSERT INTO wypozyczenia_platnosci (id_wypozyczenia, id_platnosci, kwota_przypisana) VALUES ($id_wypozyczenia, $id_platnosci, $kwota_calkowita)");

    foreach ($_SESSION['koszyk'] as $id_egzemplarza) {
        $conn->query("INSERT INTO szczegoly_wypozyczenia (id_wypozyczenia, id_egzemplarza) VALUES ($id_wypozyczenia, $id_egzemplarza)");
        $conn->query("UPDATE egzemplarze SET status = 'Wypożyczony' WHERE id_egzemplarza = $id_egzemplarza");
    }
    
    $_SESSION['koszyk'] = array();
    
    // Potężny komunikat z przyciskiem do PDF
    $komunikat = "<div class='alert alert-success p-5 text-center shadow border-0 rounded-4' id='potwierdzenie_pdf'>
                    <h1 class='display-1'>🎉</h1>
                    <h2 class='fw-bold'>Zarezerwowano i opłacono!</h2>
                    <p class='lead text-muted'>Dziękujemy, $imie! Płatność <strong>$kwota_calkowita zł</strong> (metodą: $metoda_platnosci) została zaksięgowana.</p>
                    <p>Wypożyczenie nr: <strong>#$id_wypozyczenia</strong> | Do zwrotu: <strong>$wybrana_data</strong></p>
                    <hr>
                    <div class='mt-4 d-flex justify-content-center gap-3 no-print'>
                        <button onclick='window.print()' class='btn btn-outline-dark btn-lg rounded-pill shadow-sm'>🖨️ Zapisz Umowę jako PDF</button>
                        <a href='index.php' class='btn btn-success btn-lg rounded-pill px-5 shadow'>Wróć do sklepu</a>
                    </div>
                  </div>
                  <style>
                  @media print {
                      body * { visibility: hidden; }
                      #potwierdzenie_pdf, #potwierdzenie_pdf * { visibility: visible; }
                      #potwierdzenie_pdf { position: absolute; left: 0; top: 0; width: 100%; text-align: left; }
                      .no-print { display: none !important; }
                  }
                  </style>";
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Koszyk - Kiosk IT</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="pt-5 mt-4 bg-light d-flex flex-column min-vh-100">
    <nav class="navbar navbar-expand-lg navbar-custom fixed-top no-print">
        <div class="container"><a class="navbar-brand" href="index.php">💻 Kiosk IT</a></div>
    </nav>
    <div class="container flex-grow-1">
        <?php if ($komunikat) { echo $komunikat; } else { ?>
            <h2 class="fw-bold mb-4">🛒 Twój Koszyk</h2>
            <div class="card shadow-sm border-0 rounded-4 mb-5">
                <div class="card-body p-4 p-md-5">
                    <?php
                    if (empty($_SESSION['koszyk'])) {
                        echo "<div class='text-center py-5'><h1 class='display-1 text-muted'>🛒</h1><h4 class='text-muted mt-3'>Koszyk jest pusty.</h4><br><a href='index.php' class='btn btn-primary rounded-pill px-4'>Wróć do sklepu</a></div>";
                    } else {
                        $ids = implode(',', $_SESSION['koszyk']);
                        $sql = "SELECT e.id_egzemplarza, m.marka, m.nazwa_modelu, e.cena_wypozyczenia_dzien FROM egzemplarze e JOIN modele_sprzetu m ON e.id_modelu = m.id_modelu WHERE e.id_egzemplarza IN ($ids)";
                        $wyniki = $conn->query($sql);
                        $suma = 0;
                        echo "<table class='table align-middle table-hover'><thead class='table-light'><tr><th>Sprzęt</th><th>Cena/dzień</th><th class='text-end'>Opcje</th></tr></thead><tbody>";
                        while ($row = $wyniki->fetch_assoc()) {
                            $suma += $row['cena_wypozyczenia_dzien'];
                            echo "<tr><td class='fw-bold'>".$row['marka']." ".$row['nazwa_modelu']."</td><td class='text-success fw-bold'>".$row['cena_wypozyczenia_dzien']." zł</td><td class='text-end'><a href='koszyk.php?usun_id=".$row['id_egzemplarza']."' class='btn btn-sm btn-outline-danger rounded-pill px-3'>Usuń ❌</a></td></tr>";
                        }
                        echo "</tbody></table>
                              <h3 class='text-end mt-4 text-muted fs-5'>Stawka dzienna: $suma zł</h3>
                              <h2 class='fw-bold text-end mb-4 pb-4 border-bottom'>Do zapłaty: <span id='suma_calkowita' class='text-success'>$suma zł</span></h2>";
                        
                        $minimalna_data = date('Y-m-d', strtotime('+1 day'));
                        echo "
                        <h4 class='fw-bold mb-3'>Podsumowanie i Płatność</h4>
                        <form method='POST' class='bg-light p-4 rounded-4 border'>
                            <input type='hidden' name='zloz_zamowienie' value='1'>
                            <div class='row g-3 mb-4'>
                                <div class='col-md-6'><label class='form-label small text-muted'>Imię</label><input type='text' name='imie' class='form-control form-control-lg' required></div>
                                <div class='col-md-6'><label class='form-label small text-muted'>Nazwisko</label><input type='text' name='nazwisko' class='form-control form-control-lg' required></div>
                                <div class='col-md-12'><label class='form-label small text-muted'>Telefon</label><input type='tel' name='telefon' class='form-control form-control-lg' required></div>
                                <div class='col-md-6'>
                                    <label class='form-label small text-muted fw-bold text-primary'>Do kiedy wypożyczasz?</label>
                                    <input type='date' name='data_zwrotu' id='data_zwrotu' class='form-control form-control-lg border-primary' required min='$minimalna_data'>
                                </div>
                                <div class='col-md-6'>
                                    <label class='form-label small text-muted fw-bold text-primary'>Metoda płatności</label>
                                    <select name='metoda_platnosci' class='form-select form-select-lg border-primary' required>
                                        <option value='BLIK'>📱 BLIK</option>
                                        <option value='Karta'>💳 Karta Płatnicza</option>
                                    </select>
                                </div>
                            </div>
                            <div class='text-end'><button type='submit' class='btn btn-success btn-lg px-5 rounded-pill shadow'>Kupuję i Płacę</button></div>
                        </form>
                        <script>
                        const stawkaDzienna = $suma;
                        document.getElementById('data_zwrotu').addEventListener('change', function() {
                            const date1 = new Date(); date1.setHours(0,0,0,0);
                            const date2 = new Date(this.value);
                            const diffTime = Math.abs(date2 - date1);
                            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays < 1) diffDays = 1;
                            document.getElementById('suma_calkowita').innerText = (stawkaDzienna * diffDays).toFixed(2) + ' zł';
                        });
                        </script>";
                    }
                    ?>
                </div>
            </div>
        <?php } ?>
    </div>
</body>
</html>