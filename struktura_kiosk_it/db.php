<?php
// W³¹czamy sesje (zawsze na samej górze!)
session_start();

$host = "localhost";
$user = "root";
$password = "";
$dbname = "kiosk_it";

$conn = new mysqli($host, $user, $password, $dbname);
if ($conn->connect_error) {
    die("B³¹d po³¹czenia z baz¹ danych: " . $conn->connect_error);
}
// Wymuszenie polskiego kodowania dla po³¹czenia
$conn->set_charset("utf8mb4");

// Inicjalizacja pustego koszyka dla klienta
if (!isset($_SESSION['koszyk'])) {
    $_SESSION['koszyk'] = array();
}
?>