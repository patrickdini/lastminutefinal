-- phpMyAdmin SQL Dump
-- version 4.9.6
-- https://www.phpmyadmin.net/
--
-- Host: fi8jj.myd.infomaniak.com
-- Generation Time: Aug 14, 2025 at 10:43 AM
-- Server version: 10.6.21-MariaDB-deb11-log
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fi8jj_VT_DEV`
--

-- --------------------------------------------------------

--
-- Table structure for table `LMvilla_config`
--

CREATE TABLE `LMvilla_config` (
  `villa_id` int(11) NOT NULL,
  `villa_name` varchar(255) NOT NULL,
  `bedrooms` int(11) NOT NULL,
  `max_adults_per_unit` int(11) NOT NULL,
  `max_guests_per_unit` int(11) NOT NULL,
  `privacy_level` varchar(100) DEFAULT NULL,
  `pool_type` varchar(100) DEFAULT NULL,
  `villa_class` varchar(100) DEFAULT NULL,
  `child_age_limit` int(11) DEFAULT 12,
  `description` text DEFAULT NULL,
  `active_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `LMvilla_config`
--

INSERT INTO `LMvilla_config` (`villa_id`, `villa_name`, `bedrooms`, `max_adults_per_unit`, `max_guests_per_unit`, `privacy_level`, `pool_type`, `villa_class`, `child_age_limit`, `description`, `active_status`, `created_at`, `updated_at`) VALUES
(1, 'Leaf', 1, 2, 2, 'Full Privacy', 'Private Pool', 'Premium', 12, NULL, 1, '2025-08-14 08:29:44', '2025-08-14 08:29:44'),
(2, 'Pearl & Shell', 1, 2, 4, 'Full Privacy', 'Private Pool', 'Premium', 12, NULL, 1, '2025-08-14 08:29:44', '2025-08-14 08:29:44'),
(3, 'Shore', 2, 4, 4, 'Full Privacy', 'Private Pool', 'Premium', 12, NULL, 1, '2025-08-14 08:29:44', '2025-08-14 08:29:44'),
(4, 'Sunset Room', 1, 2, 2, 'Full Privacy', 'Shared Pool', 'Normal', 12, NULL, 1, '2025-08-14 08:29:45', '2025-08-14 08:29:45'),
(5, 'Swell 2BR', 2, 4, 4, 'Full Privacy', 'Private Pool', 'Premium', 12, NULL, 1, '2025-08-14 08:29:45', '2025-08-14 08:29:45'),
(6, 'Swell 3BR', 3, 6, 7, 'Full Privacy', 'Private Pool', 'Premium', 12, NULL, 1, '2025-08-14 08:29:45', '2025-08-14 08:29:45'),
(7, 'Swell 4BR', 4, 8, 10, 'Full Privacy', 'Private Pool', 'Premium', 12, NULL, 1, '2025-08-14 08:29:45', '2025-08-14 08:29:45'),
(8, 'Tide', 1, 2, 3, 'Full Privacy', 'Private Pool', 'Premium', 12, NULL, 1, '2025-08-14 08:29:45', '2025-08-14 08:29:45'),
(9, 'Wave', 1, 2, 2, 'Full Privacy', 'Shared Pool', 'Normal', 12, NULL, 1, '2025-08-14 08:29:45', '2025-08-14 08:29:45');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `LMvilla_config`
--
ALTER TABLE `LMvilla_config`
  ADD PRIMARY KEY (`villa_id`),
  ADD UNIQUE KEY `villa_name` (`villa_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `LMvilla_config`
--
ALTER TABLE `LMvilla_config`
  MODIFY `villa_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
