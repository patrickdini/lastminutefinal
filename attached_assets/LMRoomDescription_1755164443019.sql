-- phpMyAdmin SQL Dump
-- version 4.9.6
-- https://www.phpmyadmin.net/
--
-- Host: fi8jj.myd.infomaniak.com
-- Generation Time: Aug 14, 2025 at 11:41 AM
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
-- Table structure for table `LMRoomDescription`
--

CREATE TABLE `LMRoomDescription` (
  `villa_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `class` varchar(50) DEFAULT NULL,
  `villa_type` varchar(100) DEFAULT NULL,
  `square_meters` decimal(10,2) DEFAULT NULL,
  `webpage_url` varchar(2083) DEFAULT NULL,
  `bedrooms` int(11) DEFAULT NULL,
  `bathrooms` int(11) DEFAULT NULL,
  `max_guests` int(11) DEFAULT NULL,
  `max_adults` int(11) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_urls` text DEFAULT NULL,
  `video_tour_url` varchar(2083) DEFAULT NULL,
  `ideal_for` text DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `view_type` varchar(100) DEFAULT NULL,
  `pool_type` varchar(50) DEFAULT NULL,
  `key_amenities` text DEFAULT NULL,
  `active_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `LMRoomDescription`
--

INSERT INTO `LMRoomDescription` (`villa_id`, `name`, `class`, `villa_type`, `square_meters`, `webpage_url`, `bedrooms`, `bathrooms`, `max_guests`, `max_adults`, `tagline`, `description`, `image_urls`, `video_tour_url`, `ideal_for`, `is_featured`, `view_type`, `pool_type`, `key_amenities`, `active_status`, `created_at`, `updated_at`) VALUES
('Leaf', 'The Leaf Villa', 'Masterpiece', 'Standalone Villa', '400.00', 'https://villatokay.com/the-leaf-luxury-honeymoon-villa-gili-air/', 1, 1, 2, 2, 'Bamboo honeymoon villa, aerial architecture, pool bliss', 'Breathtaking bamboo villa with aerial architecture & private pool. King bedroom, rain shower, 400sqm garden. Ultimate honeymoon luxury escape.', '[\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Leaf-Pool-and-Architecture-r8cd7tfvjcn6jdrvwwo3i1tnjhewl4vq21bzjhf1vk.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/2022/09/Villa-Tokay-The-Leaf-Bedroom-Kingsize.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/2022/09/Villa-Tokay-The-Leaf-Terrace.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/2022/09/Villa-Tokay-The-Leaf-bedroom-1.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/2023/10/Villa-Tokay-The-Leaf-Overview.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/2022/11/Villa-Tokay-Pool-Girl.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/2023/10/Villa-Tokay-The-Leaf-Drone-Overview.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/2023/10/Villa-Tokay-The-Leaf-Hanging-Net.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/2023/10/Vilal-Tokay-The-Leaf-Sunbeds.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Leaf-Living-Room-and-Pool-r8cd7x7by927wa1wj8tcxmeipyu1rv2ph0qfr1jb0o.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Leaf-Living-pvbh6yetx7y5pkiibjp7y1ltxafzxeo1c5dne7jqfc.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Leaf-Living-Room-and-Stairs-r8cd7vbjx0pr6lp5lxhcn1ckq95n0j36qamyi1c9j4.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Leaf-bedroom-view-1-pvbjdnge3vodqa7cskarp6p4cmkad530tnn3u6v5hk.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Leaf-Bathroom-Bamboo-Door-r8cd7pomfkrxbectr5kcdoatyvv42a8urzijwtugeg.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Leaf-Outdoor-Shower-and-Woman-r8cd9kf5wtba7pnvxgeuspgk58q68slsp5u0zh3i4o.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-Pool-and-Floating-Breakfast-r8cd9gnphww8utdvb49ld4voyrb122eta6fkrwz8zk.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Leaf-Sunbeds-and-Drinks-r8cd84q1gxcih5qzbc2dhki7h1szhfwk61ybl985mw.webp\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Leaf-Woman-with-Bike-in-Garden-r8cd87jgdv6hdj7emkri1g9kg9heslfp3z49qmu5a8.webp\"\r\n]', '', '[\"Couples\", \"Honeymooners\", \"Design Lovers\"]', 0, 'Garden View', 'Private', '[\"Private Pool\", \"Outdoor Bathtub\", \"Open Kitchen\", \"In-Villa Breakfast & Dinner\"]', 1, '2025-08-14 09:01:14', '2025-08-14 09:01:14'),
('Pearl', 'The Pearl Villa', 'Sanctuary', 'Standalone Villa', '120.00', 'https://villatokay.com/villa-tokay-the-pearl-private-luxury-villa-gili-air/', 1, 1, 4, 2, 'Art-deco bath, private pool, lush garden sanctuary', 'One-bedroom villa in coconut grove with private pool. King bed, upstairs sunrise terrace, art-deco bath. Shower under stars, jungle serenity.', '[\r\n  \"https://villatokay.com/wp-content/uploads/2022/09/Villa-Tokay-The-Pearl-Outdoors-Terrace.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/2022/09/Villa-Tokay-The-Pearl-Kitchen-room.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/2022/09/Villa-Tokay-The-Pearl-Double-Bedroom.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/2022/09/Villa-Tokay-The-Pearl-Outdoors.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/2022/09/Villa-Tokay-The-Pearl-Livingroom-Sofa.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Pearl-Living-Room-pv809f9b015zubfhqypoyhblcs7gqarzbfkoqe30js.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Pearl-Indoor-Living-pv8099m67gn8x0jmrge9bpjs7u56kef617vliczlo0.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Pearl-Bathroom-Shower-pv80907sb4adowxaacbzmrx69zfiffdunxcqpldje8.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Pearl-Double-Bedroom2-pv80qxz0dv5e8nzcg1ccxk5vybur77bve5bhr23uko.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Pearl-Outdoors-pool-garden-day-pv80r6fk3dgz55n22n002011asp24h9gfb6v2jrb0o.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/Villa-Tokay-The-Pearl-Outdoors-Terrace-pv809w6ef1t5naqx060z7d1w1pw2kun5drbfdddxfs.jpg\",\r\n  \"https://villatokay.com/wp-content/uploads/elementor/thumbs/image2-ptebtl0amsisraqwty0q8ocktb2d3vwtfc7zpo4ars.jpg\"\r\n]', '', '[\"Couples\", \"Small Families\", \"Design Lovers\"]', 0, 'Garden View', 'Private', '[\"Private Pool\", \"Full Kitchen\", \"Upstairs Terrace\", \"Open-Air Shower\"]', 1, '2025-08-14 09:01:14', '2025-08-14 09:01:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `LMRoomDescription`
--
ALTER TABLE `LMRoomDescription`
  ADD PRIMARY KEY (`villa_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
