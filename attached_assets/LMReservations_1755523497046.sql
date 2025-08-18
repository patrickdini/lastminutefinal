-- phpMyAdmin SQL Dump
-- version 4.9.6
-- https://www.phpmyadmin.net/
--
-- Host: fi8jj.myd.infomaniak.com
-- Generation Time: Aug 18, 2025 at 03:25 PM
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
-- Table structure for table `LMReservations`
--

CREATE TABLE `LMReservations` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `location` text DEFAULT NULL,
  `special_requests` text DEFAULT NULL,
  `transport` text DEFAULT NULL,
  `private_boat_interest` tinyint(1) DEFAULT 0,
  `accommodations_booked` text DEFAULT NULL,
  `villa_id` text DEFAULT NULL,
  `perks` text DEFAULT NULL,
  `price_guests` decimal(10,2) DEFAULT NULL,
  `number_adults` int(11) DEFAULT NULL,
  `number_children` int(11) DEFAULT 0,
  `savings_guests` decimal(10,2) DEFAULT NULL,
  `check_in_date` date DEFAULT NULL,
  `check_out_date` date DEFAULT NULL,
  `date_received` datetime DEFAULT current_timestamp(),
  `date_payment` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `LMReservations`
--

INSERT INTO `LMReservations` (`id`, `first_name`, `last_name`, `email`, `phone_number`, `address`, `location`, `special_requests`, `transport`, `private_boat_interest`, `accommodations_booked`, `villa_id`, `perks`, `price_guests`, `number_adults`, `number_children`, `savings_guests`, `check_in_date`, `check_out_date`, `date_received`, `date_payment`) VALUES
(1, 'Patrick', 'Dini', 'patrick_dini@hotmail.com', '+41787128225', 'Desa Hay, Canggu', 'bali', 'Gluten free', 'yes', 0, '[{\"villa_id\":\"The Shore Villa\",\"check_in_date\":\"2025-08-22\",\"check_out_date\":\"2025-08-25\"}]', '[\"The Shore Villa\"]', '[{\"activity_id\":9,\"activity_name\":\"Homemade Cocktails\",\"tagline\":\"Homemade cocktails\",\"description\":\"Enjoy our selection of cocktails in your villa or at the bar.\",\"face_price\":\"140000.00\",\"comments\":null},{\"activity_id\":4,\"activity_name\":\"Massage\",\"tagline\":\"Massage (1 hour)\",\"description\":\"Pamper yourself with a rejuvenating massage in the comfort of your private villa.\",\"face_price\":\"1000000.00\",\"comments\":\"\"},{\"activity_id\":3,\"activity_name\":\"Sunset Trip\",\"tagline\":\"Private Sunset Trip\",\"description\":\"Experience the breathtaking sunset from a private boat, complete with drinks and snacks.\",\"face_price\":\"3500000.00\",\"comments\":\"\"},{\"activity_id\":5,\"activity_name\":\"Floating Breakfast\",\"tagline\":\"Floating Breakfast\",\"description\":\"Order our romantic floating breakfast and enjoy it in your private pool.\",\"face_price\":\"500000.00\",\"comments\":\"\"},{\"activity_id\":10,\"activity_name\":\"Fastboat Transfer\",\"tagline\":\"Fastboat Transfer from...\",\"description\":\"Let us offer you your transfer from Bali.\",\"face_price\":\"650000.00\",\"comments\":\"\"}]', '27900000.00', 2, 0, '7580000.00', '2025-08-22', '2025-08-25', '2025-08-18 20:57:55', NULL),
(2, 'Patrick', 'Dini', 'patrick_dini@hotmail.com', '+41787128225', NULL, NULL, 'asdf', 'no', 0, '[{\"villa_id\":\"The Shore Villa\",\"check_in_date\":\"2025-08-22\",\"check_out_date\":\"2025-08-25\"}]', '[\"The Shore Villa\"]', '[{\"activity_id\":9,\"activity_name\":\"Homemade Cocktails\",\"tagline\":\"Homemade cocktails\",\"description\":\"Enjoy our selection of cocktails in your villa or at the bar.\",\"face_price\":\"140000.00\",\"comments\":null},{\"activity_id\":4,\"activity_name\":\"Massage\",\"tagline\":\"Massage (1 hour)\",\"description\":\"Pamper yourself with a rejuvenating massage in the comfort of your private villa.\",\"face_price\":\"1000000.00\",\"comments\":\"\"},{\"activity_id\":3,\"activity_name\":\"Sunset Trip\",\"tagline\":\"Private Sunset Trip\",\"description\":\"Experience the breathtaking sunset from a private boat, complete with drinks and snacks.\",\"face_price\":\"3500000.00\",\"comments\":\"\"},{\"activity_id\":5,\"activity_name\":\"Floating Breakfast\",\"tagline\":\"Floating Breakfast\",\"description\":\"Order our romantic floating breakfast and enjoy it in your private pool.\",\"face_price\":\"500000.00\",\"comments\":\"\"},{\"activity_id\":10,\"activity_name\":\"Fastboat Transfer\",\"tagline\":\"Fastboat Transfer from...\",\"description\":\"Let us offer you your transfer from Bali.\",\"face_price\":\"650000.00\",\"comments\":\"\"}]', '27900000.00', 2, 0, '7580000.00', '2025-08-22', '2025-08-25', '2025-08-18 21:01:05', NULL),
(3, 'Patrick', 'Dini', 'patrick_dini@hotmail.com', '+41787128225', NULL, NULL, 'asdf asdf as', 'unsure', 0, '[{\"villa_id\":\"The Shore Villa\",\"check_in_date\":\"2025-08-29\",\"check_out_date\":\"2025-08-31\"}]', '[\"The Shore Villa\"]', '[{\"activity_id\":9,\"activity_name\":\"Homemade Cocktails\",\"tagline\":\"Homemade cocktails\",\"description\":\"Enjoy our selection of cocktails in your villa or at the bar.\",\"face_price\":\"140000.00\",\"comments\":null},{\"activity_id\":4,\"activity_name\":\"Massage\",\"tagline\":\"Massage (1 hour)\",\"description\":\"Pamper yourself with a rejuvenating massage in the comfort of your private villa.\",\"face_price\":\"1000000.00\",\"comments\":\"\"},{\"activity_id\":3,\"activity_name\":\"Sunset Trip\",\"tagline\":\"Private Sunset Trip\",\"description\":\"Experience the breathtaking sunset from a private boat, complete with drinks and snacks.\",\"face_price\":\"3500000.00\",\"comments\":\"\"}]', '18600000.00', 2, 0, '5780000.00', '2025-08-29', '2025-08-31', '2025-08-18 21:05:31', NULL),
(4, 'Patrick', 'Dini', 'patrick_dini@hotmail.com', '+41787128225', 'Munduk Cabin', 'bali', 'asdf asf asdf', 'yes', 1, '[{\"villa_id\":\"The Pearl Villa\",\"check_in_date\":\"2025-08-27\",\"check_out_date\":\"2025-08-29\"}]', '[\"The Pearl Villa\"]', '[{\"activity_id\":9,\"activity_name\":\"Homemade Cocktails\",\"tagline\":\"Homemade cocktails\",\"description\":\"Enjoy our selection of cocktails in your villa or at the bar.\",\"face_price\":\"140000.00\",\"comments\":null},{\"activity_id\":4,\"activity_name\":\"Massage\",\"tagline\":\"Massage (1 hour)\",\"description\":\"Pamper yourself with a rejuvenating massage in the comfort of your private villa.\",\"face_price\":\"1000000.00\",\"comments\":\"\"}]', '11000000.00', 2, 0, '2280000.00', '2025-08-27', '2025-08-29', '2025-08-18 21:08:26', NULL),
(5, 'Patrick', 'Dini', 'patrick_dini@hotmail.com', '+41787128225', 'Shady Lane', 'bali', NULL, 'yes', 0, '[{\"villa_id\":\"The Pearl Villa\",\"check_in_date\":\"2025-08-27\",\"check_out_date\":\"2025-08-29\"}]', '[\"The Pearl Villa\"]', '[{\"activity_id\":9,\"activity_name\":\"Homemade Cocktails\",\"tagline\":\"Homemade cocktails\",\"description\":\"Enjoy our selection of cocktails in your villa or at the bar.\",\"face_price\":\"140000.00\",\"comments\":null},{\"activity_id\":4,\"activity_name\":\"Massage\",\"tagline\":\"Massage (1 hour)\",\"description\":\"Pamper yourself with a rejuvenating massage in the comfort of your private villa.\",\"face_price\":\"1000000.00\",\"comments\":\"\"}]', '11000000.00', 2, 0, '2280000.00', '2025-08-27', '2025-08-29', '2025-08-18 21:22:35', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `LMReservations`
--
ALTER TABLE `LMReservations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `LMReservations`
--
ALTER TABLE `LMReservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
