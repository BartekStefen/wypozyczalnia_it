-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 11, 2026 at 03:27 PM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kiosk_it`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `dostawcy`
--

CREATE TABLE `dostawcy` (
  `id_dostawcy` int(11) NOT NULL,
  `nazwa_firmy` varchar(100) NOT NULL,
  `telefon` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `dostawcy_modele`
--

CREATE TABLE `dostawcy_modele` (
  `id_dostawcy` int(11) NOT NULL,
  `id_modelu` int(11) NOT NULL,
  `cena_hurtowa` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `egzemplarze`
--

CREATE TABLE `egzemplarze` (
  `id_egzemplarza` int(11) NOT NULL,
  `id_modelu` int(11) DEFAULT NULL,
  `numer_seryjny` varchar(100) NOT NULL,
  `status` varchar(30) DEFAULT 'Dostępny',
  `cena_wypozyczenia_dzien` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `egzemplarze`
--

INSERT INTO `egzemplarze` (`id_egzemplarza`, `id_modelu`, `numer_seryjny`, `status`, `cena_wypozyczenia_dzien`) VALUES
(1, 1, 'SN-DELL-001', 'Dostępny', 50.00),
(2, 2, 'SN-DJI-999', 'Dostępny', 120.00);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `kategorie_modele`
--

CREATE TABLE `kategorie_modele` (
  `id_kategorii` int(11) NOT NULL,
  `id_modelu` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `kategorie_sprzetu`
--

CREATE TABLE `kategorie_sprzetu` (
  `id_kategorii` int(11) NOT NULL,
  `nazwa` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `klienci`
--

CREATE TABLE `klienci` (
  `id_klienta` int(11) NOT NULL,
  `imie` varchar(50) NOT NULL,
  `nazwisko` varchar(50) NOT NULL,
  `telefon` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `numer_dokumentu` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `klienci`
--

INSERT INTO `klienci` (`id_klienta`, `imie`, `nazwisko`, `telefon`, `email`, `numer_dokumentu`) VALUES
(1, 'Jan', 'Kowalski', '123456789', 'jan@test.pl', 'ABC123456'),
(2, 'Anna', 'Nowak', '987654321', 'anna@test.pl', 'DEF654321');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `modele_sprzetu`
--

CREATE TABLE `modele_sprzetu` (
  `id_modelu` int(11) NOT NULL,
  `marka` varchar(50) NOT NULL,
  `nazwa_modelu` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `modele_sprzetu`
--

INSERT INTO `modele_sprzetu` (`id_modelu`, `marka`, `nazwa_modelu`) VALUES
(1, 'Dell', 'Latitude 5420'),
(2, 'DJI', 'Mini 3 Pro');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `naliczone_kary`
--

CREATE TABLE `naliczone_kary` (
  `id_szczegolow` int(11) NOT NULL,
  `id_rodzaju` int(11) NOT NULL,
  `ostateczna_kwota` decimal(10,2) DEFAULT NULL,
  `czy_oplacona` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `platnosci`
--

CREATE TABLE `platnosci` (
  `id_platnosci` int(11) NOT NULL,
  `data_wplaty` timestamp NOT NULL DEFAULT current_timestamp(),
  `kwota` decimal(10,2) NOT NULL,
  `metoda` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `rodzaje_kar`
--

CREATE TABLE `rodzaje_kar` (
  `id_rodzaju` int(11) NOT NULL,
  `nazwa_przewinienia` varchar(100) NOT NULL,
  `domyslna_kwota` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `serwis_egzemplarze`
--

CREATE TABLE `serwis_egzemplarze` (
  `id_serwisu` int(11) NOT NULL,
  `id_egzemplarza` int(11) NOT NULL,
  `koszt_naprawy` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `szczegoly_wypozyczenia`
--

CREATE TABLE `szczegoly_wypozyczenia` (
  `id_szczegolow` int(11) NOT NULL,
  `id_wypozyczenia` int(11) DEFAULT NULL,
  `id_egzemplarza` int(11) DEFAULT NULL,
  `rzeczywista_data_zwrotu` datetime DEFAULT NULL,
  `koszt_pozycji` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `wypozyczenia`
--

CREATE TABLE `wypozyczenia` (
  `id_wypozyczenia` int(11) NOT NULL,
  `id_klienta` int(11) DEFAULT NULL,
  `data_wydania` timestamp NOT NULL DEFAULT current_timestamp(),
  `planowana_data_zwrotu` datetime NOT NULL,
  `status_transakcji` varchar(30) DEFAULT 'Trwa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `wypozyczenia_platnosci`
--

CREATE TABLE `wypozyczenia_platnosci` (
  `id_wypozyczenia` int(11) NOT NULL,
  `id_platnosci` int(11) NOT NULL,
  `kwota_przypisana` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `zgloszenia_serwisowe`
--

CREATE TABLE `zgloszenia_serwisowe` (
  `id_serwisu` int(11) NOT NULL,
  `data_zgloszenia` timestamp NOT NULL DEFAULT current_timestamp(),
  `opis_sytuacji` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `dostawcy`
--
ALTER TABLE `dostawcy`
  ADD PRIMARY KEY (`id_dostawcy`);

--
-- Indeksy dla tabeli `dostawcy_modele`
--
ALTER TABLE `dostawcy_modele`
  ADD PRIMARY KEY (`id_dostawcy`,`id_modelu`),
  ADD KEY `id_modelu` (`id_modelu`);

--
-- Indeksy dla tabeli `egzemplarze`
--
ALTER TABLE `egzemplarze`
  ADD PRIMARY KEY (`id_egzemplarza`),
  ADD UNIQUE KEY `numer_seryjny` (`numer_seryjny`),
  ADD KEY `id_modelu` (`id_modelu`);

--
-- Indeksy dla tabeli `kategorie_modele`
--
ALTER TABLE `kategorie_modele`
  ADD PRIMARY KEY (`id_kategorii`,`id_modelu`),
  ADD KEY `id_modelu` (`id_modelu`);

--
-- Indeksy dla tabeli `kategorie_sprzetu`
--
ALTER TABLE `kategorie_sprzetu`
  ADD PRIMARY KEY (`id_kategorii`);

--
-- Indeksy dla tabeli `klienci`
--
ALTER TABLE `klienci`
  ADD PRIMARY KEY (`id_klienta`),
  ADD UNIQUE KEY `numer_dokumentu` (`numer_dokumentu`);

--
-- Indeksy dla tabeli `modele_sprzetu`
--
ALTER TABLE `modele_sprzetu`
  ADD PRIMARY KEY (`id_modelu`);

--
-- Indeksy dla tabeli `naliczone_kary`
--
ALTER TABLE `naliczone_kary`
  ADD PRIMARY KEY (`id_szczegolow`,`id_rodzaju`),
  ADD KEY `id_rodzaju` (`id_rodzaju`);

--
-- Indeksy dla tabeli `platnosci`
--
ALTER TABLE `platnosci`
  ADD PRIMARY KEY (`id_platnosci`);

--
-- Indeksy dla tabeli `rodzaje_kar`
--
ALTER TABLE `rodzaje_kar`
  ADD PRIMARY KEY (`id_rodzaju`);

--
-- Indeksy dla tabeli `serwis_egzemplarze`
--
ALTER TABLE `serwis_egzemplarze`
  ADD PRIMARY KEY (`id_serwisu`,`id_egzemplarza`),
  ADD KEY `id_egzemplarza` (`id_egzemplarza`);

--
-- Indeksy dla tabeli `szczegoly_wypozyczenia`
--
ALTER TABLE `szczegoly_wypozyczenia`
  ADD PRIMARY KEY (`id_szczegolow`),
  ADD KEY `id_wypozyczenia` (`id_wypozyczenia`),
  ADD KEY `id_egzemplarza` (`id_egzemplarza`);

--
-- Indeksy dla tabeli `wypozyczenia`
--
ALTER TABLE `wypozyczenia`
  ADD PRIMARY KEY (`id_wypozyczenia`),
  ADD KEY `id_klienta` (`id_klienta`);

--
-- Indeksy dla tabeli `wypozyczenia_platnosci`
--
ALTER TABLE `wypozyczenia_platnosci`
  ADD PRIMARY KEY (`id_wypozyczenia`,`id_platnosci`),
  ADD KEY `id_platnosci` (`id_platnosci`);

--
-- Indeksy dla tabeli `zgloszenia_serwisowe`
--
ALTER TABLE `zgloszenia_serwisowe`
  ADD PRIMARY KEY (`id_serwisu`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dostawcy`
