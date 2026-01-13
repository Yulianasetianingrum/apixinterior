-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 13, 2026 at 03:06 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `apixinterior`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `passwordHash`, `role`, `createdAt`, `updatedAt`) VALUES
(1, 'apixinterior', '$2b$12$1J4sotZjbSQPfqaU5ScRUey6ENM2ba.wPQu08FrzQB3LSFY40PBPm', 'superadmin', '2025-12-09 00:58:08.591', '2025-12-09 01:12:11.801');

-- --------------------------------------------------------

--
-- Table structure for table `adminmenuitem`
--

CREATE TABLE `adminmenuitem` (
  `id` int(11) NOT NULL,
  `label` varchar(191) NOT NULL,
  `path` varchar(191) NOT NULL,
  `iconKey` varchar(191) DEFAULT NULL,
  `parentId` int(11) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `banner_promo`
--

CREATE TABLE `banner_promo` (
  `id` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `subtitle` varchar(191) DEFAULT NULL,
  `imageUrl` varchar(191) NOT NULL,
  `buttonLabel` varchar(191) DEFAULT NULL,
  `buttonHref` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banner_promo`
--

INSERT INTO `banner_promo` (`id`, `title`, `subtitle`, `imageUrl`, `buttonLabel`, `buttonHref`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 'y', 'Disc 10%', '/uploads/banners/1765363012798-Sea__Sky_And_Frangipani__Wallpapers__Backdrop_Background_Image_And_Wallpaper_for_Free_Download.jpg', NULL, NULL, 1, '2025-12-10 10:36:52.804', '2025-12-10 10:36:52.804'),
(2, 'g', NULL, '/uploads/banners/1765386157220-Sea__Sky_And_Frangipani__Wallpapers__Backdrop_Background_Image_And_Wallpaper_for_Free_Download.jpg', NULL, NULL, 1, '2025-12-10 17:02:37.225', '2025-12-10 17:02:37.225');

-- --------------------------------------------------------

--
-- Table structure for table `cabang_toko`
--

CREATE TABLE `cabang_toko` (
  `id` int(11) NOT NULL,
  `namaCabang` varchar(191) NOT NULL,
  `mapsUrl` text NOT NULL,
  `urutan` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cabang_toko`
--

INSERT INTO `cabang_toko` (`id`, `namaCabang`, `mapsUrl`, `urutan`, `createdAt`, `updatedAt`) VALUES
(7, 'Bekasi, Jawa Barat', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.7707336605604!2d106.96402257499095!3d-6.293832693695207!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d049216585b%3A0x69c6e1c0ddbb1f1b!2sAPIX%20INTERIOR!5e0!3m2!1sid!2sid!4v1767962639406!5m2!1sid!2sid', NULL, '2026-01-08 07:42:38.841', '2026-01-09 14:54:14.826');

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `name`) VALUES
(1, 'furniture dapur'),
(4, 'furniture ruang'),
(9, 'Furniture Rumah'),
(5, 'hiasan tanaman'),
(6, 'kamar tidur'),
(2, 'Plant Decoration'),
(8, 'ruang belajar'),
(7, 'ruang kamar'),
(3, 'ruang kamar tidur');

-- --------------------------------------------------------

--
-- Table structure for table `dynamic_pages`
--

CREATE TABLE `dynamic_pages` (
  `id` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `content` longtext NOT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 1,
  `seoTitle` varchar(191) DEFAULT NULL,
  `seoDescription` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dynamic_pages`
--

INSERT INTO `dynamic_pages` (`id`, `title`, `slug`, `content`, `isPublished`, `seoTitle`, `seoDescription`, `createdAt`, `updatedAt`) VALUES
(1, 'FAQ', 'faq', '<h2>Pemesanan</h2>\n<ul>\n    <li><strong>Bagaimana cara memesan?</strong><br>Anda dapat memilih produk di website kami, klik tombol \'Pesan via WhatsApp\', dan tim kami akan membantu proses selanjutnya.</li>\n    <li><strong>Apakah bisa custom ukuran?</strong><br>Ya, kami menerima pesanan custom (ukuran, warna, material) untuk hampir semua produk furniture.</li>\n</ul>\n\n<h2>Pengiriman & Pemasangan</h2>\n<ul>\n    <li><strong>Apakah mengirim ke seluruh Indonesia?</strong><br>Ya, kami melayani pengiriman ke seluruh kota di Indonesia menggunakan ekspedisi terpercaya.</li>\n    <li><strong>Apakah harga sudah termasuk pemasangan?</strong><br>Untuk area JABODETABEK, harga sudah termasuk jasa pasang. Untuk luar kota, mohon hubungi sales kami.</li>\n</ul>\n\n<h2>Pembayaran</h2>\n<ul>\n    <li><strong>Metode pembayaran apa saja?</strong><br>Kami menerima Transfer Bank (BCA, Mandiri) dan Kartu Kredit.</li>\n    <li><strong>Apakah bisa DP dulu?</strong><br>Ya, untuk pesanan custom, kami memerlukan DP 50% dan pelunasan sebelum barang dikirim.</li>\n</ul>', 1, '', 'Pertanyaan yang sering diajukan seputar produk, pemesanan, dan pengiriman di APIX Interior.', '2026-01-09 06:23:26.087', '2026-01-09 07:44:08.298'),
(2, 'Syarat & Ketentuan', 'terms', '<p>Selamat datang di APIX Interior. Dengan mengakses website atau melakukan pemesanan, Anda menyetujui syarat dan ketentuan berikut:</p>\n\n<h3>1. Produk & Pemesanan</h3>\n<ul>\n    <li>Warna produk di layar mungkin sedikit berbeda dengan aslinya karena pencahayaan foto.</li>\n    <li>Detail ukuran memiliki toleransi 1-2 cm untuk produk kerajinan tangan/kayu.</li>\n</ul>\n\n<h3>2. Pembayaran & Harga</h3>\n<ul>\n    <li>Harga dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>\n    <li>Pesanan dianggap sah setelah pembayaran DP atau lunas dikonfirmasi.</li>\n</ul>\n\n<h3>3. Pengembalian & Garansi</h3>\n<ul>\n    <li>Klaim kerusakan akibat pengiriman wajib menyertakan Video Unboxing.</li>\n    <li>Kami memberikan garansi struktural (rangka) selama 6 bulan sejak barang diterima.</li>\n</ul>', 1, '', 'Syarat dan ketentuan bertransaksi di APIX Interior. Harap baca sebelum melakukan pemesanan.', '2026-01-09 06:24:14.574', '2026-01-09 07:43:58.655'),
(3, 'Privacy Policy', 'privacy-policy', '<p><strong>Terakhir Diperbarui: 1/9/2026</strong></p>\n<p>APIX Interior (\"kami\") menghargai privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan website kami.</p>\n\n<h3>1. Informasi yang Kami Kumpulkan</h3>\n<p>Kami dapat mengumpulkan informasi seperti Nama, Nomor WhatsApp, dan Alamat ketika Anda menghubungi kami untuk pemesanan.</p>\n\n<h3>2. Penggunaan Informasi</h3>\n<p>Informasi Anda hanya digunakan untuk memproses pesanan, mengatur pengiriman, dan memberikan layanan pelanggan. Kami tidak menjual data Anda ke pihak ketiga.</p>\n\n<h3>3. Keamanan</h3>\n<p>Kami menggunakan standar keamanan industri untuk melindungi website dan database kami dari akses tidak sah.</p>\n\n<h3>4. Hubungi Kami</h3>\n<p>Jika ada pertanyaan mengenai kebijakan ini, silakan hubungi kami melalui halaman Hubungi Kami.</p>', 1, '', 'Kebijakan privasi APIX Interior dalam melindungi data pribadi pengguna website kami.', '2026-01-09 06:24:25.334', '2026-01-09 07:43:51.623');

-- --------------------------------------------------------

--
-- Table structure for table `gambar_upload`
--

CREATE TABLE `gambar_upload` (
  `id` int(11) NOT NULL,
  `url` varchar(191) NOT NULL,
  `title` varchar(191) DEFAULT NULL,
  `tags` varchar(191) NOT NULL DEFAULT '',
  `categoryId` int(11) DEFAULT NULL,
  `subcategoryId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gambar_upload`
--

INSERT INTO `gambar_upload` (`id`, `url`, `title`, `tags`, `categoryId`, `subcategoryId`, `createdAt`) VALUES
(76, '/uploads/kitchen-set-atas-custom-untuk-dapur-per--f3e46b49-ba75-43e6-8f57-88e533f45cc6-1600.webp', 'Kitchen Set Atas Custom untuk Dapur - (per meter)', 'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl', 9, 13, '2025-12-25 20:00:56.665'),
(77, '/uploads/kitchen-set-atas-custom-untuk-dapur-per--6e7a79ff-5f1f-4239-a4d7-a7c989d6883c-1600.webp', 'Kitchen Set Atas Custom untuk Dapur - (per meter)', 'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl', 9, 13, '2025-12-25 20:00:56.825'),
(78, '/uploads/kitchen-set-atas-custom-untuk-dapur-per--80cdb517-daef-45a4-b5d5-c291cb40a3b0-1600.webp', 'Kitchen Set Atas Custom untuk Dapur - (per meter)', 'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl', 9, 13, '2025-12-25 20:00:56.978'),
(79, '/uploads/kabinet-dapur-kitchen-luxury-black-0e114fe2-cfeb-4fa9-a2c9-ddcf0cf92eec-1600.webp', 'Kabinet Dapur kitchen luxury black', 'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl', 9, 13, '2025-12-25 20:05:04.661'),
(80, '/uploads/kabinet-dapur-kitchen-luxury-black-db9d9fda-b9a6-44d0-adcb-af09b3c2bd25-1600.webp', 'Kabinet Dapur kitchen luxury black', 'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl', 9, 13, '2025-12-25 20:05:04.862'),
(81, '/uploads/kabinet-dapur-kitchen-luxury-black-f2a44311-257b-4487-ac20-7be50d7eeb81-1600.webp', 'Kabinet Dapur kitchen luxury black', 'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl', 9, 13, '2025-12-25 20:05:05.016'),
(82, '/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-b46d37e1-74ed-4159-80e4-8f8b6ced32ec-1600.webp', 'Kabinet Dapur Kitchen dinning kayu Tropis', 'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-25 20:51:18.759'),
(83, '/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-99ac022f-0d83-45b7-8a36-8bcca3a07b9c-1600.webp', 'Kabinet Dapur Kitchen dinning kayu Tropis', 'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-25 20:51:18.959'),
(84, '/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-851cdfc7-36ee-4116-ab85-39ffca8de629-1600.webp', 'Kabinet Dapur Kitchen dinning kayu Tropis', 'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-25 20:51:19.146'),
(85, '/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-24f4dbb5-eba4-43fc-b76e-c8e22262cbaa-1600.webp', 'Kabinet Dapur Kitchen dinning kayu Tropis', 'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-25 20:51:19.355'),
(86, '/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-55f10c19-2a9d-4299-9bc5-3981ce72f076-1600.webp', 'Kabinet Dapur Kitchen dinning kayu Tropis', 'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-25 20:51:19.659'),
(87, '/uploads/partisi-kisi-kayu-custom-untuk-dapur-per-45713548-8a47-4b1d-9626-d96080fd2408-1600.webp', 'Partisi Kisi Kayu Custom untuk Dapur (per m²)', 'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per m², kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-25 21:01:45.121'),
(88, '/uploads/partisi-kisi-kayu-custom-untuk-dapur-per-14355f4d-dc20-4e8f-bbc8-530aa4badc0b-1600.webp', 'Partisi Kisi Kayu Custom untuk Dapur (per m²)', 'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per m², kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-25 21:01:45.288'),
(89, '/uploads/meja-makan-set-kayu-tropis-d5f03cff-0c1f-4a4c-830c-5a5e0ce38b41-1600.webp', 'meja makan set kayu tropis', 'partisi kisi kayu, kamar mandi, finishing, surface, jabodetabek, per m², meja makan, kamar, fungsional, ready stock, multipleks, hpl', 9, 14, '2025-12-25 21:02:31.459'),
(90, '/uploads/meja-makan-set-kayu-tropis-077b5801-1154-4a6d-956f-bf5c9545b4cb-1600.webp', 'meja makan set kayu tropis', 'partisi kisi kayu, kamar mandi, finishing, surface, jabodetabek, per m², meja makan, kamar, fungsional, ready stock, multipleks, hpl', 9, 14, '2025-12-25 21:02:31.689'),
(91, '/uploads/dinning-set-meja-makan-hitam-06fe5bf0-149e-498c-9cdc-01cc02dbd036-1600.webp', 'dinning set meja makan hitam', 'meja belajar built-in, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per unit, meja makan, fungsional, ready stock, multipleks, hpl', 9, 14, '2025-12-25 21:03:36.113'),
(92, '/uploads/dinning-set-meja-makan-hitam-cf2f1978-ee04-4f84-b1ba-2c874e84debd-1600.webp', 'dinning set meja makan hitam', 'meja belajar built-in, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per unit, meja makan, fungsional, ready stock, multipleks, hpl', 9, 14, '2025-12-25 21:03:36.284'),
(93, '/uploads/meja-makan-japan-wood-dinning-set-e012a0c1-1e37-4fcb-bbbf-b1059b824a6a-1600.webp', 'Meja Makan Japan Wood dinning set', 'rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl', 9, 14, '2025-12-25 21:04:57.068'),
(94, '/uploads/meja-makan-japan-wood-dinning-set-979e7c89-efdc-4a20-96c5-6a5f1f943d51-1600.webp', 'Meja Makan Japan Wood dinning set', 'rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl', 9, 14, '2025-12-25 21:04:57.242'),
(95, '/uploads/meja-makan-japan-wood-dinning-set-815dd850-7385-4c1b-910b-402a894d752c-1600.webp', 'Meja Makan Japan Wood dinning set', 'rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl', 9, 14, '2025-12-25 21:04:57.439'),
(96, '/uploads/meja-makan-japan-wood-dinning-set-79f6b5a4-6d6a-4cdf-b0ac-62b65721b954-1600.webp', 'Meja Makan Japan Wood dinning set', 'rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl', 9, 14, '2025-12-25 21:04:57.628'),
(97, '/uploads/meja-makan-set-minimalist-white-japan-se-6bfe3de1-f8bc-45a3-aeaa-f4c716a9fa41-1600.webp', 'meja makan set minimalist white japan Seri Sora Pantry', 'pintu kayu solid custom, dapur, item, custom, jabodetabek, per unit, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-25 21:07:32.678'),
(98, '/uploads/meja-makan-set-minimalist-white-japan-se-c24bfe73-9bcd-4d0a-ab10-9287a2e201b5-1600.webp', 'meja makan set minimalist white japan Seri Sora Pantry', 'pintu kayu solid custom, dapur, item, custom, jabodetabek, per unit, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-25 21:07:32.887'),
(99, '/uploads/rak-tv-backdrop-blackstone-2ba1e360-00bd-411a-af25-b92593149ede-1600.webp', 'Rak TV backdrop Blackstone', 'backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl', 9, 15, '2025-12-25 21:32:35.207'),
(100, '/uploads/rak-tv-backdrop-blackstone-54b0b93a-856d-4bd1-a28f-762c10710186-1600.webp', 'Rak TV backdrop Blackstone', 'backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl', 9, 15, '2025-12-25 21:32:35.463'),
(101, '/uploads/japanese-backdrop-tv-359421b8-1196-4ae4-977c-80c38fefa509-1600.webp', 'japanese backdrop tv', 'backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl', 9, 16, '2025-12-25 21:33:22.184'),
(102, '/uploads/japanese-backdrop-tv-e39485bd-ed29-4b2e-960a-c526dc213d4f-1600.webp', 'japanese backdrop tv', 'backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl', 9, 16, '2025-12-25 21:33:22.391'),
(103, '/uploads/backdrop-tv-panel-industrial-garasi-rak--54c03ee1-dc1a-48f2-9cb6-fabbc8b261b6-1600.webp', 'Backdrop TV Panel industrial Garasi - Rak | Jabodetabek', 'backdrop tv panel, carport / garasi, built-in & storage, built-in, carpentry, jabodetabek, per meter, rak tv, fungsional, custom ukuran, multipleks, hpl', 9, 15, '2025-12-25 21:34:18.267'),
(104, '/uploads/backdrop-tv-panel-industrial-garasi-rak--2d81ca7b-76e5-4351-b278-11f1495d3cdb-1600.webp', 'Backdrop TV Panel industrial Garasi - Rak | Jabodetabek', 'backdrop tv panel, carport / garasi, built-in & storage, built-in, carpentry, jabodetabek, per meter, rak tv, fungsional, custom ukuran, multipleks, hpl', 9, 15, '2025-12-25 21:34:18.477'),
(105, '/uploads/lemari-black-minimalist-3bd0a8ee-502a-433e-9c3a-3bfc18ce3c21-1600.webp', 'Lemari Black minimalist', 'lemari, carport / garasi, maintenance, jasa, jabodetabek, per unit, fungsional, ready stock, multipleks, hpl, warna natural, tips penataan', 9, NULL, '2025-12-25 21:34:51.909'),
(106, '/uploads/lemari-black-minimalist-018a0012-f0f9-4ea5-abc9-4b4813943901-1600.webp', 'Lemari Black minimalist', 'lemari, carport / garasi, maintenance, jasa, jabodetabek, per unit, fungsional, ready stock, multipleks, hpl, warna natural, tips penataan', 9, NULL, '2025-12-25 21:34:52.098'),
(134, '/uploads/variasi-k-e59bf52f-a142-4a7e-b7ae-9249da746adb-1600.webp', 'Variasi: k', 'variasi', NULL, NULL, '2025-12-29 07:39:04.003'),
(135, '/uploads/variasi-u-76536874-1de3-47da-89a0-bd9109a68aba-1600.webp', 'Variasi: u', 'variasi', NULL, NULL, '2025-12-29 07:39:08.781'),
(136, '/uploads/variasi-o-73e1ee37-7e4e-4d4f-93f2-65292f7524b6-1600.webp', 'Variasi: o', 'variasi', NULL, NULL, '2025-12-29 07:39:13.634'),
(137, '/uploads/variasi-l-b13a38ab-5337-46b7-82d1-885557b257c7-1600.webp', 'Variasi: l', 'variasi', NULL, NULL, '2025-12-29 07:39:18.372'),
(138, '/uploads/variasi-y-10ab02e9-6704-498c-893e-762973fa9d72-1600.webp', 'Variasi: y', 'variasi', NULL, NULL, '2025-12-29 07:39:23.263'),
(139, '/uploads/variasi-p-bf405c08-dbe6-4b7c-9cb0-f0be6c1b7330-1600.webp', 'Variasi: p', 'variasi', NULL, NULL, '2025-12-29 07:39:28.013'),
(140, '/uploads/variasi-t-8e664ab9-a331-4320-9f2e-ceb6e5a84481-1600.webp', 'Variasi: t', 'variasi', NULL, NULL, '2025-12-29 07:39:33.896'),
(141, '/uploads/variasi-r-da869c31-07ee-4caa-ad2a-8968fcdb1c35-1600.webp', 'Variasi: r', 'variasi', NULL, NULL, '2025-12-29 07:39:46.312'),
(142, '/uploads/variasi-f-84194af8-75a0-48df-a4d8-660ac000df91-1600.webp', 'Variasi: f', 'variasi', NULL, NULL, '2025-12-29 07:39:51.009'),
(143, '/uploads/variasi-b-9a0ec843-3606-4b5b-abab-690b951d890c-1600.webp', 'Variasi: b', 'variasi', NULL, NULL, '2025-12-29 07:39:56.392'),
(144, '/uploads/kabinet-dapur-kitchen-set-marble-6278070a-3ad0-4cb8-b7df-b432ea142c38-1600.webp', 'Kabinet Dapur kitchen set marble', 'kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-29 07:41:03.043'),
(145, '/uploads/kabinet-dapur-kitchen-set-marble-e50a0af7-05bd-4407-80e0-165407370a9c-1600.webp', 'Kabinet Dapur kitchen set marble', 'kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-29 07:41:03.164'),
(146, '/uploads/kabinet-dapur-kitchen-set-marble-bdac85e4-dd88-4a2d-a036-df395ff74b89-1600.webp', 'Kabinet Dapur kitchen set marble', 'kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-29 07:41:03.282'),
(147, '/uploads/kabinet-dapur-kitchen-set-marble-96fcc58e-c876-42e3-91af-c80f102e4eda-1600.webp', 'Kabinet Dapur kitchen set marble', 'kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-29 07:41:03.398'),
(148, '/uploads/kabinet-dapur-kitchen-set-marble-1ab43560-0866-4800-a528-e002a33e161f-1600.webp', 'Kabinet Dapur kitchen set marble', 'kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 9, 13, '2025-12-29 07:41:03.508'),
(149, '/uploads/cat-dinding-rapi-untuk-area-masuk-foyer--fc609f33-338f-4ac2-8ad8-9012b19dea01-1600.webp', 'Cat Dinding Rapi untuk Area Masuk / Foyer | Jabodetabek', 'cat dinding, area masuk / foyer, finishing, surface, jabodetabek, per unit, fungsional, ready stock, multipleks, hpl, warna natural, tips penataan', 9, NULL, '2025-12-30 02:14:56.557'),
(155, '/uploads/gambar_upload/1767694966612-277bc6abeaac7-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-06 10:22:46.987'),
(156, '/uploads/gambar_upload/1767695212907-d94c49f705c1c8-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-06 10:26:53.246'),
(157, '/uploads/gambar_upload/1767695491859-6405b5565ad9e8-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-06 10:31:32.177'),
(158, '/uploads/gambar_upload/1767695536073-0c8cb738f8397-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-06 10:32:16.447'),
(159, '/uploads/gambar_upload/1767695576660-0abe1ac46e59d8-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-06 10:32:56.993'),
(160, '/uploads/gambar_upload/1767695605886-1ecfa431fa15a8-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-06 10:33:26.244'),
(161, '/uploads/gambar_upload/1767696484882-ed1713bf8ccd48-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-06 10:48:05.237'),
(162, '/uploads/gambar_upload/1767749355537-54a2ada215d07-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-07 01:29:15.919'),
(163, '/uploads/gambar_upload/1767749518730-8b1d7b0e42b268-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-07 01:31:59.088'),
(164, '/uploads/gambar_upload/1767749597347-e461f82564362-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-07 01:33:17.723'),
(165, '/uploads/gambar_upload/1767749701999-734c68ea571a1-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-07 01:35:02.344'),
(166, '/uploads/gambar_upload/1767749706513-f4ee59dfaf7c18-untitled-design-1png.webp', 'untitled-design-1png', '', NULL, NULL, '2026-01-07 01:35:06.847'),
(167, '/uploads/gambar_upload/1767750766321-c47926f38865b8-untitled-design-2png.webp', 'untitled-design-2png', '', NULL, NULL, '2026-01-07 01:52:46.594'),
(168, '/uploads/gambar_upload/1767751105471-4780fddfbf2d78-untitled-design-2png.webp', 'untitled-design-2png', '', NULL, NULL, '2026-01-07 01:58:25.888'),
(169, '/uploads/gambar_upload/1767751760524-a68af2fc7add3-untitled-design-3jpg.webp', 'untitled-design-3jpg', '', NULL, NULL, '2026-01-07 02:09:20.873'),
(170, '/uploads/gambar_upload/1767752238925-655f83be42cd98-untitled-design-3jpg.webp', 'untitled-design-3jpg', '', NULL, NULL, '2026-01-07 02:17:19.277'),
(171, '/uploads/gambar_upload/1767752242706-06a5cb0108a2a8-untitled-design-3jpg.webp', 'untitled-design-3jpg', '', NULL, NULL, '2026-01-07 02:17:23.077'),
(172, '/uploads/gambar_upload/1767752246349-c428674fa43c18-untitled-design-3jpg.webp', 'untitled-design-3jpg', '', NULL, NULL, '2026-01-07 02:17:26.676'),
(173, '/uploads/gambar_upload/1767752250490-ae2540d9511bc-untitled-design-3jpg.webp', 'untitled-design-3jpg', '', NULL, NULL, '2026-01-07 02:17:30.836'),
(174, '/uploads/gambar_upload/1767753268258-53b6ad1871278-untitled-design-2png.webp', 'untitled-design-2png', '', NULL, NULL, '2026-01-07 02:34:28.715'),
(175, '/uploads/gambar_upload/1767753272386-1985d191feb0c-untitled-design-2png.webp', 'untitled-design-2png', '', NULL, NULL, '2026-01-07 02:34:32.803'),
(176, '/uploads/gambar_upload/1767753276726-80858d956da8-untitled-design-2png.webp', 'untitled-design-2png', '', NULL, NULL, '2026-01-07 02:34:37.152'),
(177, '/uploads/gambar_upload/1767753280320-b516c4582da9f8-untitled-design-2png.webp', 'untitled-design-2png', '', NULL, NULL, '2026-01-07 02:34:40.736'),
(178, '/uploads/gambar_upload/1767753284502-ae9f013618a438-untitled-design-2png.webp', 'untitled-design-2png', '', NULL, NULL, '2026-01-07 02:34:44.904'),
(179, '/uploads/gambar_upload/1767753287921-17130e19358d3-untitled-design-2png.webp', 'untitled-design-2png', '', NULL, NULL, '2026-01-07 02:34:48.351'),
(180, '/uploads/gambar_upload/1767757065077-e41b9795d190a8-untitled-design-3jpg.webp', 'untitled-design-3jpg', '', NULL, NULL, '2026-01-07 03:37:45.427'),
(181, '/uploads/gambar_upload/1767757069980-eca2965aca08d8-untitled-design-3jpg.webp', 'untitled-design-3jpg', '', NULL, NULL, '2026-01-07 03:37:50.347'),
(182, '/uploads/gambar_upload/1767757074583-b229717520e9b8-untitled-design-3jpg.webp', 'untitled-design-3jpg', '', NULL, NULL, '2026-01-07 03:37:54.891'),
(183, '/uploads/gambar_upload/1767778637851-f398f2be70a6a-kitchen-setpng.png', 'kitchen-setpng', '', NULL, NULL, '2026-01-07 09:37:17.975'),
(184, '/uploads/gambar_upload/1767778649831-4ddbcf40ef184-book-shelfpng.png', 'book-shelfpng', '', NULL, NULL, '2026-01-07 09:37:29.853'),
(185, '/uploads/gambar_upload/1767778825615-901189edb7c22-living-roompng.png', 'living-roompng', '', NULL, NULL, '2026-01-07 09:40:25.933'),
(186, '/uploads/gambar_upload/1767778826194-2fc0565a6e34e-dining-roompng.png', 'dining-roompng', '', NULL, NULL, '2026-01-07 09:40:26.214'),
(187, '/uploads/gambar_upload/1767778826413-dc8be4c6b4c92-bed-roompng.png', 'bed-roompng', '', NULL, NULL, '2026-01-07 09:40:26.436'),
(188, '/uploads/gambar_upload/1767778826608-8a28caf2c603f8-rakpng.png', 'rakpng', '', NULL, NULL, '2026-01-07 09:40:26.629'),
(189, '/uploads/gambar_upload/1767778826803-023a68a932dbd8-lemaripng.png', 'lemaripng', '', NULL, NULL, '2026-01-07 09:40:26.827'),
(190, '/uploads/gambar_upload/1767778827015-63e193d7e6eb08-work-roompng.png', 'work-roompng', '', NULL, NULL, '2026-01-07 09:40:27.037'),
(191, '/uploads/gambar_upload/1768143970318-88c06914629578-1920-x-1080.png', '1920 x 1080', '', NULL, NULL, '2026-01-11 15:06:10.553');

-- --------------------------------------------------------

--
-- Table structure for table `homepagesection`
--

CREATE TABLE `homepagesection` (
  `id` int(11) NOT NULL,
  `type` enum('HERO','TEXT_SECTION','CATEGORY_GRID','CATEGORY_GRID_COMMERCE','PRODUCT_CAROUSEL','PRODUCT_LISTING','HIGHLIGHT_COLLECTION','ROOM_CATEGORY','GALLERY','BRANCHES','CONTACT','SOCIAL','CUSTOM_PROMO','FOOTER') NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `description` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `homepagesectiondraft`
--

CREATE TABLE `homepagesectiondraft` (
  `id` int(11) NOT NULL,
  `type` enum('HERO','TEXT_SECTION','CATEGORY_GRID','CATEGORY_GRID_COMMERCE','PRODUCT_CAROUSEL','PRODUCT_LISTING','HIGHLIGHT_COLLECTION','ROOM_CATEGORY','GALLERY','BRANCHES','CONTACT','SOCIAL','CUSTOM_PROMO','FOOTER') NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `heroContent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`heroContent`)),
  `heroCtaHref` varchar(191) DEFAULT NULL,
  `heroCtaLabel` varchar(191) DEFAULT NULL,
  `heroHeadline` varchar(191) DEFAULT NULL,
  `heroSubheadline` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `homepagesectiondraft`
--

INSERT INTO `homepagesectiondraft` (`id`, `type`, `title`, `slug`, `enabled`, `sortOrder`, `config`, `createdAt`, `updatedAt`, `description`, `heroContent`, `heroCtaHref`, `heroCtaLabel`, `heroHeadline`, `heroSubheadline`) VALUES
(166, 'CUSTOM_PROMO', '__THEME_META__', '__theme_meta__theme_1', 0, 0, '{\"__isThemeMeta\":true,\"__themeKey\":\"theme_1\",\"themeName\":\"apixinterior\",\"backgroundTheme\":\"GOLD_NAVY\",\"navbarTheme\":\"NAVY_GOLD\"}', '2025-12-21 18:59:06.840', '2026-01-11 20:52:13.607', NULL, NULL, NULL, NULL, NULL, NULL),
(292, 'CUSTOM_PROMO', '__THEME_META__', '__theme_meta__theme_mk94rd14_cc7jb', 0, 0, '{\"__isThemeMeta\":true,\"__themeKey\":\"theme_mk94rd14_cc7jb\",\"themeName\":\"Copy dari apixinterior\",\"backgroundTheme\":\"WHITE_GOLD\",\"navbarTheme\":\"NAVY_WHITE\"}', '2026-01-11 02:44:07.484', '2026-01-11 04:46:10.461', NULL, NULL, NULL, NULL, NULL, NULL),
(302, 'CUSTOM_PROMO', '__THEME_META__', '__theme_meta__theme_mk96kub5_2h4b0', 0, 0, '{\"__isThemeMeta\":true,\"__themeKey\":\"theme_mk96kub5_2h4b0\",\"themeName\":\"Theme 3\",\"navbarTheme\":\"GOLD_NAVY\"}', '2026-01-11 03:35:02.517', '2026-01-11 04:46:28.784', NULL, NULL, NULL, NULL, NULL, NULL),
(456, 'HERO', '', 'hero', 1, 1, '{\"headline\":\"Ruang Modern Minimalis\",\"subheadline\":\"Paket interior ramping, hemat waktu, siap kirim cepat.\",\"ctaLabel\":\"Lihat Lookbook\",\"ctaHref\":\"/lookbook\",\"eyebrow\":\"Lookbook Pilihan\",\"imageId\":78,\"__themeKey\":\"theme_1\",\"heroImageId\":78,\"badges\":[\"Ready Stock\",\"Custom ukuran\",\"Desain Gratis\",\"Cicilan 0%\"],\"highlights\":[\"Pemasangan kilat\",\"Gratis konsultasi desainer\",\"Finishing premium\",\"Garansi 30 hari\",\"Pengiriman terjadwal\",\"Bisa COD\"],\"trustChips\":[\"COD tersedia\",\"Garansi produk\",\"CS 7x24\"],\"miniInfo\":[{\"title\":\"4.9\",\"desc\":\"Ulasan puas\"},{\"title\":\"900+\",\"desc\":\"Item siap kirim\"},{\"title\":\"Express\",\"desc\":\"Kirim & pasang\"}],\"floatLookbookTitle\":\"Ide Minggu Ini\",\"floatLookbookSubtitle\":\"Mix & match untuk ruang keluarga\",\"floatPromoTitle\":\"Voucher\",\"floatPromoText\":\"Diskon 10% khusus minggu ini\",\"heroContent\":{\"eyebrow\":\"Lookbook Pilihan\",\"badges\":[\"Ready Stock\",\"Custom ukuran\",\"Desain Gratis\",\"Cicilan 0%\"],\"highlights\":[\"Pemasangan kilat\",\"Gratis konsultasi desainer\",\"Finishing premium\",\"Garansi 30 hari\",\"Pengiriman terjadwal\",\"Bisa COD\"],\"trustChips\":[\"COD tersedia\",\"Garansi produk\",\"CS 7x24\"],\"miniInfo\":[{\"title\":\"4.9\",\"desc\":\"Ulasan puas\"},{\"title\":\"900+\",\"desc\":\"Item siap kirim\"},{\"title\":\"Express\",\"desc\":\"Kirim & pasang\"}],\"floatLookbookTitle\":\"Ide Minggu Ini\",\"floatLookbookSubtitle\":\"Mix & match untuk ruang keluarga\",\"floatPromoTitle\":\"Voucher\",\"floatPromoText\":\"Diskon 10% khusus minggu ini\"}}', '2026-01-11 15:28:49.855', '2026-01-12 07:33:35.516', NULL, '{\"eyebrow\":\"Lookbook Pilihan\",\"badges\":[\"Ready Stock\",\"Custom ukuran\",\"Desain Gratis\",\"Cicilan 0%\"],\"highlights\":[\"Pemasangan kilat\",\"Gratis konsultasi desainer\",\"Finishing premium\",\"Garansi 30 hari\",\"Pengiriman terjadwal\",\"Bisa COD\"],\"trustChips\":[\"COD tersedia\",\"Garansi produk\",\"CS 7x24\"],\"miniInfo\":[{\"title\":\"4.9\",\"desc\":\"Ulasan puas\"},{\"title\":\"900+\",\"desc\":\"Item siap kirim\"},{\"title\":\"Express\",\"desc\":\"Kirim & pasang\"}],\"floatLookbookTitle\":\"Ide Minggu Ini\",\"floatLookbookSubtitle\":\"Mix & match untuk ruang keluarga\",\"floatPromoTitle\":\"Voucher\",\"floatPromoText\":\"Diskon 10% khusus minggu ini\"}', '/lookbook', 'Lihat Lookbook', 'Ruang Modern Minimalis', 'Paket interior ramping, hemat waktu, siap kirim cepat.'),
(457, 'CATEGORY_GRID_COMMERCE', '', 'grid-category-commerce', 1, 4, '{\"sectionTheme\":\"WHITE_GOLD\",\"layout\":{\"columns\":4,\"tabletColumns\":3,\"mobileColumns\":2,\"maxItems\":60,\"mode\":\"clean\"},\"items\":[{\"type\":\"category\",\"kategoriId\":81,\"slug\":\"office-set-dapur\",\"label\":\"Office Set Dapur\",\"imageId\":183,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":82,\"slug\":\"bangunan-meja-makan\",\"label\":\"Meja Makan\",\"imageId\":186,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":83,\"slug\":\"furnitur-dapur-interior\",\"label\":\"Furnitur Dapur Interior\",\"imageId\":189,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":84,\"slug\":\"mebel-rak-tv\",\"label\":\"Mebel Rak Tv\",\"imageId\":184,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":87,\"slug\":\"rak-dapur-rumah\",\"label\":\"Rak Dapur Rumah\",\"imageId\":188,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":89,\"slug\":\"bangunan-promo\",\"label\":\"Bangunan Promo\",\"imageId\":190,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":90,\"slug\":\"ruang-tamu-mebel\",\"label\":\"Ruang Tamu Mebel\",\"imageId\":185,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":91,\"slug\":\"mebel-ruang-makan\",\"label\":\"Mebel Ruang Makan\",\"imageId\":186,\"tabId\":\"tab-1768166307223\"}],\"tabs\":[{\"id\":\"tab-1768166307223\",\"label\":\"REKOMENDASI\"}],\"__themeKey\":\"theme_1\"}', '2026-01-11 15:28:49.855', '2026-01-13 06:41:03.333', NULL, NULL, NULL, NULL, NULL, NULL),
(459, 'PRODUCT_CAROUSEL', '', 'carousel-produk', 1, 5, '{\"sectionTheme\":\"NAVY_GOLD\",\"title\":\"\",\"description\":\"\",\"productIds\":[37,36,35,34,33,32,31,30,29,28,27,26],\"showPrice\":true,\"showCta\":true,\"sectionBgTheme\":\"WHITE\",\"__themeKey\":\"theme_1\",\"slug\":\"carousel-produk\"}', '2026-01-11 15:28:49.855', '2026-01-12 07:33:35.516', NULL, NULL, NULL, NULL, NULL, NULL),
(460, 'CATEGORY_GRID', '', 'kategori-produk', 1, 3, '{\"sectionTheme\":\"NAVY_WHITE\",\"sectionBgTheme\":\"WHITE\",\"titleTextColor\":\"GOLD\",\"layout\":{\"columns\":3,\"maxItems\":6},\"items\":[{\"kategoriId\":81,\"coverImageId\":183},{\"kategoriId\":82,\"coverImageId\":null},{\"kategoriId\":83,\"coverImageId\":null},{\"kategoriId\":84,\"coverImageId\":null},{\"kategoriId\":87,\"coverImageId\":null},{\"kategoriId\":89,\"coverImageId\":null}],\"__themeKey\":\"theme_1\",\"title\":\"\",\"slug\":\"kategori-produk\"}', '2026-01-11 15:28:49.855', '2026-01-12 07:55:08.372', NULL, NULL, NULL, NULL, NULL, NULL),
(461, 'FOOTER', 'k', 'footer-contact', 1, 13, '{\"whatsapp\":\"\",\"email\":\"\",\"address\":\"\",\"instagram\":\"\",\"facebook\":\"\",\"menuLinks\":[{\"label\":\"FAQ\",\"url\":\"/faq\"},{\"label\":\"Syarat & Ketentuan\",\"url\":\"/terms\"},{\"label\":\"Privacy Policy\",\"url\":\"/privacy-policy\"},{\"label\":\"Hubungi Kami\",\"url\":\"/hubungi\"}],\"footerTags\":[{\"label\":\"Meja TV Minimalis\",\"url\":\"\"},{\"label\":\"Interior Design Jakarta\",\"url\":\"\"},{\"label\":\"Pusat Meja Makan\",\"url\":\"\"},{\"label\":\"Agen Kursi Teras\",\"url\":\"\"},{\"label\":\"Distributor Sofa Bed\",\"url\":\"\"},{\"label\":\"Dipan Minimalis\",\"url\":\"\"},{\"label\":\"Backdrop TV Kayu Jati\",\"url\":\"\"},{\"label\":\"Lemari Pakaian Furnitur\",\"url\":\"\"},{\"label\":\"Mebel Modern\",\"url\":\"\"},{\"label\":\"Meja Makan Interior\",\"url\":\"\"},{\"label\":\"Interior Murah\",\"url\":\"\"},{\"label\":\"Partisi Furniture\",\"url\":\"\"},{\"label\":\"Lemari Hias Mebel\",\"url\":\"\"},{\"label\":\"Lemari Pakaian\",\"url\":\"\"},{\"label\":\"Toko Meja TV\",\"url\":\"\"},{\"label\":\"Furniture Kantor Murah\",\"url\":\"\"},{\"label\":\"Partisi Mewah\",\"url\":\"\"},{\"label\":\"Sofa Bed Furnitur\",\"url\":\"\"},{\"label\":\"Kursi Kantor Furnitur\",\"url\":\"\"},{\"label\":\"Furniture Modern\",\"url\":\"\"},{\"label\":\"Kursi Teras Minimalis\",\"url\":\"\"},{\"label\":\"Rak Sepatu Kayu Jati\",\"url\":\"\"},{\"label\":\"Toko Tempat Tidur\",\"url\":\"\"},{\"label\":\"Toko Sofa\",\"url\":\"\"},{\"label\":\"Kitchen Set Furniture\",\"url\":\"\"},{\"label\":\"Kitchen Set Murah\",\"url\":\"\"},{\"label\":\"Mebel Kayu Jepara\",\"url\":\"\"},{\"label\":\"Distributor Rak Sepatu\",\"url\":\"\"},{\"label\":\"Sofa Mebel\",\"url\":\"\"},{\"label\":\"Pusat Lemari Pakaian\",\"url\":\"\"},{\"label\":\"Tempat Tidur Furnitur\",\"url\":\"\"},{\"label\":\"Kasur Mebel\",\"url\":\"\"},{\"label\":\"Kursi Kantor Modern\",\"url\":\"\"},{\"label\":\"Toko Kitchen Set\",\"url\":\"\"},{\"label\":\"Dipan Furniture\",\"url\":\"\"},{\"label\":\"Rak Sepatu Furniture\",\"url\":\"\"},{\"label\":\"Kursi Teras Mebel\",\"url\":\"\"},{\"label\":\"Meja Belajar Furniture\",\"url\":\"\"},{\"label\":\"Sofa Bed Kayu Jati\",\"url\":\"\"},{\"label\":\"Meja TV Furniture\",\"url\":\"\"},{\"label\":\"Distributor Kursi Kantor\",\"url\":\"\"},{\"label\":\"Lemari Hias Terbaru\",\"url\":\"\"},{\"label\":\"Tempat Tidur Minimalis\",\"url\":\"\"},{\"label\":\"Paket Seserahan Furniture\",\"url\":\"\"},{\"label\":\"Jasa Interior Rumah\",\"url\":\"\"},{\"label\":\"Kasur Murah\",\"url\":\"\"},{\"label\":\"Meja Makan Estetik\",\"url\":\"\"},{\"label\":\"Toko Mebel Terdekat\",\"url\":\"\"}],\"useGlobalContact\":true,\"useGlobalSocial\":true,\"__themeKey\":\"theme_1\",\"title\":\"k\",\"slug\":\"footer-contact\"}', '2026-01-11 15:31:25.691', '2026-01-12 07:36:35.036', NULL, NULL, NULL, NULL, NULL, NULL),
(462, 'BRANCHES', '', 'cabang', 1, 9, '{\"sectionTheme\":\"WHITE_GOLD\",\"branchIds\":[7],\"layout\":\"carousel\",\"__themeKey\":\"theme_1\",\"title\":\"\",\"slug\":\"cabang\"}', '2026-01-11 15:31:56.611', '2026-01-12 07:33:35.516', NULL, NULL, NULL, NULL, NULL, NULL),
(463, 'CONTACT', '', 'hubungi', 1, 10, '{\"hubungiIds\":[2],\"buttonLabels\":{\"2\":\"HUBUNGI\"},\"mode\":\"SPLIT_IMAGE_STACK\",\"showImage\":true,\"imageId\":97,\"headerText\":\"Hubungi apix interior: Desain Interior, Produksi, & Instalasi\",\"bodyText\":\"Mulai dari konsep sampai instalasi, apix interior bantu urus interiornya. Cocok untuk rumah, apartemen, hingga kantordengan finishing rapi. Hubungi kami lewat kontak yang kamu pilih di bawah. Yuk mulai konsultasi!\",\"__themeKey\":\"theme_1\",\"title\":\"\",\"slug\":\"hubungi\"}', '2026-01-11 15:32:07.615', '2026-01-12 07:33:35.516', NULL, NULL, NULL, NULL, NULL, NULL),
(464, 'PRODUCT_LISTING', '', 'produk', 1, 6, '{\"sectionTheme\":\"GOLD_WHITE\",\"title\":\"\",\"productIds\":[37,36,35,34,33,32,31,30,29,28,27,26,25,24],\"sectionBgTheme\":\"WHITE\",\"__themeKey\":\"theme_1\",\"slug\":\"produk\"}', '2026-01-11 15:32:18.545', '2026-01-12 07:33:35.516', NULL, NULL, NULL, NULL, NULL, NULL),
(467, 'SOCIAL', 'm', 'social', 1, 11, '{\"selected\":[{\"iconKey\":\"instagram\",\"nama\":\"Instagram\"},{\"iconKey\":\"whatsapp\",\"nama\":\"WhatsApp\"},{\"iconKey\":\"tiktok\",\"nama\":\"TikTok\"}],\"display\":{\"iconsOnly\":true},\"__themeKey\":\"theme_1\",\"title\":\"m\",\"slug\":\"social\"}', '2026-01-11 16:27:32.013', '2026-01-12 07:33:35.516', NULL, NULL, NULL, NULL, NULL, NULL),
(474, 'TEXT_SECTION', 'TEXT SECTION', 'text-section', 1, 2, '{\"text\":\"\",\"mode\":\"body\",\"align\":\"left\",\"width\":\"normal\",\"sectionTheme\":\"FOLLOW_NAVBAR\",\"blocks\":[{\"mode\":\"heading\",\"text\":\"TEXT SECTION\"},{\"mode\":\"body\",\"text\":\"TEXT SECTION ini dibuat untuk kebutuhan furnitur rumah dan office. Fokus pada kenyamanan, estetika, serta efisiensi ruang untuk mebel modern.\"}],\"__themeKey\":\"theme_1\",\"title\":\"TEXT SECTION\",\"slug\":\"text-section\"}', '2026-01-11 22:18:52.317', '2026-01-12 07:33:36.916', NULL, NULL, NULL, NULL, NULL, NULL),
(475, 'HIGHLIGHT_COLLECTION', 'Koleksi Pilihan', 'koleksi-pilihan', 1, 7, '{\"mode\":\"products\",\"title\":\"Koleksi Pilihan\",\"productIds\":[37,35,34,30,31,32,33],\"layout\":\"FEATURED_LEFT\",\"heroImageId\":184,\"badgeText\":\"\",\"headline\":\"Koleksi Pilihan\",\"description\":\"Temukan produk terbaik kami yang dikurasi khusus untuk keindahan ruangan Anda.\",\"ctaText\":\"Lihat Semua\",\"ctaHref\":\"/kategori\",\"items\":[{\"type\":\"product\",\"refId\":37,\"enabled\":true},{\"type\":\"product\",\"refId\":35,\"enabled\":true},{\"type\":\"product\",\"refId\":34,\"enabled\":true},{\"type\":\"product\",\"refId\":30,\"enabled\":true},{\"type\":\"product\",\"refId\":31,\"enabled\":true},{\"type\":\"product\",\"refId\":32,\"enabled\":true},{\"type\":\"product\",\"refId\":33,\"enabled\":true}],\"__themeKey\":\"theme_1\",\"slug\":\"koleksi-pilihan\"}', '2026-01-11 22:19:47.592', '2026-01-12 07:33:35.516', NULL, NULL, NULL, NULL, NULL, NULL),
(476, 'ROOM_CATEGORY', 'KATEGORI RUANGAN', 'kategori-ruangan', 1, 8, '{\"cards\":[{\"key\":\"ruang_keluarga_tamu\",\"title\":\"Ruang Keluarga & Tamu\",\"description\":\"\",\"badge\":\"\",\"kategoriId\":null,\"imageId\":188},{\"key\":\"ruang_makan_dapur\",\"title\":\"Ruang Makan & Dapur\",\"description\":\"\",\"badge\":\"\",\"kategoriId\":null,\"imageId\":191},{\"key\":\"kamar_tidur\",\"title\":\"Kamar Tidur\",\"description\":\"\",\"badge\":\"\",\"kategoriId\":81,\"imageId\":187},{\"key\":\"room_0f9dbf71da91\",\"title\":\"Meja Makan\",\"description\":\"\",\"badge\":\"\",\"kategoriId\":90,\"imageId\":186}],\"__themeKey\":\"theme_1\",\"title\":\"KATEGORI RUANGAN\",\"slug\":\"kategori-ruangan\"}', '2026-01-11 22:20:26.874', '2026-01-12 07:33:35.516', NULL, NULL, NULL, NULL, NULL, NULL),
(477, 'CUSTOM_PROMO', 'CUSTOM PROMO', 'promo', 1, 12, '{\"layout\":\"carousel\",\"sectionBgTheme\":\"FOLLOW_NAVBAR\",\"voucherImageIds\":[182,181,180],\"voucherLinks\":{\"180\":\"category:89\",\"181\":\"category:84\",\"182\":\"category:90\"},\"__themeKey\":\"theme_1\",\"title\":\"CUSTOM PROMO\",\"slug\":\"promo\"}', '2026-01-11 22:21:07.935', '2026-01-12 07:33:35.516', NULL, NULL, NULL, NULL, NULL, NULL),
(491, 'HERO', 'Active Theme Marker', '__active_theme__', 1, -1000, '{\"__isActiveTheme\":true,\"activeThemeKey\":\"theme_1\"}', '2026-01-12 07:50:02.745', '2026-01-12 07:50:02.745', NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `homepagesectionitem`
--

CREATE TABLE `homepagesectionitem` (
  `id` int(11) NOT NULL,
  `homepageSectionId` int(11) NOT NULL,
  `type` enum('MENU_ITEM','BANNER_SLIDE','CATEGORY_ITEM') NOT NULL,
  `label` varchar(191) DEFAULT NULL,
  `subtitle` varchar(191) DEFAULT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  `url` varchar(191) DEFAULT NULL,
  `priceText` varchar(191) DEFAULT NULL,
  `promoLabel` varchar(191) DEFAULT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `homepagesectionpublished`
--

CREATE TABLE `homepagesectionpublished` (
  `id` int(11) NOT NULL,
  `type` enum('HERO','TEXT_SECTION','CATEGORY_GRID','CATEGORY_GRID_COMMERCE','PRODUCT_CAROUSEL','PRODUCT_LISTING','HIGHLIGHT_COLLECTION','ROOM_CATEGORY','GALLERY','BRANCHES','CONTACT','SOCIAL','CUSTOM_PROMO','FOOTER') NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `heroContent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`heroContent`)),
  `heroCtaHref` varchar(191) DEFAULT NULL,
  `heroCtaLabel` varchar(191) DEFAULT NULL,
  `heroHeadline` varchar(191) DEFAULT NULL,
  `heroSubheadline` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `homepagesectionpublished`
--

INSERT INTO `homepagesectionpublished` (`id`, `type`, `title`, `slug`, `enabled`, `sortOrder`, `config`, `createdAt`, `updatedAt`, `description`, `heroContent`, `heroCtaHref`, `heroCtaLabel`, `heroHeadline`, `heroSubheadline`) VALUES
(1299, 'CUSTOM_PROMO', '__THEME_META__', '__theme_meta__theme_1', 0, 0, '{\"__isThemeMeta\":true,\"__themeKey\":\"theme_1\",\"themeName\":\"apixinterior\",\"backgroundTheme\":\"GOLD_NAVY\",\"navbarTheme\":\"NAVY_GOLD\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1300, 'HERO', '', 'hero', 1, 1, '{\"headline\":\"Ruang Modern Minimalis\",\"subheadline\":\"Paket interior ramping, hemat waktu, siap kirim cepat.\",\"ctaLabel\":\"Lihat Lookbook\",\"ctaHref\":\"/lookbook\",\"eyebrow\":\"Lookbook Pilihan\",\"imageId\":78,\"__themeKey\":\"theme_1\",\"heroImageId\":78,\"badges\":[\"Ready Stock\",\"Custom ukuran\",\"Desain Gratis\",\"Cicilan 0%\"],\"highlights\":[\"Pemasangan kilat\",\"Gratis konsultasi desainer\",\"Finishing premium\",\"Garansi 30 hari\",\"Pengiriman terjadwal\",\"Bisa COD\"],\"trustChips\":[\"COD tersedia\",\"Garansi produk\",\"CS 7x24\"],\"miniInfo\":[{\"title\":\"4.9\",\"desc\":\"Ulasan puas\"},{\"title\":\"900+\",\"desc\":\"Item siap kirim\"},{\"title\":\"Express\",\"desc\":\"Kirim & pasang\"}],\"floatLookbookTitle\":\"Ide Minggu Ini\",\"floatLookbookSubtitle\":\"Mix & match untuk ruang keluarga\",\"floatPromoTitle\":\"Voucher\",\"floatPromoText\":\"Diskon 10% khusus minggu ini\",\"heroContent\":{\"eyebrow\":\"Lookbook Pilihan\",\"badges\":[\"Ready Stock\",\"Custom ukuran\",\"Desain Gratis\",\"Cicilan 0%\"],\"highlights\":[\"Pemasangan kilat\",\"Gratis konsultasi desainer\",\"Finishing premium\",\"Garansi 30 hari\",\"Pengiriman terjadwal\",\"Bisa COD\"],\"trustChips\":[\"COD tersedia\",\"Garansi produk\",\"CS 7x24\"],\"miniInfo\":[{\"title\":\"4.9\",\"desc\":\"Ulasan puas\"},{\"title\":\"900+\",\"desc\":\"Item siap kirim\"},{\"title\":\"Express\",\"desc\":\"Kirim & pasang\"}],\"floatLookbookTitle\":\"Ide Minggu Ini\",\"floatLookbookSubtitle\":\"Mix & match untuk ruang keluarga\",\"floatPromoTitle\":\"Voucher\",\"floatPromoText\":\"Diskon 10% khusus minggu ini\"}}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1301, 'TEXT_SECTION', 'TEXT SECTION', 'text-section', 1, 2, '{\"text\":\"\",\"mode\":\"body\",\"align\":\"left\",\"width\":\"normal\",\"sectionTheme\":\"FOLLOW_NAVBAR\",\"blocks\":[{\"mode\":\"heading\",\"text\":\"TEXT SECTION\"},{\"mode\":\"body\",\"text\":\"TEXT SECTION ini dibuat untuk kebutuhan furnitur rumah dan office. Fokus pada kenyamanan, estetika, serta efisiensi ruang untuk mebel modern.\"}],\"__themeKey\":\"theme_1\",\"title\":\"TEXT SECTION\",\"slug\":\"text-section\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1302, 'CATEGORY_GRID', '', 'kategori-produk', 1, 3, '{\"sectionTheme\":\"NAVY_WHITE\",\"sectionBgTheme\":\"WHITE\",\"titleTextColor\":\"GOLD\",\"layout\":{\"columns\":3,\"maxItems\":6},\"items\":[{\"kategoriId\":81,\"coverImageId\":183},{\"kategoriId\":82,\"coverImageId\":null},{\"kategoriId\":83,\"coverImageId\":null},{\"kategoriId\":84,\"coverImageId\":null},{\"kategoriId\":87,\"coverImageId\":null},{\"kategoriId\":89,\"coverImageId\":null}],\"__themeKey\":\"theme_1\",\"title\":\"\",\"slug\":\"kategori-produk\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1303, 'CATEGORY_GRID_COMMERCE', '', 'grid-category-commerce', 1, 4, '{\"sectionTheme\":\"NAVY_WHITE\",\"sectionBgTheme\":\"WHITE\",\"description\":\"\",\"layout\":{\"columns\":4,\"tabletColumns\":3,\"mobileColumns\":2,\"maxItems\":16,\"mode\":\"clean\"},\"items\":[{\"type\":\"category\",\"kategoriId\":81,\"slug\":\"office-set-dapur\",\"label\":\"Office Set Dapur\",\"imageId\":183,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":82,\"slug\":\"bangunan-meja-makan\",\"label\":\"Meja Makan\",\"imageId\":186,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":83,\"slug\":\"furnitur-dapur-interior\",\"label\":\"Furnitur Dapur Interior\",\"imageId\":189,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":84,\"slug\":\"mebel-rak-tv\",\"label\":\"Mebel Rak Tv\",\"imageId\":184,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":87,\"slug\":\"rak-dapur-rumah\",\"label\":\"Rak Dapur Rumah\",\"imageId\":188,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":89,\"slug\":\"bangunan-promo\",\"label\":\"Bangunan Promo\",\"imageId\":190,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":90,\"slug\":\"ruang-tamu-mebel\",\"label\":\"Ruang Tamu Mebel\",\"imageId\":185,\"tabId\":\"tab-1768166307223\"},{\"type\":\"category\",\"kategoriId\":91,\"slug\":\"mebel-ruang-makan\",\"label\":\"Mebel Ruang Makan\",\"imageId\":186,\"tabId\":\"tab-1768166307223\"}],\"tabs\":[{\"id\":\"tab-1768166307223\",\"label\":\"REKOMENDASI\"}],\"__themeKey\":\"theme_1\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1304, 'PRODUCT_CAROUSEL', '', 'carousel-produk', 1, 5, '{\"sectionTheme\":\"NAVY_GOLD\",\"title\":\"\",\"description\":\"\",\"productIds\":[37,36,35,34,33,32,31,30,29,28,27,26],\"showPrice\":true,\"showCta\":true,\"sectionBgTheme\":\"WHITE\",\"__themeKey\":\"theme_1\",\"slug\":\"carousel-produk\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1305, 'PRODUCT_LISTING', '', 'produk', 1, 6, '{\"sectionTheme\":\"GOLD_WHITE\",\"title\":\"\",\"productIds\":[37,36,35,34,33,32,31,30,29,28,27,26,25,24],\"sectionBgTheme\":\"WHITE\",\"__themeKey\":\"theme_1\",\"slug\":\"produk\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1306, 'HIGHLIGHT_COLLECTION', 'Koleksi Pilihan', 'koleksi-pilihan', 1, 7, '{\"mode\":\"products\",\"title\":\"Koleksi Pilihan\",\"productIds\":[37,35,34,30,31,32,33],\"layout\":\"FEATURED_LEFT\",\"heroImageId\":184,\"badgeText\":\"\",\"headline\":\"Koleksi Pilihan\",\"description\":\"Temukan produk terbaik kami yang dikurasi khusus untuk keindahan ruangan Anda.\",\"ctaText\":\"Lihat Semua\",\"ctaHref\":\"/kategori\",\"items\":[{\"type\":\"product\",\"refId\":37,\"enabled\":true},{\"type\":\"product\",\"refId\":35,\"enabled\":true},{\"type\":\"product\",\"refId\":34,\"enabled\":true},{\"type\":\"product\",\"refId\":30,\"enabled\":true},{\"type\":\"product\",\"refId\":31,\"enabled\":true},{\"type\":\"product\",\"refId\":32,\"enabled\":true},{\"type\":\"product\",\"refId\":33,\"enabled\":true}],\"__themeKey\":\"theme_1\",\"slug\":\"koleksi-pilihan\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1307, 'ROOM_CATEGORY', 'KATEGORI RUANGAN', 'kategori-ruangan', 1, 8, '{\"cards\":[{\"key\":\"ruang_keluarga_tamu\",\"title\":\"Ruang Keluarga & Tamu\",\"description\":\"\",\"badge\":\"\",\"kategoriId\":null,\"imageId\":188},{\"key\":\"ruang_makan_dapur\",\"title\":\"Ruang Makan & Dapur\",\"description\":\"\",\"badge\":\"\",\"kategoriId\":null,\"imageId\":191},{\"key\":\"kamar_tidur\",\"title\":\"Kamar Tidur\",\"description\":\"\",\"badge\":\"\",\"kategoriId\":81,\"imageId\":187},{\"key\":\"room_0f9dbf71da91\",\"title\":\"Meja Makan\",\"description\":\"\",\"badge\":\"\",\"kategoriId\":90,\"imageId\":186}],\"__themeKey\":\"theme_1\",\"title\":\"KATEGORI RUANGAN\",\"slug\":\"kategori-ruangan\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1308, 'BRANCHES', '', 'cabang', 1, 9, '{\"sectionTheme\":\"WHITE_GOLD\",\"branchIds\":[7],\"layout\":\"carousel\",\"__themeKey\":\"theme_1\",\"title\":\"\",\"slug\":\"cabang\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1309, 'CONTACT', '', 'hubungi', 1, 10, '{\"hubungiIds\":[2],\"buttonLabels\":{\"2\":\"HUBUNGI\"},\"mode\":\"SPLIT_IMAGE_STACK\",\"showImage\":true,\"imageId\":97,\"headerText\":\"Hubungi apix interior: Desain Interior, Produksi, & Instalasi\",\"bodyText\":\"Mulai dari konsep sampai instalasi, apix interior bantu urus interiornya. Cocok untuk rumah, apartemen, hingga kantordengan finishing rapi. Hubungi kami lewat kontak yang kamu pilih di bawah. Yuk mulai konsultasi!\",\"__themeKey\":\"theme_1\",\"title\":\"\",\"slug\":\"hubungi\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1310, 'SOCIAL', 'm', 'social', 1, 11, '{\"selected\":[{\"iconKey\":\"instagram\",\"nama\":\"Instagram\"},{\"iconKey\":\"whatsapp\",\"nama\":\"WhatsApp\"},{\"iconKey\":\"tiktok\",\"nama\":\"TikTok\"}],\"display\":{\"iconsOnly\":true},\"__themeKey\":\"theme_1\",\"title\":\"m\",\"slug\":\"social\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1311, 'CUSTOM_PROMO', 'CUSTOM PROMO', 'promo', 1, 12, '{\"layout\":\"carousel\",\"sectionBgTheme\":\"FOLLOW_NAVBAR\",\"voucherImageIds\":[182,181,180],\"voucherLinks\":{\"180\":\"category:89\",\"181\":\"category:84\",\"182\":\"category:90\"},\"__themeKey\":\"theme_1\",\"title\":\"CUSTOM PROMO\",\"slug\":\"promo\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL),
(1312, 'FOOTER', 'k', 'footer-contact', 1, 13, '{\"whatsapp\":\"\",\"email\":\"\",\"address\":\"\",\"instagram\":\"\",\"facebook\":\"\",\"menuLinks\":[{\"label\":\"FAQ\",\"url\":\"/faq\"},{\"label\":\"Syarat & Ketentuan\",\"url\":\"/terms\"},{\"label\":\"Privacy Policy\",\"url\":\"/privacy-policy\"},{\"label\":\"Hubungi Kami\",\"url\":\"/hubungi\"}],\"footerTags\":[{\"label\":\"Meja TV Minimalis\",\"url\":\"\"},{\"label\":\"Interior Design Jakarta\",\"url\":\"\"},{\"label\":\"Pusat Meja Makan\",\"url\":\"\"},{\"label\":\"Agen Kursi Teras\",\"url\":\"\"},{\"label\":\"Distributor Sofa Bed\",\"url\":\"\"},{\"label\":\"Dipan Minimalis\",\"url\":\"\"},{\"label\":\"Backdrop TV Kayu Jati\",\"url\":\"\"},{\"label\":\"Lemari Pakaian Furnitur\",\"url\":\"\"},{\"label\":\"Mebel Modern\",\"url\":\"\"},{\"label\":\"Meja Makan Interior\",\"url\":\"\"},{\"label\":\"Interior Murah\",\"url\":\"\"},{\"label\":\"Partisi Furniture\",\"url\":\"\"},{\"label\":\"Lemari Hias Mebel\",\"url\":\"\"},{\"label\":\"Lemari Pakaian\",\"url\":\"\"},{\"label\":\"Toko Meja TV\",\"url\":\"\"},{\"label\":\"Furniture Kantor Murah\",\"url\":\"\"},{\"label\":\"Partisi Mewah\",\"url\":\"\"},{\"label\":\"Sofa Bed Furnitur\",\"url\":\"\"},{\"label\":\"Kursi Kantor Furnitur\",\"url\":\"\"},{\"label\":\"Furniture Modern\",\"url\":\"\"},{\"label\":\"Kursi Teras Minimalis\",\"url\":\"\"},{\"label\":\"Rak Sepatu Kayu Jati\",\"url\":\"\"},{\"label\":\"Toko Tempat Tidur\",\"url\":\"\"},{\"label\":\"Toko Sofa\",\"url\":\"\"},{\"label\":\"Kitchen Set Furniture\",\"url\":\"\"},{\"label\":\"Kitchen Set Murah\",\"url\":\"\"},{\"label\":\"Mebel Kayu Jepara\",\"url\":\"\"},{\"label\":\"Distributor Rak Sepatu\",\"url\":\"\"},{\"label\":\"Sofa Mebel\",\"url\":\"\"},{\"label\":\"Pusat Lemari Pakaian\",\"url\":\"\"},{\"label\":\"Tempat Tidur Furnitur\",\"url\":\"\"},{\"label\":\"Kasur Mebel\",\"url\":\"\"},{\"label\":\"Kursi Kantor Modern\",\"url\":\"\"},{\"label\":\"Toko Kitchen Set\",\"url\":\"\"},{\"label\":\"Dipan Furniture\",\"url\":\"\"},{\"label\":\"Rak Sepatu Furniture\",\"url\":\"\"},{\"label\":\"Kursi Teras Mebel\",\"url\":\"\"},{\"label\":\"Meja Belajar Furniture\",\"url\":\"\"},{\"label\":\"Sofa Bed Kayu Jati\",\"url\":\"\"},{\"label\":\"Meja TV Furniture\",\"url\":\"\"},{\"label\":\"Distributor Kursi Kantor\",\"url\":\"\"},{\"label\":\"Lemari Hias Terbaru\",\"url\":\"\"},{\"label\":\"Tempat Tidur Minimalis\",\"url\":\"\"},{\"label\":\"Paket Seserahan Furniture\",\"url\":\"\"},{\"label\":\"Jasa Interior Rumah\",\"url\":\"\"},{\"label\":\"Kasur Murah\",\"url\":\"\"},{\"label\":\"Meja Makan Estetik\",\"url\":\"\"},{\"label\":\"Toko Mebel Terdekat\",\"url\":\"\"}],\"useGlobalContact\":true,\"useGlobalSocial\":true,\"__themeKey\":\"theme_1\",\"title\":\"k\",\"slug\":\"footer-contact\"}', '2026-01-12 07:50:02.534', '2026-01-12 07:50:02.534', NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `hubungi`
--

CREATE TABLE `hubungi` (
  `id` int(11) NOT NULL,
  `nomor` varchar(191) NOT NULL,
  `prioritas` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hubungi`
--

INSERT INTO `hubungi` (`id`, `nomor`, `prioritas`, `createdAt`, `updatedAt`) VALUES
(2, '6282134313332', 1, '2025-11-29 03:55:56.687', '2025-11-29 03:56:17.758');

-- --------------------------------------------------------

--
-- Table structure for table `informasi_toko`
--

CREATE TABLE `informasi_toko` (
  `id` int(11) NOT NULL DEFAULT 1,
  `namaToko` varchar(191) NOT NULL,
  `deskripsi` varchar(191) NOT NULL,
  `logoUrl` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `informasi_toko`
--

INSERT INTO `informasi_toko` (`id`, `namaToko`, `deskripsi`, `logoUrl`, `createdAt`, `updatedAt`) VALUES
(1, 'apix interior', 'interior ', '/uploads/logos/e2dd7825-5cd9-4aea-ada3-429e1b7f3f1b.png', '2025-11-29 06:00:47.346', '2025-12-10 06:14:34.563');

-- --------------------------------------------------------

--
-- Table structure for table `kategori_produk`
--

CREATE TABLE `kategori_produk` (
  `id` int(11) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `isUnggulan` tinyint(1) NOT NULL DEFAULT 0,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `isPromo` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kategori_produk`
--

INSERT INTO `kategori_produk` (`id`, `nama`, `slug`, `isUnggulan`, `urutan`, `createdAt`, `isPromo`) VALUES
(81, 'Set Dapur', 'set-dapur-qgpgzufv', 0, 3, '2025-12-25 21:08:46.239', 0),
(82, 'Meja Makan', 'meja-makan-qi55zr4v', 0, 2, '2025-12-25 21:08:48.094', 0),
(83, 'Furnitur Dapur', 'furnitur-dapur-qi79xxkh', 0, 4, '2025-12-25 21:08:48.170', 0),
(84, 'Rak Tv', 'rak-tv-oqvxm0iy', 0, 5, '2025-12-25 21:35:25.731', 0),
(87, 'Rak Dapur', 'rak-dapur-68donoec', 0, 6, '2026-01-02 04:46:37.553', 0),
(89, 'PROMO', 'promo-gciszopi', 0, 1, '2026-01-04 04:57:49.932', 1),
(90, 'Ruang Tamu', 'ruang-tamu-kqo6hxhw', 0, 7, '2026-01-07 08:36:12.693', 0),
(91, 'Ruang Makan', 'ruang-makan-kw22z4qe', 0, 8, '2026-01-07 08:36:19.666', 0);

-- --------------------------------------------------------

--
-- Table structure for table `kategori_produk_item`
--

CREATE TABLE `kategori_produk_item` (
  `id` int(11) NOT NULL,
  `kategoriId` int(11) NOT NULL,
  `produkId` int(11) NOT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kategori_produk_item`
--

INSERT INTO `kategori_produk_item` (`id`, `kategoriId`, `produkId`, `urutan`) VALUES
(219, 84, 32, 1),
(220, 84, 33, 2),
(221, 84, 34, 3),
(222, 82, 28, 1),
(223, 82, 30, 2),
(224, 82, 29, 3),
(225, 82, 31, 4),
(236, 83, 24, 1),
(237, 83, 25, 2),
(238, 83, 31, 3),
(239, 83, 30, 4),
(240, 83, 29, 5),
(241, 83, 28, 6),
(242, 83, 26, 7),
(245, 87, 30, 1),
(264, 81, 26, 1),
(265, 81, 27, 2),
(266, 81, 24, 3),
(267, 81, 25, 4),
(268, 81, 34, 5),
(269, 89, 34, 1),
(270, 90, 34, 1),
(271, 90, 33, 2),
(272, 91, 27, 1),
(273, 91, 28, 2),
(274, 91, 26, 3),
(275, 91, 29, 4),
(276, 91, 30, 5),
(277, 91, 31, 6);

-- --------------------------------------------------------

--
-- Table structure for table `media_sosial`
--

CREATE TABLE `media_sosial` (
  `id` int(11) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `iconKey` varchar(191) NOT NULL,
  `url` varchar(191) NOT NULL,
  `prioritas` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `media_sosial`
--

INSERT INTO `media_sosial` (`id`, `nama`, `iconKey`, `url`, `prioritas`, `createdAt`, `updatedAt`) VALUES
(1, 'Instagram', 'instagram', 'https://www.instagram.com/apix_interior/', 0, '2025-11-29 05:03:39.791', '2025-11-30 00:30:47.073'),
(2, 'WhatsApp', 'whatsapp', 'https://wa.me/7834787483943', 0, '2025-12-10 09:48:35.334', '2025-12-10 09:48:35.334'),
(3, 'TikTok', 'tiktok', 'https://www.tiktok.com/apixinterior', 0, '2025-12-10 09:48:44.860', '2025-12-10 09:48:44.860');

-- --------------------------------------------------------

--
-- Table structure for table `navbaritem`
--

CREATE TABLE `navbaritem` (
  `id` int(11) NOT NULL,
  `label` varchar(191) NOT NULL,
  `href` varchar(191) NOT NULL,
  `position` enum('MAIN','FOOTER','BOTTOM') NOT NULL DEFAULT 'MAIN',
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isExternal` tinyint(1) NOT NULL DEFAULT 0,
  `iconKey` varchar(191) DEFAULT NULL,
  `showSearch` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `navbarsetting`
--

CREATE TABLE `navbarsetting` (
  `id` int(11) NOT NULL DEFAULT 1,
  `theme` enum('NAVY_GOLD','WHITE_GOLD','NAVY_WHITE','GOLD_NAVY','GOLD_WHITE','WHITE_NAVY') NOT NULL DEFAULT 'NAVY_GOLD',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `backgroundTheme` varchar(191) DEFAULT 'NAVY_GOLD'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `navbarsetting`
--

INSERT INTO `navbarsetting` (`id`, `theme`, `createdAt`, `updatedAt`, `backgroundTheme`) VALUES
(1, 'WHITE_GOLD', '2025-12-13 06:50:09.698', '2026-01-11 03:57:03.896', 'NAVY_GOLD');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` longtext NOT NULL,
  `coverImage` varchar(191) DEFAULT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 1,
  `author` varchar(191) DEFAULT NULL,
  `seoTitle` varchar(191) DEFAULT NULL,
  `seoDescription` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `title`, `slug`, `excerpt`, `content`, `coverImage`, `isPublished`, `author`, `seoTitle`, `seoDescription`, `createdAt`, `updatedAt`) VALUES
(1, 'Interior: Inspirasi & Tips Terbaik untuk Hunian', 'interior', 'Temukan berbagai inspirasi menarik seputar Interior. Tips memilih, merawat, dan menata Interior agar rumah semakin nyaman dan estetik.', '<h2>Mengenal Lebih Dekat Interior</h2>\n<p>Memilih <strong>Interior</strong> yang tepat bisa menjadi tantangan tersendiri bagi banyak pemilik rumah. Tidak hanya soal estetika, tetapi juga fungsionalitas dan kenyamanan jangka panjang. Dalam artikel ini, kita akan membahas tuntas segala hal tentang Interior.</p>\n\n<h3>Mengapa Memilih Interior?</h3>\n<ul>\n    <li><strong>Nilai Estetika:</strong> Menambah keindahan visual ruangan Anda.</li>\n    <li><strong>Fungsionalitas:</strong> Mendukung aktivitas sehari-hari dengan lebih baik.</li>\n    <li><strong>Investasi Jangka Panjang:</strong> Produk berkualitas akan bertahan bertahun-tahun.</li>\n</ul>\n\n<h3>Tips Merawat Interior Agar Awet</h3>\n<p>Agar tetap terlihat baru dan tahan lama, pastikan Anda melakukan perawatan rutin. Bersihkan debu secara berkala dan hindari paparan sinar matahari langsung yang berlebihan jika material tidak mendukung.</p>\n\n<h3>Kesimpulan</h3>\n<p>Dengan pemilihan yang tepat, <strong>Interior</strong> dapat mengubah suasana rumah Anda secara drastis. Jangan ragu untuk memadukan gaya dan warna sesuai dengan kepribadian Anda.</p>', '/uploads/meja-makan-set-minimalist-white-japan-se-6bfe3de1-f8bc-45a3-aeaa-f4c716a9fa41-1600.webp', 1, 'Admin', NULL, NULL, '2026-01-09 06:25:19.705', '2026-01-09 06:25:30.665'),
(2, 'Interior: Inspirasi & Tips Terbaik untuk Hunian Anda', 'kabinet-luxury', 'Temukan berbagai inspirasi menarik seputar Interior. Tips memilih, merawat, dan menata Interior agar rumah semakin nyaman dan estetik.', '<h2>Mengenal Lebih Dekat Interior</h2>\n<p>Memilih <strong>Interior</strong> yang tepat bisa menjadi tantangan tersendiri bagi banyak pemilik rumah. Tidak hanya soal estetika, tetapi juga fungsionalitas dan kenyamanan jangka panjang. Dalam artikel ini, kita akan membahas tuntas segala hal tentang Interior.</p>\n\n<h3>Mengapa Memilih Interior?</h3>\n<ul>\n    <li><strong>Nilai Estetika:</strong> Menambah keindahan visual ruangan Anda.</li>\n    <li><strong>Fungsionalitas:</strong> Mendukung aktivitas sehari-hari dengan lebih baik.</li>\n    <li><strong>Investasi Jangka Panjang:</strong> Produk berkualitas akan bertahan bertahun-tahun.</li>\n</ul>\n\n<h3>Tips Merawat Interior Agar Awet</h3>\n<p>Agar tetap terlihat baru dan tahan lama, pastikan Anda melakukan perawatan rutin. Bersihkan debu secara berkala dan hindari paparan sinar matahari langsung yang berlebihan jika material tidak mendukung.</p>\n\n<h3>Kesimpulan</h3>\n<p>Dengan pemilihan yang tepat, <strong>Interior</strong> dapat mengubah suasana rumah Anda secara drastis. Jangan ragu untuk memadukan gaya dan warna sesuai dengan kepribadian Anda.</p>', '/uploads/kabinet-dapur-kitchen-luxury-black-db9d9fda-b9a6-44d0-adcb-af09b3c2bd25-1600.webp', 1, 'Admin', NULL, NULL, '2026-01-10 04:57:29.635', '2026-01-10 04:57:29.635');

-- --------------------------------------------------------

--
-- Table structure for table `produk`
--

CREATE TABLE `produk` (
  `id` int(11) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `kategori` varchar(191) DEFAULT NULL,
  `subkategori` varchar(191) DEFAULT NULL,
  `mainImageId` int(11) DEFAULT NULL,
  `berat` int(11) DEFAULT NULL,
  `bisaCustomUkuran` tinyint(1) NOT NULL DEFAULT 0,
  `catatanKhusus` varchar(191) DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deskripsiLengkap` longtext DEFAULT NULL,
  `deskripsiSingkat` longtext DEFAULT NULL,
  `estimasiPengerjaan` varchar(191) DEFAULT NULL,
  `finishing` varchar(191) DEFAULT NULL,
  `garansi` varchar(191) DEFAULT NULL,
  `harga` int(11) NOT NULL,
  `hargaTipe` varchar(191) DEFAULT NULL,
  `isCustom` tinyint(1) NOT NULL DEFAULT 0,
  `jasaPasang` varchar(191) DEFAULT NULL,
  `lebar` int(11) DEFAULT NULL,
  `material` varchar(191) DEFAULT NULL,
  `metaDescription` varchar(191) DEFAULT NULL,
  `metaTitle` varchar(191) DEFAULT NULL,
  `panjang` int(11) DEFAULT NULL,
  `subcategoryId` int(11) DEFAULT NULL,
  `tags` varchar(191) DEFAULT NULL,
  `tinggi` int(11) DEFAULT NULL,
  `tipeOrder` varchar(191) DEFAULT NULL,
  `warna` varchar(191) DEFAULT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `promoAktif` tinyint(1) NOT NULL DEFAULT 0,
  `promoTipe` varchar(191) DEFAULT NULL,
  `promoValue` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produk`
--

INSERT INTO `produk` (`id`, `nama`, `slug`, `kategori`, `subkategori`, `mainImageId`, `berat`, `bisaCustomUkuran`, `catatanKhusus`, `categoryId`, `createdAt`, `deskripsiLengkap`, `deskripsiSingkat`, `estimasiPengerjaan`, `finishing`, `garansi`, `harga`, `hargaTipe`, `isCustom`, `jasaPasang`, `lebar`, `material`, `metaDescription`, `metaTitle`, `panjang`, `subcategoryId`, `tags`, `tinggi`, `tipeOrder`, `warna`, `urutan`, `promoAktif`, `promoTipe`, `promoValue`) VALUES
(24, 'Kitchen Set Atas Custom untuk Dapur - | Jabodetabek', 'kabinet-dapur-kitchen-set-atas-custom-jabodetabek', 'Furniture Rumah', 'Kabinet Dapur', 76, 0, 1, 'Harga mulai Rp 2.199.999/meter lari. Est total 2.47 m: Rp 5.430.000. SEO(Admin): core=Kitchen Set Atas; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi', 9, '2025-12-25 20:00:56.985', 'Ciptakan suasana Dapur impian Anda dengan Kitchen Set Atas Custom untuk Dapur - | Jabodetabek. Perabot bergaya modern yang tidak hanya mempercantik ruangan, tetapi juga memberikan solusi penyimpanan cerdas untuk gaya hidup masa kini.\r\n\r\n✨ Keunggulan Utama:\r\n✅ Fleksibilitas Tanpa Batas: Ukuran dan kompartemen dalam bisa disesuaikan sepenuhnya dengan kebutuhan spesifik ruangan Anda.\r\n✅ Ketahanan Ekstra: Dibuat dari Multipleks berkualitas tinggi (bukan partikel board), menjamin konstruksi yang padat, anti-melengkung, dan tahan lama.\r\n✅ Finishing HPL Premium: Permukaan halus, tahan goresan ringan, serta sangat mudah dibersihkan dari debu atau noda.\r\n✅ Estetika Modern: Desain minimalis yang timeless, mudah dipadukan dengan berbagai tema interior mulai dari scandinavian hingga industrial.\r\n\r\n📋 Spesifikasi Detail:\r\n- Dimensi: P 247 cm x L 59 cm x T 222 cm\r\n- Material Utama: Multipleks 18mm + rangka kayu (Tahan terhadap rayap & jamur)\r\n- Finishing: HPL + edging rapi\r\n- Warna: Kayu Natural\r\n- Fitur Unggulan: Bisa custom ukuran & layout dalam\r\n\r\n💡 Perawatan Mudah:\r\nCukup lap dengan kain microfiber sedikit lembap untuk membersihkan debu sehari-hari. Hindari penggunaan cairan kimia keras atau sikat kasar agar kualitas finishing tetap terjaga sempurna.\r\n\r\n🚚 Pengiriman & Instalasi:\r\nKami menyediakan opsi pengiriman aman dan tim ahli siap membantu instalasi rapi di lokasi Anda. Estimasi pengerjaan 21–30 hari kerja (tergantung antrian produksi).\r\n\r\nWujudkan interior impian Anda sekarang! Hubungi kami untuk konsultasi desain dan penawaran spesial. 🛠️✨', 'Kabinet Dapur yang menyesuaikan kebutuhan ruang di area dapur dengan tampilan yang lebih tertata.', '21–30 hari kerja', 'HPL + edging rapi', NULL, 2199999, 'mulai_dari', 1, 'ya', 59, 'Multipleks 18mm + rangka kayu', 'Kitchen Set Atas untuk Dapur tersedia di Jabodetabek. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Tersedia opsi custom dimensi &.', 'Kitchen Set Atas untuk Dapur | Jabodetabek | Material &', 247, 13, 'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, penyimpanan, custom ukuran, multipleks, hpl', 222, 'pre_order', 'Kayu Natural', 2, 0, NULL, NULL),
(25, 'Kabinet Dapur kitchen luxury black', 'kabinet-dapur-kitchen-luxury-black', 'Furniture Rumah', 'Kabinet Dapur', 79, 0, 1, 'Harga mulai Rp 2.290.000/meter lari. Est total 2.92 m: Rp 6.690.000. SEO(Admin): core=Kitchen Set Atas; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi', 9, '2025-12-25 20:05:05.025', 'Ciptakan suasana Dapur impian Anda dengan Kabinet Dapur kitchen luxury black. Perabot bergaya modern yang tidak hanya mempercantik ruangan, tetapi juga memberikan solusi penyimpanan cerdas untuk gaya hidup masa kini.\r\n\r\n✨ Keunggulan Utama:\r\n✅ Fleksibilitas Tanpa Batas: Ukuran dan kompartemen dalam bisa disesuaikan sepenuhnya dengan kebutuhan spesifik ruangan Anda.\r\n✅ Ketahanan Ekstra: Dibuat dari Multipleks berkualitas tinggi (bukan partikel board), menjamin konstruksi yang padat, anti-melengkung, dan tahan lama.\r\n✅ Finishing HPL Premium: Permukaan halus, tahan goresan ringan, serta sangat mudah dibersihkan dari debu atau noda.\r\n✅ Estetika Modern: Desain minimalis yang timeless, mudah dipadukan dengan berbagai tema interior mulai dari scandinavian hingga industrial.\r\n\r\n📋 Spesifikasi Detail:\r\n- Dimensi: P 292 cm x L 59 cm x T 233 cm\r\n- Material Utama: Multipleks 18mm + rangka kayu (Tahan terhadap rayap & jamur)\r\n- Finishing: HPL + edging rapi\r\n- Warna: Kayu Natural\r\n- Fitur Unggulan: Bisa custom ukuran & layout dalam\r\n\r\n💡 Perawatan Mudah:\r\nCukup lap dengan kain microfiber sedikit lembap untuk membersihkan debu sehari-hari. Hindari penggunaan cairan kimia keras atau sikat kasar agar kualitas finishing tetap terjaga sempurna.\r\n\r\n🚚 Pengiriman & Instalasi:\r\nKami menyediakan opsi pengiriman aman dan tim ahli siap membantu instalasi rapi di lokasi Anda. Estimasi pengerjaan 21–30 hari kerja (tergantung antrian produksi).\r\n\r\nWujudkan interior impian Anda sekarang! Hubungi kami untuk konsultasi desain dan penawaran spesial. 🛠️✨', 'Kabinet Dapur yang mempermudah penataan barang harian di area dapur dengan hasil rapi dan mudah dirawat.', '21–30 hari kerja', 'HPL + edging rapi', NULL, 2290000, 'mulai_dari', 1, 'ya', 59, 'Multipleks 18mm + rangka kayu', 'Kitchen Set Atas untuk Dapur — Jabodetabek. Material Multipleks 18mm + rangka kayu + finishing HPL + edging rapi. Bisa penyesuaian dimensi. Pastikan ukuran.', 'Dapur - Kitchen Set Atas - Jabodetabek | Detail &', 292, 13, 'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, penyimpanan, custom ukuran, multipleks, hpl', 233, 'pre_order', 'Kayu Natural', 3, 0, NULL, NULL),
(26, 'Kabinet Dapur Kitchen dinning kayu Tropis', 'kabinet-dapur-kitchen-dinning-kayu-tropis', 'Furniture Rumah', 'Kabinet Dapur', 83, 0, 1, 'Harga mulai Rp 2.900.000/meter lari. Est total 2.27 m: Rp 6.580.000. SEO(Admin): core=Partisi Kisi Kayu; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi', 9, '2025-12-25 20:51:19.665', 'Kabinet Dapur Kitchen dinning kayu Tropis membantu mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien. Kompartemen dapat diatur agar alur aktivitas lebih nyaman tanpa', 'Kabinet Dapur yang memberi ruang simpan praktis dengan hasil rapi dan mudah dirawat.', '21–30 hari kerja', 'HPL + edging rapi', NULL, 2900000, 'mulai_dari', 1, 'ya', 58, 'Multipleks 18mm + rangka kayu', 'Partisi Kisi Kayu untuk Dapur — Jabodetabek. Material Multipleks 18mm + rangka kayu + finishing HPL + edging rapi. Bisa penyesuaian dimensi. Pastikan ukuran.', 'Dapur - Partisi Kisi Kayu - Jabodetabek | Harga per meter', 227, 13, 'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 215, 'pre_order', 'Kayu Natural', 4, 0, NULL, NULL),
(27, 'Partisi Kisi Kayu Custom untuk Dapur (per m²)', 'kabinet-dapur-partisi-kisi-kayu-custom-per-2', 'Furniture Rumah', 'Kabinet Dapur', 87, 0, 1, 'SEO(Admin): core=Partisi Kisi Kayu; room=Dapur; region=Jabodetabek; uom=per m². Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.', 9, '2025-12-25 21:01:45.298', 'Partisi Kisi Kayu Custom untuk Dapur (per m²) membantu mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien di area Atur kompartemen sesuai kebutuhan agar area terlihat ', 'Kabinet Dapur yang memberi ruang simpan praktis di area dapur dengan hasil rapi dan mudah dirawat.', '21–30 hari kerja', 'HPL + edging rapi', NULL, 2900000, 'mulai_dari', 1, 'ya', 58, 'Multipleks 18mm + rangka kayu', 'Partisi Kisi Kayu untuk Dapur — Jabodetabek - Jawa Barat - Jawa Tengah - Jawa Timur. Material Multipleks 18mm + rangka kayu + finishing HPL + edging rapi. Bisa penyesuaian dimensi. Pastikan u', 'Dapur - Partisi kitchen set hitam minimalist • Jabodetabek - Jawa Barat - Jawa Tengah - Jawa Timur', 227, 13, 'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per m², kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 215, 'pre_order', 'Kayu Natural', 5, 0, NULL, NULL),
(28, 'meja makan set kayu tropis', 'meja-makan-set-kayu-tropis', 'Furniture Rumah', 'Meja Makan', 89, 0, 0, 'SEO(Admin): core=Partisi Kisi Kayu; room=Kamar Mandi; region=Jabodetabek; uom=per m². Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.', 9, '2025-12-25 21:02:31.694', 'meja makan set kayu tropis dirancang untuk menjadi pusat aktivitas makan bersama dengan permukaan yang mudah dirawat di kamar. Atur kompartemen sesuai kebutuhan agar area terlihat lebih terta', 'Meja Makan yang membantu penataan lebih teratur di kamar dengan tampilan yang lebih tertata.', '7–14 hari kerja', 'HPL + edging rapi', NULL, 5040000, 'fixed', 0, 'tidak', 89, 'Multipleks 18mm + rangka kayu', 'Partisi Kisi Kayu untuk Kamar Mandi di Jabodetabek. Material Multipleks 18mm + rangka kayu, finishing HPL + edging rapi. Cek ukuran area dan detail spesifikasi.', 'Partisi Kisi Kayu untuk Kamar Mandi | Jabodetabek', 142, 14, 'partisi kisi kayu, kamar mandi, finishing, surface, jabodetabek, per m², meja makan, kamar, fungsional, ready stock, multipleks, hpl', 73, 'ready_stock', 'Kayu Natural', 6, 0, NULL, NULL),
(29, 'dinning set meja makan hitam', 'meja-makan-dinning-set-hitam', 'Furniture Rumah', 'Meja Makan', 91, 0, 0, 'SEO(Admin): core=Meja Belajar Built-in; room=Area Masuk / Foyer; region=Jabodetabek; uom=per unit. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.', 9, '2025-12-25 21:03:36.306', 'dinning set meja makan hitam cocok untuk menjadi pusat aktivitas makan bersama dengan permukaan yang mudah dirawat. Susunan penyimpanan bisa disesuaikan supaya ruang tetap lega dan mudah dipa', 'Meja Makan yang membantu penataan lebih teratur dengan tampilan yang lebih tertata.', '7–14 hari kerja', 'HPL + edging rapi', NULL, 2120000, 'fixed', 0, 'tidak', 77, 'Multipleks 18mm + rangka kayu', 'Meja Belajar Built-in untuk Area Masuk / Foyer di Jabodetabek - Jawa Barat - Jawa Tengah - Jawa Timur. Material Multipleks 18mm + rangka kayu, finishing HPL + edging rapi. Cek ukuran area dan', 'Area Masuk / Foyer - Meja Belajar Built-in • Jabodetabek - Jawa Barat - Jawa Tengah - Jawa Timur', 157, 14, 'meja belajar built-in, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per unit, meja makan, fungsional, ready stock, multipleks, hpl', 76, 'ready_stock', 'Kayu Natural', 7, 0, NULL, NULL),
(30, 'Meja Makan Japan Wood dinning set', 'meja-makan-japan-wood-dinning-set', 'Furniture Rumah', 'Meja Makan', 93, 0, 1, 'SEO(Admin): core=Rak Dinding Built-in; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.', 9, '2025-12-25 21:04:57.640', 'Meja Makan Japan Wood dinning set dirancang untuk menjadi pusat aktivitas makan bersama dengan permukaan yang mudah dirawat di area dapur. Atur kompartemen sesuai kebutuhan agar area terlihat', 'Meja Makan yang membuat area terasa lebih lega di area dapur tanpa membuat ruangan terlihat penuh.', '7–14 hari kerja', 'HPL + edging rapi', NULL, 2330000, 'mulai_dari', 1, 'tidak', 78, 'Multipleks 18mm + rangka kayu', 'Rak Dinding Built-in untuk Dapur tersedia di Jabodetabek. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Bisa penyesuaian dimensi.', 'Rak Dinding Built-in untuk Dapur | Jabodetabek', 193, 14, 'rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl', 72, 'pre_order', 'Kayu Natural', 8, 0, NULL, NULL),
(31, 'meja makan set minimalist white japan Seri Sora Pantry', 'meja-makan-set-minimalist-4', 'Furniture Rumah', 'Kabinet Dapur', 97, 0, 1, 'SEO(Admin): core=Pintu Kayu Solid Custom; room=Dapur; region=Jabodetabek; uom=per unit. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.', 9, '2025-12-25 21:07:32.896', 'Kabinet Dapur meja makan set minimalist white japan Seri Sora Pantry membantu mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien di area Atur kompartemen sesuai kebutu', 'Kabinet Dapur yang membuat area terasa lebih lega di area dapur tanpa membuat ruangan terlihat penuh.', '21–30 hari kerja', 'HPL + edging rapi', NULL, 1350000, 'mulai_dari', 1, 'ya', 61, 'Multipleks 18mm + rangka kayu', 'meja makan set minimalist white japan untuk Dapur tersedia diseluruh pulau jawa. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Tersedia opsi custom.', 'meja makan set minimalist white japan | Jabodetabek | Material &', 296, 13, 'pintu kayu solid custom, dapur, item, custom, jabodetabek, per unit, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 216, 'pre_order', 'Kayu Natural', 9, 0, NULL, NULL),
(32, 'Rak TV backdrop Blackstone', 'rak-tv-backdrop-blackstone', 'Furniture Rumah', 'Rak TV', 99, 0, 1, 'Harga mulai Rp 2.100.000/m². Est total 2 m²: Rp 4.200.000. SEO(Admin): core=Backdrop TV Panel; room=Area Masuk / Foyer; region=Jabodetabek; uom=per m². Warna bisa berbeda; toleransi', 9, '2025-12-25 21:32:35.475', 'Rak TV backdrop Blackstone membantu menata perangkat hiburan sekaligus menyimpan aksesori agar area utama rumah tetap rapi. Kompartemen dapat diatur agar alur aktivitas lebih nyaman tanpa mem', 'Rak TV yang membuat area terasa lebih lega dengan tampilan yang lebih tertata.', '14–21 hari kerja', 'HPL + edging rapi', NULL, 2100000, 'mulai_dari', 1, 'ya', 52, 'Multipleks 18mm + rangka kayu', 'Backdrop TV Panel untuk Area Masuk / Foyer tersedia di Jabodetabek. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Opsi custom.', 'Backdrop TV Panel untuk Area Masuk / Foyer • Jabodetabek', 173, 15, 'backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl', 46, 'pre_order', 'Kayu Natural', 10, 0, NULL, NULL),
(33, 'japanese backdrop tv', 'japanese-backdrop-tv', 'Furniture Rumah', 'Backdrop TV', 101, 0, 1, 'Harga mulai Rp 2.440.000/m². Est total 2 m²: Rp 4.880.000. SEO(Admin): core=Backdrop TV Panel; room=Area Masuk / Foyer; region=Jabodetabek; uom=per m². Warna bisa berbeda; toleransi', 9, '2025-12-25 21:33:22.400', 'Rak TV japanese backdrop cocok untuk menata perangkat hiburan sekaligus menyimpan aksesori agar area utama rumah tetap rapi. Susunan penyimpanan bisa disesuaikan supaya ruang tetap lega dan m', 'Rak TV yang membuat area terasa lebih lega dengan tampilan yang lebih tertata.', '14–21 hari kerja', 'HPL + edging rapi', NULL, 2440000, 'mulai_dari', 1, 'ya', 36, 'Multipleks 18mm + rangka kayu', 'Backdrop TV Panel untuk Area Masuk / Foyer — Jabodetabek. Material Multipleks 18mm + rangka kayu + finishing HPL + edging rapi. Opsi custom tersedia.', 'Area Masuk / Foyer - Backdrop TV Panel | Jabodetabek', 181, 16, 'backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl', 57, 'pre_order', 'Kayu Natural', 11, 0, NULL, NULL),
(34, 'Backdrop TV Panel industrial Garasi - Rak | Jabodetabek', 'rak-tv-backdrop-panel-industrial-garasi', 'Furniture Rumah', 'Rak TV', 103, 0, 1, 'SEO(Admin): core=Backdrop TV Panel; room=Carport / Garasi; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.', 9, '2025-12-25 21:34:18.488', 'Backdrop TV Panel Custom untuk Carport / Garasi - Rak | Jabodetabek membantu menata perangkat hiburan sekaligus menyimpan aksesori agar area utama rumah tetap rapi. Susunan penyimpanan bisa d', 'Rak TV yang memberi ruang simpan praktis dengan hasil rapi dan mudah dirawat.', '14–21 hari kerja', 'HPL + edging rapi', NULL, 2850000, 'mulai_dari', 1, 'ya', 42, 'Multipleks 18mm + rangka kayu', 'Backdrop TV Panel untuk Carport / Garasi di Jabodetabek. Material Multipleks 18mm + rangka kayu, finishing HPL + edging rapi. Opsi custom tersedia. Bandingkan.', 'Carport / Garasi - Backdrop TV Panel - Jabodetabek', 153, 15, 'backdrop tv panel, carport / garasi, built-in & storage, built-in, carpentry, jabodetabek, per meter, rak tv, fungsional, custom ukuran, multipleks, hpl', 59, 'pre_order', 'Kayu Natural', 12, 1, 'persen', 10),
(35, 'Lemari Black minimalist', 'lemari-black-minimalist', 'Furniture Rumah', NULL, 105, 0, 0, 'SEO(Admin): core=Lemari; room=Carport / Garasi; region=Jabodetabek; uom=per unit. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.', 9, '2025-12-25 21:34:52.106', 'Lemari Black minimalist cocok untuk membantu menata kebutuhan harian agar ruang terasa lebih tertib. Atur kompartemen sesuai kebutuhan agar area terlihat lebih tertata.\r\n\r\nMaterial Multipleks', 'Lemari yang membuat area terasa lebih lega tanpa membuat ruangan terlihat penuh.', '7–14 hari kerja', 'HPL + edging rapi', NULL, 2480000, 'fixed', 0, 'tidak', 0, 'Multipleks 18mm + rangka kayu', 'Lemari untuk Carport / Garasi tersedia di Jabodetabek. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Periksa detail produk sebelum.', 'Lemari untuk Carport / Garasi | Jabodetabek | Detail &', 0, NULL, 'lemari, carport / garasi, maintenance, jasa, jabodetabek, per unit, fungsional, ready stock, multipleks, hpl, warna natural, tips penataan', 0, 'ready_stock', 'Kayu Natural', 13, 0, NULL, NULL),
(36, 'Kabinet Dapur kitchen set marble', 'kabinet-dapur-kitchen-set-marble', 'Furniture Rumah', 'Kabinet Dapur', 144, 0, 1, 'Harga mulai Rp 2.810.000/meter lari. Est total 2.56 m: Rp 7.190.000. SEO(Admin): core=Kitchen Set; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi ukuran;', 9, '2025-12-29 07:41:03.518', 'Kabinet Dapur kitchen set marble cocok untuk mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien di area Susunan penyimpanan bisa disesuaikan supaya ruang tetap lega da', 'Kabinet Dapur yang menyesuaikan kebutuhan ruang di area dapur dengan hasil rapi dan mudah dirawat.', '21–30 hari kerja', 'HPL + edging rapi', NULL, 2810000, 'mulai_dari', 1, 'ya', 63, 'Multipleks 18mm + rangka kayu', 'Kitchen Set untuk Dapur tersedia di Jabodetabek. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Tersedia opsi custom dimensi &.', 'Dapur - Kitchen Set | Jabodetabek | Detail & Spesifikasi', 256, 13, 'kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural', 236, 'pre_order', 'Kayu Natural', 14, 0, NULL, NULL),
(37, 'Cat Dinding Rapi untuk Area Masuk / Foyer | Jabodetabek', 'cat-dinding-rapi-area-masuk-foyer', 'Furniture Rumah', NULL, 149, 0, 0, 'SEO(Admin): core=Cat Dinding; room=Kamar Tidur; region=Jabodetabek; uom=per m². Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.', 9, '2025-12-30 02:14:56.567', 'Cat Dinding Rapi untuk Area Masuk / Foyer | Jabodetabek membantu menata kebutuhan harian agar ruang terasa lebih tertib. Atur kompartemen sesuai kebutuhan agar area terlihat lebih tertata.\r\n\r', 'Cat Dinding yang membuat area terasa lebih lega dengan tampilan yang lebih tertata.', '7–14 hari kerja', 'HPL + edging rapi', NULL, 2680000, 'fixed', 0, 'ya', 0, 'Multipleks 18mm + rangka kayu', 'Cat Dinding untuk Kamar Tidur di Jabodetabek. Material Multipleks 18mm + rangka kayu, finishing HPL + edging rapi. Cek ukuran area dan detail spesifikasi.', 'Cat Dinding Kamar Tidur - Jabodetabek | Detail & Spesifikasi', 0, NULL, 'cat dinding, kamar tidur, finishing, surface, jabodetabek, per m², fungsional, ready stock, multipleks, hpl, warna natural, tips penataan', 0, 'ready_stock', 'Kayu Natural', 1, 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `produk_galeri`
--

CREATE TABLE `produk_galeri` (
  `id` int(11) NOT NULL,
  `produkId` int(11) NOT NULL,
  `gambarId` int(11) NOT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produk_galeri`
--

INSERT INTO `produk_galeri` (`id`, `produkId`, `gambarId`, `urutan`) VALUES
(1, 36, 145, 0),
(2, 36, 146, 1),
(3, 36, 147, 2),
(4, 36, 148, 3),
(349, 37, 141, 0),
(350, 37, 146, 1),
(421, 24, 78, 0),
(422, 24, 77, 1),
(423, 24, 79, 2),
(424, 24, 80, 3),
(425, 24, 142, 4),
(426, 24, 84, 5),
(427, 24, 98, 6);

-- --------------------------------------------------------

--
-- Table structure for table `subcategory`
--

CREATE TABLE `subcategory` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `categoryId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcategory`
--

INSERT INTO `subcategory` (`id`, `name`, `categoryId`) VALUES
(2, 'dapur full set', 1),
(1, 'kitchen set', 1),
(3, 'rak tanaman', 2),
(4, 'headboard', 3),
(5, 'rak multifungsi', 4),
(6, 'plant decoration', 5),
(7, 'hiasan headboard', 6),
(8, 'headboard', 7),
(9, 'meja belajar', 8),
(16, 'Backdrop TV', 9),
(10, 'Backdrop TV / Lemari TV', 9),
(11, 'Headboard / Tempat tidur', 9),
(13, 'Kabinet Dapur', 9),
(12, 'Kitchen set', 9),
(14, 'Meja Makan', 9),
(15, 'Rak TV', 9);

-- --------------------------------------------------------

--
-- Table structure for table `themesettings`
--

CREATE TABLE `themesettings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `navbarBg` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'NAVY',
  `navbarText` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'WHITE',
  `sidebarBg` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'BLACK',
  `sidebarText` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'WHITE',
  `primaryColor` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'GOLD',
  `secondaryColor` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'BLACK',
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variasi_galeri`
--

CREATE TABLE `variasi_galeri` (
  `id` int(11) NOT NULL,
  `variasiProdukId` int(11) NOT NULL,
  `gambarId` int(11) NOT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variasi_kombinasi`
--

CREATE TABLE `variasi_kombinasi` (
  `id` int(11) NOT NULL,
  `variasiProdukId` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `nilai` varchar(191) NOT NULL,
  `tambahHarga` int(11) DEFAULT NULL,
  `promoAktif` tinyint(1) NOT NULL DEFAULT 0,
  `promoTipe` varchar(191) DEFAULT NULL,
  `promoValue` int(11) DEFAULT NULL,
  `imageId` int(11) DEFAULT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `variasi_kombinasi`
--

INSERT INTO `variasi_kombinasi` (`id`, `variasiProdukId`, `level`, `nama`, `nilai`, `tambahHarga`, `promoAktif`, `promoTipe`, `promoValue`, `imageId`, `urutan`, `createdAt`) VALUES
(352, 111, 1, 'pyu', 'pyu', 1000000, 1, 'persen', 50, NULL, 0, '2026-01-10 12:29:39.256'),
(353, 111, 1, 'gugu', 'gugu', 0, 0, NULL, NULL, NULL, 1, '2026-01-10 12:29:39.263'),
(354, 111, 1, '1', '1', 0, 0, NULL, NULL, NULL, 2, '2026-01-10 12:29:39.269'),
(355, 111, 1, '3', '3', 0, 0, NULL, NULL, NULL, 3, '2026-01-10 12:29:39.275'),
(356, 112, 1, 'pyu__dedup2', 'pyu', 1000000, 1, 'persen', 50, NULL, 0, '2026-01-10 12:29:39.288'),
(357, 112, 1, 'gugu__dedup2', 'gugu', 0, 0, NULL, NULL, NULL, 1, '2026-01-10 12:29:39.293'),
(358, 112, 1, '1__dedup2', '1', 0, 0, NULL, NULL, NULL, 2, '2026-01-10 12:29:39.298'),
(359, 112, 1, '3__dedup2', '3', 0, 0, NULL, NULL, NULL, 3, '2026-01-10 12:29:39.303');

-- --------------------------------------------------------

--
-- Table structure for table `variasi_produk`
--

CREATE TABLE `variasi_produk` (
  `id` int(11) NOT NULL,
  `produkId` int(11) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `priceMode` enum('UNIT','PER_METER','PER_M2','PER_TITIK') NOT NULL DEFAULT 'UNIT',
  `harga` int(11) NOT NULL,
  `promoAktif` tinyint(1) NOT NULL DEFAULT 0,
  `promoTipe` varchar(191) DEFAULT NULL,
  `promoValue` int(11) DEFAULT NULL,
  `imageId` int(11) DEFAULT NULL,
  `stok` int(11) DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT 1,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `variasi_produk`
--

INSERT INTO `variasi_produk` (`id`, `produkId`, `nama`, `options`, `priceMode`, `harga`, `promoAktif`, `promoTipe`, `promoValue`, `imageId`, `stok`, `aktif`, `urutan`, `createdAt`) VALUES
(90, 37, 'k', '{\"label\":\"k\",\"price\":\"\",\"unitOverride\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"image\":{\"mode\":\"kolase\",\"kolaseId\":146,\"kolaseUrl\":\"/uploads/kabinet-dapur-kitchen-set-marble-bdac85e4-dd88-4a2d-a036-df395ff74b89-1600.webp\",\"uploadField\":\"variasiFotoUpload__id_af68a71c4bf61_19b7af08995\",\"uploadStatus\":\"\",\"uploadName\":\"\",\"uploadToken\":\"\"},\"gallery\":[],\"combos\":{\"lv1\":[]},\"titles\":{\"varTitle\":\"\",\"lv1Title\":\"\",\"lv2Title\":\"\",\"lv3Title\":\"\"}}', 'UNIT', 0, 0, NULL, NULL, 146, NULL, 1, 0, '2026-01-09 15:55:52.221'),
(111, 24, 'kk', '{\"label\":\"kk\",\"price\":\"2000000\",\"unitOverride\":\"\",\"promo\":{\"active\":true,\"type\":\"percent\",\"value\":\"10\"},\"image\":{\"mode\":\"kolase\",\"kolaseId\":142,\"kolaseUrl\":\"/uploads/variasi-f-84194af8-75a0-48df-a4d8-660ac000df91-1600.webp\",\"uploadField\":\"variasiFotoUpload__id_77c68b22d0b938_19b6bd4024e\",\"uploadStatus\":\"\",\"uploadName\":\"\",\"uploadToken\":\"\"},\"gallery\":[],\"combos\":{\"lv1\":[{\"id\":\"id_ae738b351465c_19b7affa9f5\",\"label\":\"pyu\",\"addPrice\":\"1000000\",\"promo\":{\"active\":true,\"type\":\"percent\",\"value\":\"50\"},\"lv2\":[]},{\"id\":\"id_b75c596a4a7ac8_19b7affe05a\",\"label\":\"gugu\",\"addPrice\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"lv2\":[]},{\"id\":\"id_9dc435d7d7955_19b7b3720fa\",\"label\":\"1\",\"addPrice\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"lv2\":[]},{\"id\":\"id_45b555cb393b58_19b7b372e18\",\"label\":\"3\",\"addPrice\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"lv2\":[]}]},\"titles\":{\"varTitle\":\"\",\"lv1Title\":\"\",\"lv2Title\":\"\",\"lv3Title\":\"\"}}', 'UNIT', 2000000, 1, 'persen', 10, 142, NULL, 1, 0, '2026-01-10 12:29:39.248'),
(112, 24, 'p', '{\"label\":\"p\",\"price\":\"\",\"unitOverride\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"image\":{\"mode\":\"kolase\",\"kolaseId\":98,\"kolaseUrl\":\"/uploads/meja-makan-set-minimalist-white-japan-se-c24bfe73-9bcd-4d0a-ab10-9287a2e201b5-1600.webp\",\"uploadField\":\"variasiFotoUpload__25\",\"uploadStatus\":\"\",\"uploadName\":\"\",\"uploadToken\":\"\"},\"gallery\":[],\"combos\":{\"lv1\":[{\"id\":\"id_4bc269e5645198_19b7b31a19e\",\"label\":\"pyu\",\"addPrice\":\"1000000\",\"lv2\":[],\"promo\":{\"active\":true,\"type\":\"percent\",\"value\":\"50\"}},{\"id\":\"id_3dedad8215905_19b7b31a19e\",\"label\":\"gugu\",\"addPrice\":\"\",\"lv2\":[],\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"}},{\"id\":\"id_ccf15efc8265_19b7b37485f\",\"label\":\"1\",\"addPrice\":\"\",\"lv2\":[],\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"}},{\"id\":\"id_e472f84cd39cc_19b7b37485f\",\"label\":\"3\",\"addPrice\":\"\",\"lv2\":[],\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"}}]},\"titles\":{\"varTitle\":\"\",\"lv1Title\":\"\",\"lv2Title\":\"\",\"lv3Title\":\"\"}}', 'UNIT', 0, 0, NULL, NULL, 98, NULL, 1, 1, '2026-01-10 12:29:39.282');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Admin_username_key` (`username`);

--
-- Indexes for table `adminmenuitem`
--
ALTER TABLE `adminmenuitem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AdminMenuItem_parentId_fkey` (`parentId`);

--
-- Indexes for table `banner_promo`
--
ALTER TABLE `banner_promo`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cabang_toko`
--
ALTER TABLE `cabang_toko`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Category_name_key` (`name`);

--
-- Indexes for table `dynamic_pages`
--
ALTER TABLE `dynamic_pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dynamic_pages_slug_key` (`slug`);

--
-- Indexes for table `gambar_upload`
--
ALTER TABLE `gambar_upload`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gambar_upload_categoryId_fkey` (`categoryId`),
  ADD KEY `gambar_upload_subcategoryId_fkey` (`subcategoryId`);

--
-- Indexes for table `homepagesection`
--
ALTER TABLE `homepagesection`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `homepagesectiondraft`
--
ALTER TABLE `homepagesectiondraft`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `homepagesectionitem`
--
ALTER TABLE `homepagesectionitem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `HomepageSectionItem_homepageSectionId_fkey` (`homepageSectionId`);

--
-- Indexes for table `homepagesectionpublished`
--
ALTER TABLE `homepagesectionpublished`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hubungi`
--
ALTER TABLE `hubungi`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `informasi_toko`
--
ALTER TABLE `informasi_toko`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kategori_produk`
--
ALTER TABLE `kategori_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kategori_produk_slug_key` (`slug`);

--
-- Indexes for table `kategori_produk_item`
--
ALTER TABLE `kategori_produk_item`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kategori_produk_item_kategoriId_produkId_key` (`kategoriId`,`produkId`),
  ADD KEY `kategori_produk_item_produkId_fkey` (`produkId`);

--
-- Indexes for table `media_sosial`
--
ALTER TABLE `media_sosial`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `navbaritem`
--
ALTER TABLE `navbaritem`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `navbarsetting`
--
ALTER TABLE `navbarsetting`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `posts_slug_key` (`slug`);

--
-- Indexes for table `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `produk_slug_key` (`slug`),
  ADD KEY `produk_mainImageId_fkey` (`mainImageId`);

--
-- Indexes for table `produk_galeri`
--
ALTER TABLE `produk_galeri`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `produk_galeri_produkId_gambarId_key` (`produkId`,`gambarId`),
  ADD KEY `produk_galeri_produkId_urutan_idx` (`produkId`,`urutan`),
  ADD KEY `produk_galeri_gambarId_fkey` (`gambarId`);

--
-- Indexes for table `subcategory`
--
ALTER TABLE `subcategory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Subcategory_categoryId_name_key` (`categoryId`,`name`);

--
-- Indexes for table `themesettings`
--
ALTER TABLE `themesettings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `variasi_galeri`
--
ALTER TABLE `variasi_galeri`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `variasi_galeri_variasiProdukId_gambarId_key` (`variasiProdukId`,`gambarId`),
  ADD KEY `variasi_galeri_variasiProdukId_urutan_idx` (`variasiProdukId`,`urutan`),
  ADD KEY `variasi_galeri_gambarId_fkey` (`gambarId`);

--
-- Indexes for table `variasi_kombinasi`
--
ALTER TABLE `variasi_kombinasi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `variasi_kombinasi_variasiProdukId_level_nama_key` (`variasiProdukId`,`level`,`nama`),
  ADD KEY `variasi_kombinasi_variasiProdukId_level_urutan_idx` (`variasiProdukId`,`level`,`urutan`),
  ADD KEY `variasi_kombinasi_imageId_fkey` (`imageId`);

--
-- Indexes for table `variasi_produk`
--
ALTER TABLE `variasi_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `variasi_produk_produkId_nama_key` (`produkId`,`nama`),
  ADD KEY `variasi_produk_produkId_urutan_idx` (`produkId`,`urutan`),
  ADD KEY `variasi_produk_imageId_fkey` (`imageId`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `adminmenuitem`
--
ALTER TABLE `adminmenuitem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `banner_promo`
--
ALTER TABLE `banner_promo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cabang_toko`
--
ALTER TABLE `cabang_toko`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `dynamic_pages`
--
ALTER TABLE `dynamic_pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `gambar_upload`
--
ALTER TABLE `gambar_upload`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=192;

--
-- AUTO_INCREMENT for table `homepagesection`
--
ALTER TABLE `homepagesection`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `homepagesectiondraft`
--
ALTER TABLE `homepagesectiondraft`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=492;

--
-- AUTO_INCREMENT for table `homepagesectionitem`
--
ALTER TABLE `homepagesectionitem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `homepagesectionpublished`
--
ALTER TABLE `homepagesectionpublished`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1313;

--
-- AUTO_INCREMENT for table `hubungi`
--
ALTER TABLE `hubungi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `kategori_produk`
--
ALTER TABLE `kategori_produk`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `kategori_produk_item`
--
ALTER TABLE `kategori_produk_item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=278;

--
-- AUTO_INCREMENT for table `media_sosial`
--
ALTER TABLE `media_sosial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `navbaritem`
--
ALTER TABLE `navbaritem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `produk`
--
ALTER TABLE `produk`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `produk_galeri`
--
ALTER TABLE `produk_galeri`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=428;

--
-- AUTO_INCREMENT for table `subcategory`
--
ALTER TABLE `subcategory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `variasi_galeri`
--
ALTER TABLE `variasi_galeri`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `variasi_kombinasi`
--
ALTER TABLE `variasi_kombinasi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=360;

--
-- AUTO_INCREMENT for table `variasi_produk`
--
ALTER TABLE `variasi_produk`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `adminmenuitem`
--
ALTER TABLE `adminmenuitem`
  ADD CONSTRAINT `AdminMenuItem_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `adminmenuitem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `gambar_upload`
--
ALTER TABLE `gambar_upload`
  ADD CONSTRAINT `gambar_upload_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `gambar_upload_subcategoryId_fkey` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `homepagesectionitem`
--
ALTER TABLE `homepagesectionitem`
  ADD CONSTRAINT `HomepageSectionItem_homepageSectionId_fkey` FOREIGN KEY (`homepageSectionId`) REFERENCES `homepagesection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `kategori_produk_item`
--
ALTER TABLE `kategori_produk_item`
  ADD CONSTRAINT `kategori_produk_item_kategoriId_fkey` FOREIGN KEY (`kategoriId`) REFERENCES `kategori_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `kategori_produk_item_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `produk`
--
ALTER TABLE `produk`
  ADD CONSTRAINT `produk_mainImageId_fkey` FOREIGN KEY (`mainImageId`) REFERENCES `gambar_upload` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `produk_galeri`
--
ALTER TABLE `produk_galeri`
  ADD CONSTRAINT `produk_galeri_gambarId_fkey` FOREIGN KEY (`gambarId`) REFERENCES `gambar_upload` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `produk_galeri_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `subcategory`
--
ALTER TABLE `subcategory`
  ADD CONSTRAINT `Subcategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `variasi_galeri`
--
ALTER TABLE `variasi_galeri`
  ADD CONSTRAINT `variasi_galeri_gambarId_fkey` FOREIGN KEY (`gambarId`) REFERENCES `gambar_upload` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `variasi_galeri_variasiProdukId_fkey` FOREIGN KEY (`variasiProdukId`) REFERENCES `variasi_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `variasi_kombinasi`
--
ALTER TABLE `variasi_kombinasi`
  ADD CONSTRAINT `variasi_kombinasi_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `gambar_upload` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `variasi_kombinasi_variasiProdukId_fkey` FOREIGN KEY (`variasiProdukId`) REFERENCES `variasi_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `variasi_produk`
--
ALTER TABLE `variasi_produk`
  ADD CONSTRAINT `variasi_produk_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `gambar_upload` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `variasi_produk_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