--
ALTER TABLE `dostawcy`
  MODIFY `id_dostawcy` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `egzemplarze`
--
ALTER TABLE `egzemplarze`
  MODIFY `id_egzemplarza` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `kategorie_sprzetu`
--
ALTER TABLE `kategorie_sprzetu`
  MODIFY `id_kategorii` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `klienci`
--
ALTER TABLE `klienci`
  MODIFY `id_klienta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `modele_sprzetu`
--
ALTER TABLE `modele_sprzetu`
  MODIFY `id_modelu` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `platnosci`
--
ALTER TABLE `platnosci`
  MODIFY `id_platnosci` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rodzaje_kar`
--
ALTER TABLE `rodzaje_kar`
  MODIFY `id_rodzaju` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `szczegoly_wypozyczenia`
--
ALTER TABLE `szczegoly_wypozyczenia`
  MODIFY `id_szczegolow` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wypozyczenia`
--
ALTER TABLE `wypozyczenia`
  MODIFY `id_wypozyczenia` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `zgloszenia_serwisowe`
--
ALTER TABLE `zgloszenia_serwisowe`
  MODIFY `id_serwisu` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `dostawcy_modele`
--
ALTER TABLE `dostawcy_modele`
  ADD CONSTRAINT `dostawcy_modele_ibfk_1` FOREIGN KEY (`id_dostawcy`) REFERENCES `dostawcy` (`id_dostawcy`),
  ADD CONSTRAINT `dostawcy_modele_ibfk_2` FOREIGN KEY (`id_modelu`) REFERENCES `modele_sprzetu` (`id_modelu`);

--
-- Constraints for table `egzemplarze`
--
ALTER TABLE `egzemplarze`
  ADD CONSTRAINT `egzemplarze_ibfk_1` FOREIGN KEY (`id_modelu`) REFERENCES `modele_sprzetu` (`id_modelu`);

--
-- Constraints for table `kategorie_modele`
--
ALTER TABLE `kategorie_modele`
  ADD CONSTRAINT `kategorie_modele_ibfk_1` FOREIGN KEY (`id_kategorii`) REFERENCES `kategorie_sprzetu` (`id_kategorii`),
  ADD CONSTRAINT `kategorie_modele_ibfk_2` FOREIGN KEY (`id_modelu`) REFERENCES `modele_sprzetu` (`id_modelu`);

--
-- Constraints for table `naliczone_kary`
--
ALTER TABLE `naliczone_kary`
  ADD CONSTRAINT `naliczone_kary_ibfk_1` FOREIGN KEY (`id_szczegolow`) REFERENCES `szczegoly_wypozyczenia` (`id_szczegolow`),
  ADD CONSTRAINT `naliczone_kary_ibfk_2` FOREIGN KEY (`id_rodzaju`) REFERENCES `rodzaje_kar` (`id_rodzaju`);

--
-- Constraints for table `serwis_egzemplarze`
--
ALTER TABLE `serwis_egzemplarze`
  ADD CONSTRAINT `serwis_egzemplarze_ibfk_1` FOREIGN KEY (`id_serwisu`) REFERENCES `zgloszenia_serwisowe` (`id_serwisu`),
  ADD CONSTRAINT `serwis_egzemplarze_ibfk_2` FOREIGN KEY (`id_egzemplarza`) REFERENCES `egzemplarze` (`id_egzemplarza`);

--
-- Constraints for table `szczegoly_wypozyczenia`
--
ALTER TABLE `szczegoly_wypozyczenia`
  ADD CONSTRAINT `szczegoly_wypozyczenia_ibfk_1` FOREIGN KEY (`id_wypozyczenia`) REFERENCES `wypozyczenia` (`id_wypozyczenia`),
  ADD CONSTRAINT `szczegoly_wypozyczenia_ibfk_2` FOREIGN KEY (`id_egzemplarza`) REFERENCES `egzemplarze` (`id_egzemplarza`);

--
-- Constraints for table `wypozyczenia`
--
ALTER TABLE `wypozyczenia`
  ADD CONSTRAINT `wypozyczenia_ibfk_1` FOREIGN KEY (`id_klienta`) REFERENCES `klienci` (`id_klienta`);

--
-- Constraints for table `wypozyczenia_platnosci`
--
ALTER TABLE `wypozyczenia_platnosci`
  ADD CONSTRAINT `wypozyczenia_platnosci_ibfk_1` FOREIGN KEY (`id_wypozyczenia`) REFERENCES `wypozyczenia` (`id_wypozyczenia`),
  ADD CONSTRAINT `wypozyczenia_platnosci_ibfk_2` FOREIGN KEY (`id_platnosci`) REFERENCES `platnosci` (`id_platnosci`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
