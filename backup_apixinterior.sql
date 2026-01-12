-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: apixinterior
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `apixinterior`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `apixinterior` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `apixinterior`;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('360d142f-1a4b-4f69-aa63-46c951a53853','70b5f126a53f5072073f40595e974ff6989bfe7271852ae7e4917a2eb20bbad5','2025-11-28 03:45:03.041','20251128034502_init_gambar_upload',NULL,NULL,'2025-11-28 03:45:02.914',1),('4f185d79-6ed9-4cd3-bbb7-dc4e0534d2d4','71910babd2cecc52e5ea36159db68160b188ed184181109c723ccf622646c00c','2025-11-28 13:18:43.845','20251128131843_add_produk_table',NULL,NULL,'2025-11-28 13:18:43.795',1),('67958a62-3690-4298-a17e-48c279e258af','5a4caf87375945731d83f2c97036c7e6ca4d4840e989a9be4271dc81e2f10e29','2025-11-28 12:58:58.335','20251128125858_update_schema',NULL,NULL,'2025-11-28 12:58:58.318',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Admin_username_key` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'apixinterior','$2b$12$1J4sotZjbSQPfqaU5ScRUey6ENM2ba.wPQu08FrzQB3LSFY40PBPm','superadmin','2025-12-09 00:58:08.591','2025-12-09 01:12:11.801');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `adminmenuitem`
--

DROP TABLE IF EXISTS `adminmenuitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `adminmenuitem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(191) NOT NULL,
  `path` varchar(191) NOT NULL,
  `iconKey` varchar(191) DEFAULT NULL,
  `parentId` int(11) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `AdminMenuItem_parentId_fkey` (`parentId`),
  CONSTRAINT `AdminMenuItem_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `adminmenuitem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adminmenuitem`
--

LOCK TABLES `adminmenuitem` WRITE;
/*!40000 ALTER TABLE `adminmenuitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `adminmenuitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banner_promo`
--

DROP TABLE IF EXISTS `banner_promo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banner_promo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(191) NOT NULL,
  `subtitle` varchar(191) DEFAULT NULL,
  `imageUrl` varchar(191) NOT NULL,
  `buttonLabel` varchar(191) DEFAULT NULL,
  `buttonHref` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banner_promo`
--

LOCK TABLES `banner_promo` WRITE;
/*!40000 ALTER TABLE `banner_promo` DISABLE KEYS */;
INSERT INTO `banner_promo` VALUES (1,'y','Disc 10%','/uploads/banners/1765363012798-Sea__Sky_And_Frangipani__Wallpapers__Backdrop_Background_Image_And_Wallpaper_for_Free_Download.jpg',NULL,NULL,1,'2025-12-10 10:36:52.804','2025-12-10 10:36:52.804'),(2,'g',NULL,'/uploads/banners/1765386157220-Sea__Sky_And_Frangipani__Wallpapers__Backdrop_Background_Image_And_Wallpaper_for_Free_Download.jpg',NULL,NULL,1,'2025-12-10 17:02:37.225','2025-12-10 17:02:37.225');
/*!40000 ALTER TABLE `banner_promo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabang_toko`
--

DROP TABLE IF EXISTS `cabang_toko`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cabang_toko` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `namaCabang` varchar(191) NOT NULL,
  `mapsUrl` text NOT NULL,
  `urutan` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabang_toko`
--

LOCK TABLES `cabang_toko` WRITE;
/*!40000 ALTER TABLE `cabang_toko` DISABLE KEYS */;
INSERT INTO `cabang_toko` VALUES (1,'Bekasi , Jawa Barat','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.86067252857393!2d106.96652276362742!3d-6.293829183503009!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d049216585b%3A0x69c6e1c0ddbb1f1b!2sAPIX%20INTERIOR!5e0!3m2!1sid!2sid!4v1767415651877!5m2!1sid!2sid',NULL,'2025-11-29 06:02:18.386','2025-11-29 06:04:06.302');
/*!40000 ALTER TABLE `cabang_toko` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'furniture dapur'),(4,'furniture ruang'),(9,'Furniture Rumah'),(5,'hiasan tanaman'),(6,'kamar tidur'),(2,'Plant Decoration'),(8,'ruang belajar'),(7,'ruang kamar'),(3,'ruang kamar tidur');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gambar_upload`
--

DROP TABLE IF EXISTS `gambar_upload`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gambar_upload` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(191) NOT NULL,
  `title` varchar(191) DEFAULT NULL,
  `tags` varchar(191) NOT NULL DEFAULT '',
  `categoryId` int(11) DEFAULT NULL,
  `subcategoryId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `gambar_upload_categoryId_fkey` (`categoryId`),
  KEY `gambar_upload_subcategoryId_fkey` (`subcategoryId`),
  CONSTRAINT `gambar_upload_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `gambar_upload_subcategoryId_fkey` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=150 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gambar_upload`
--

LOCK TABLES `gambar_upload` WRITE;
/*!40000 ALTER TABLE `gambar_upload` DISABLE KEYS */;
INSERT INTO `gambar_upload` VALUES (76,'/uploads/kitchen-set-atas-custom-untuk-dapur-per--f3e46b49-ba75-43e6-8f57-88e533f45cc6-1600.webp','Kitchen Set Atas Custom untuk Dapur - (per meter)','kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl',9,13,'2025-12-25 20:00:56.665'),(77,'/uploads/kitchen-set-atas-custom-untuk-dapur-per--6e7a79ff-5f1f-4239-a4d7-a7c989d6883c-1600.webp','Kitchen Set Atas Custom untuk Dapur - (per meter)','kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl',9,13,'2025-12-25 20:00:56.825'),(78,'/uploads/kitchen-set-atas-custom-untuk-dapur-per--80cdb517-daef-45a4-b5d5-c291cb40a3b0-1600.webp','Kitchen Set Atas Custom untuk Dapur - (per meter)','kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl',9,13,'2025-12-25 20:00:56.978'),(79,'/uploads/kabinet-dapur-kitchen-luxury-black-0e114fe2-cfeb-4fa9-a2c9-ddcf0cf92eec-1600.webp','Kabinet Dapur kitchen luxury black','kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl',9,13,'2025-12-25 20:05:04.661'),(80,'/uploads/kabinet-dapur-kitchen-luxury-black-db9d9fda-b9a6-44d0-adcb-af09b3c2bd25-1600.webp','Kabinet Dapur kitchen luxury black','kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl',9,13,'2025-12-25 20:05:04.862'),(81,'/uploads/kabinet-dapur-kitchen-luxury-black-f2a44311-257b-4487-ac20-7be50d7eeb81-1600.webp','Kabinet Dapur kitchen luxury black','kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl',9,13,'2025-12-25 20:05:05.016'),(82,'/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-b46d37e1-74ed-4159-80e4-8f8b6ced32ec-1600.webp','Kabinet Dapur Kitchen dinning kayu Tropis','partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-25 20:51:18.759'),(83,'/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-99ac022f-0d83-45b7-8a36-8bcca3a07b9c-1600.webp','Kabinet Dapur Kitchen dinning kayu Tropis','partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-25 20:51:18.959'),(84,'/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-851cdfc7-36ee-4116-ab85-39ffca8de629-1600.webp','Kabinet Dapur Kitchen dinning kayu Tropis','partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-25 20:51:19.146'),(85,'/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-24f4dbb5-eba4-43fc-b76e-c8e22262cbaa-1600.webp','Kabinet Dapur Kitchen dinning kayu Tropis','partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-25 20:51:19.355'),(86,'/uploads/kabinet-dapur-kitchen-dinning-kayu-tropi-55f10c19-2a9d-4299-9bc5-3981ce72f076-1600.webp','Kabinet Dapur Kitchen dinning kayu Tropis','partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-25 20:51:19.659'),(87,'/uploads/partisi-kisi-kayu-custom-untuk-dapur-per-45713548-8a47-4b1d-9626-d96080fd2408-1600.webp','Partisi Kisi Kayu Custom untuk Dapur (per m²)','partisi kisi kayu, dapur, finishing, surface, jabodetabek, per m², kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-25 21:01:45.121'),(88,'/uploads/partisi-kisi-kayu-custom-untuk-dapur-per-14355f4d-dc20-4e8f-bbc8-530aa4badc0b-1600.webp','Partisi Kisi Kayu Custom untuk Dapur (per m²)','partisi kisi kayu, dapur, finishing, surface, jabodetabek, per m², kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-25 21:01:45.288'),(89,'/uploads/meja-makan-set-kayu-tropis-d5f03cff-0c1f-4a4c-830c-5a5e0ce38b41-1600.webp','meja makan set kayu tropis','partisi kisi kayu, kamar mandi, finishing, surface, jabodetabek, per m², meja makan, kamar, fungsional, ready stock, multipleks, hpl',9,14,'2025-12-25 21:02:31.459'),(90,'/uploads/meja-makan-set-kayu-tropis-077b5801-1154-4a6d-956f-bf5c9545b4cb-1600.webp','meja makan set kayu tropis','partisi kisi kayu, kamar mandi, finishing, surface, jabodetabek, per m², meja makan, kamar, fungsional, ready stock, multipleks, hpl',9,14,'2025-12-25 21:02:31.689'),(91,'/uploads/dinning-set-meja-makan-hitam-06fe5bf0-149e-498c-9cdc-01cc02dbd036-1600.webp','dinning set meja makan hitam','meja belajar built-in, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per unit, meja makan, fungsional, ready stock, multipleks, hpl',9,14,'2025-12-25 21:03:36.113'),(92,'/uploads/dinning-set-meja-makan-hitam-cf2f1978-ee04-4f84-b1ba-2c874e84debd-1600.webp','dinning set meja makan hitam','meja belajar built-in, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per unit, meja makan, fungsional, ready stock, multipleks, hpl',9,14,'2025-12-25 21:03:36.284'),(93,'/uploads/meja-makan-japan-wood-dinning-set-e012a0c1-1e37-4fcb-bbbf-b1059b824a6a-1600.webp','Meja Makan Japan Wood dinning set','rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl',9,14,'2025-12-25 21:04:57.068'),(94,'/uploads/meja-makan-japan-wood-dinning-set-979e7c89-efdc-4a20-96c5-6a5f1f943d51-1600.webp','Meja Makan Japan Wood dinning set','rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl',9,14,'2025-12-25 21:04:57.242'),(95,'/uploads/meja-makan-japan-wood-dinning-set-815dd850-7385-4c1b-910b-402a894d752c-1600.webp','Meja Makan Japan Wood dinning set','rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl',9,14,'2025-12-25 21:04:57.439'),(96,'/uploads/meja-makan-japan-wood-dinning-set-79f6b5a4-6d6a-4cdf-b0ac-62b65721b954-1600.webp','Meja Makan Japan Wood dinning set','rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl',9,14,'2025-12-25 21:04:57.628'),(97,'/uploads/meja-makan-set-minimalist-white-japan-se-6bfe3de1-f8bc-45a3-aeaa-f4c716a9fa41-1600.webp','meja makan set minimalist white japan Seri Sora Pantry','pintu kayu solid custom, dapur, item, custom, jabodetabek, per unit, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-25 21:07:32.678'),(98,'/uploads/meja-makan-set-minimalist-white-japan-se-c24bfe73-9bcd-4d0a-ab10-9287a2e201b5-1600.webp','meja makan set minimalist white japan Seri Sora Pantry','pintu kayu solid custom, dapur, item, custom, jabodetabek, per unit, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-25 21:07:32.887'),(99,'/uploads/rak-tv-backdrop-blackstone-2ba1e360-00bd-411a-af25-b92593149ede-1600.webp','Rak TV backdrop Blackstone','backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl',9,15,'2025-12-25 21:32:35.207'),(100,'/uploads/rak-tv-backdrop-blackstone-54b0b93a-856d-4bd1-a28f-762c10710186-1600.webp','Rak TV backdrop Blackstone','backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl',9,15,'2025-12-25 21:32:35.463'),(101,'/uploads/japanese-backdrop-tv-359421b8-1196-4ae4-977c-80c38fefa509-1600.webp','japanese backdrop tv','backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl',9,16,'2025-12-25 21:33:22.184'),(102,'/uploads/japanese-backdrop-tv-e39485bd-ed29-4b2e-960a-c526dc213d4f-1600.webp','japanese backdrop tv','backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl',9,16,'2025-12-25 21:33:22.391'),(103,'/uploads/backdrop-tv-panel-industrial-garasi-rak--54c03ee1-dc1a-48f2-9cb6-fabbc8b261b6-1600.webp','Backdrop TV Panel industrial Garasi - Rak | Jabodetabek','backdrop tv panel, carport / garasi, built-in & storage, built-in, carpentry, jabodetabek, per meter, rak tv, fungsional, custom ukuran, multipleks, hpl',9,15,'2025-12-25 21:34:18.267'),(104,'/uploads/backdrop-tv-panel-industrial-garasi-rak--2d81ca7b-76e5-4351-b278-11f1495d3cdb-1600.webp','Backdrop TV Panel industrial Garasi - Rak | Jabodetabek','backdrop tv panel, carport / garasi, built-in & storage, built-in, carpentry, jabodetabek, per meter, rak tv, fungsional, custom ukuran, multipleks, hpl',9,15,'2025-12-25 21:34:18.477'),(105,'/uploads/lemari-black-minimalist-3bd0a8ee-502a-433e-9c3a-3bfc18ce3c21-1600.webp','Lemari Black minimalist','lemari, carport / garasi, maintenance, jasa, jabodetabek, per unit, fungsional, ready stock, multipleks, hpl, warna natural, tips penataan',9,NULL,'2025-12-25 21:34:51.909'),(106,'/uploads/lemari-black-minimalist-018a0012-f0f9-4ea5-abc9-4b4813943901-1600.webp','Lemari Black minimalist','lemari, carport / garasi, maintenance, jasa, jabodetabek, per unit, fungsional, ready stock, multipleks, hpl, warna natural, tips penataan',9,NULL,'2025-12-25 21:34:52.098'),(134,'/uploads/variasi-k-e59bf52f-a142-4a7e-b7ae-9249da746adb-1600.webp','Variasi: k','variasi',NULL,NULL,'2025-12-29 07:39:04.003'),(135,'/uploads/variasi-u-76536874-1de3-47da-89a0-bd9109a68aba-1600.webp','Variasi: u','variasi',NULL,NULL,'2025-12-29 07:39:08.781'),(136,'/uploads/variasi-o-73e1ee37-7e4e-4d4f-93f2-65292f7524b6-1600.webp','Variasi: o','variasi',NULL,NULL,'2025-12-29 07:39:13.634'),(137,'/uploads/variasi-l-b13a38ab-5337-46b7-82d1-885557b257c7-1600.webp','Variasi: l','variasi',NULL,NULL,'2025-12-29 07:39:18.372'),(138,'/uploads/variasi-y-10ab02e9-6704-498c-893e-762973fa9d72-1600.webp','Variasi: y','variasi',NULL,NULL,'2025-12-29 07:39:23.263'),(139,'/uploads/variasi-p-bf405c08-dbe6-4b7c-9cb0-f0be6c1b7330-1600.webp','Variasi: p','variasi',NULL,NULL,'2025-12-29 07:39:28.013'),(140,'/uploads/variasi-t-8e664ab9-a331-4320-9f2e-ceb6e5a84481-1600.webp','Variasi: t','variasi',NULL,NULL,'2025-12-29 07:39:33.896'),(141,'/uploads/variasi-r-da869c31-07ee-4caa-ad2a-8968fcdb1c35-1600.webp','Variasi: r','variasi',NULL,NULL,'2025-12-29 07:39:46.312'),(142,'/uploads/variasi-f-84194af8-75a0-48df-a4d8-660ac000df91-1600.webp','Variasi: f','variasi',NULL,NULL,'2025-12-29 07:39:51.009'),(143,'/uploads/variasi-b-9a0ec843-3606-4b5b-abab-690b951d890c-1600.webp','Variasi: b','variasi',NULL,NULL,'2025-12-29 07:39:56.392'),(144,'/uploads/kabinet-dapur-kitchen-set-marble-6278070a-3ad0-4cb8-b7df-b432ea142c38-1600.webp','Kabinet Dapur kitchen set marble','kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-29 07:41:03.043'),(145,'/uploads/kabinet-dapur-kitchen-set-marble-e50a0af7-05bd-4407-80e0-165407370a9c-1600.webp','Kabinet Dapur kitchen set marble','kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-29 07:41:03.164'),(146,'/uploads/kabinet-dapur-kitchen-set-marble-bdac85e4-dd88-4a2d-a036-df395ff74b89-1600.webp','Kabinet Dapur kitchen set marble','kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-29 07:41:03.282'),(147,'/uploads/kabinet-dapur-kitchen-set-marble-96fcc58e-c876-42e3-91af-c80f102e4eda-1600.webp','Kabinet Dapur kitchen set marble','kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-29 07:41:03.398'),(148,'/uploads/kabinet-dapur-kitchen-set-marble-1ab43560-0866-4800-a528-e002a33e161f-1600.webp','Kabinet Dapur kitchen set marble','kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',9,13,'2025-12-29 07:41:03.508'),(149,'/uploads/cat-dinding-rapi-untuk-area-masuk-foyer--fc609f33-338f-4ac2-8ad8-9012b19dea01-1600.webp','Cat Dinding Rapi untuk Area Masuk / Foyer | Jabodetabek','cat dinding, area masuk / foyer, finishing, surface, jabodetabek, per unit, fungsional, ready stock, multipleks, hpl, warna natural, tips penataan',9,NULL,'2025-12-30 02:14:56.557');
/*!40000 ALTER TABLE `gambar_upload` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `homepagesection`
--

DROP TABLE IF EXISTS `homepagesection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepagesection` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('HERO','CATEGORY_GRID','PRODUCT_CAROUSEL','HIGHLIGHT_COLLECTION','ROOM_CATEGORY','GALLERY','BRANCHES','CONTACT','SOCIAL','CUSTOM_PROMO') NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `homepagesection`
--

LOCK TABLES `homepagesection` WRITE;
/*!40000 ALTER TABLE `homepagesection` DISABLE KEYS */;
/*!40000 ALTER TABLE `homepagesection` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `homepagesectiondraft`
--

DROP TABLE IF EXISTS `homepagesectiondraft`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepagesectiondraft` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('HERO','CATEGORY_GRID','PRODUCT_CAROUSEL','HIGHLIGHT_COLLECTION','ROOM_CATEGORY','GALLERY','BRANCHES','CONTACT','SOCIAL','CUSTOM_PROMO') NOT NULL,
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
  `heroSubheadline` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `homepagesectiondraft`
--

LOCK TABLES `homepagesectiondraft` WRITE;
/*!40000 ALTER TABLE `homepagesectiondraft` DISABLE KEYS */;
INSERT INTO `homepagesectiondraft` VALUES (166,'CUSTOM_PROMO','__THEME_META__','__theme_meta__theme_1',0,0,'{\"__isThemeMeta\":true,\"__themeKey\":\"theme_1\",\"themeName\":\"Yuliana\",\"backgroundTheme\":\"WHITE_GOLD\"}','2025-12-21 18:59:06.840','2026-01-03 23:30:59.995',NULL,NULL,NULL,NULL,NULL,NULL),(181,'CONTACT','hk','hubungi',1,3,'{\"sectionTheme\":\"NAVY_WHITE\",\"hubungiIds\":[2],\"buttonLabels\":{\"2\":\"HUBUNGI KAMI\"},\"mode\":\"SPLIT_IMAGE_STACK\",\"showImage\":true,\"imageId\":147,\"headerText\":\"apix interior | Konsultasi Interior, Kitchen Set, & Furniture Custom\",\"bodyText\":\"Konsultasi desain interior & custom furniture bareng tim apix interior. Layanan populer: desain interior, jasa interior, interior rumah, custom furniture, kitchen set, lemari. Klik salah satu kontak di bawah untuk chat/telepon (bisa rename teks tombol).\",\"__themeKey\":\"theme_1\"}','2026-01-02 15:24:41.859','2026-01-04 00:53:08.074',NULL,NULL,NULL,NULL,NULL,NULL),(182,'SOCIAL','ms','social',1,4,'{\"sectionTheme\":\"WHITE_NAVY\",\"selected\":[{\"iconKey\":\"instagram\",\"nama\":\"Instagram\"},{\"iconKey\":\"whatsapp\",\"nama\":\"WhatsApp\"},{\"iconKey\":\"tiktok\",\"nama\":\"TikTok\"}],\"display\":{\"iconsOnly\":true},\"__themeKey\":\"theme_1\"}','2026-01-02 15:24:47.272','2026-01-04 01:32:00.533',NULL,NULL,NULL,NULL,NULL,NULL),(183,'CUSTOM_PROMO','cp','promo',1,5,'{\"title\":\"\",\"subtitle\":\"\",\"buttonLabel\":\"\",\"buttonHref\":\"\",\"imageId\":148,\"__themeKey\":\"theme_1\"}','2026-01-02 15:24:52.545','2026-01-03 06:26:57.170',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `homepagesectiondraft` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `homepagesectionitem`
--

DROP TABLE IF EXISTS `homepagesectionitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepagesectionitem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `HomepageSectionItem_homepageSectionId_fkey` (`homepageSectionId`),
  CONSTRAINT `HomepageSectionItem_homepageSectionId_fkey` FOREIGN KEY (`homepageSectionId`) REFERENCES `homepagesection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `homepagesectionitem`
--

LOCK TABLES `homepagesectionitem` WRITE;
/*!40000 ALTER TABLE `homepagesectionitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `homepagesectionitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `homepagesectionpublished`
--

DROP TABLE IF EXISTS `homepagesectionpublished`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepagesectionpublished` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('HERO','CATEGORY_GRID','PRODUCT_CAROUSEL','HIGHLIGHT_COLLECTION','ROOM_CATEGORY','GALLERY','BRANCHES','CONTACT','SOCIAL','CUSTOM_PROMO') NOT NULL,
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
  `heroSubheadline` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `homepagesectionpublished`
--

LOCK TABLES `homepagesectionpublished` WRITE;
/*!40000 ALTER TABLE `homepagesectionpublished` DISABLE KEYS */;
/*!40000 ALTER TABLE `homepagesectionpublished` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hubungi`
--

DROP TABLE IF EXISTS `hubungi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hubungi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nomor` varchar(191) NOT NULL,
  `prioritas` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hubungi`
--

LOCK TABLES `hubungi` WRITE;
/*!40000 ALTER TABLE `hubungi` DISABLE KEYS */;
INSERT INTO `hubungi` VALUES (2,'6282134313332',1,'2025-11-29 03:55:56.687','2025-11-29 03:56:17.758'),(3,'6285175020319',0,'2025-11-29 03:56:12.123','2025-11-29 03:56:17.749');
/*!40000 ALTER TABLE `hubungi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `informasi_toko`
--

DROP TABLE IF EXISTS `informasi_toko`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `informasi_toko` (
  `id` int(11) NOT NULL DEFAULT 1,
  `namaToko` varchar(191) NOT NULL,
  `deskripsi` varchar(191) NOT NULL,
  `logoUrl` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `informasi_toko`
--

LOCK TABLES `informasi_toko` WRITE;
/*!40000 ALTER TABLE `informasi_toko` DISABLE KEYS */;
INSERT INTO `informasi_toko` VALUES (1,'apix interior','interior ','/uploads/logos/e2dd7825-5cd9-4aea-ada3-429e1b7f3f1b.png','2025-11-29 06:00:47.346','2025-12-10 06:14:34.563');
/*!40000 ALTER TABLE `informasi_toko` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kategori_produk`
--

DROP TABLE IF EXISTS `kategori_produk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kategori_produk` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `isUnggulan` tinyint(1) NOT NULL DEFAULT 0,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `kategori_produk_slug_key` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kategori_produk`
--

LOCK TABLES `kategori_produk` WRITE;
/*!40000 ALTER TABLE `kategori_produk` DISABLE KEYS */;
INSERT INTO `kategori_produk` VALUES (81,'Set Dapur','set-dapur-qgpgzufv',0,1,'2025-12-25 21:08:46.239'),(82,'Meja Makan','meja-makan-qi55zr4v',0,2,'2025-12-25 21:08:48.094'),(83,'Furnitur Dapur','furnitur-dapur-qi79xxkh',0,3,'2025-12-25 21:08:48.170'),(84,'Rak Tv','rak-tv-oqvxm0iy',0,4,'2025-12-25 21:35:25.731'),(87,'Rak Dapur','rak-dapur-68donoec',0,7,'2026-01-02 04:46:37.553');
/*!40000 ALTER TABLE `kategori_produk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kategori_produk_item`
--

DROP TABLE IF EXISTS `kategori_produk_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kategori_produk_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kategoriId` int(11) NOT NULL,
  `produkId` int(11) NOT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kategori_produk_item_kategoriId_produkId_key` (`kategoriId`,`produkId`),
  KEY `kategori_produk_item_produkId_fkey` (`produkId`),
  CONSTRAINT `kategori_produk_item_kategoriId_fkey` FOREIGN KEY (`kategoriId`) REFERENCES `kategori_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `kategori_produk_item_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kategori_produk_item`
--

LOCK TABLES `kategori_produk_item` WRITE;
/*!40000 ALTER TABLE `kategori_produk_item` DISABLE KEYS */;
INSERT INTO `kategori_produk_item` VALUES (219,84,32,1),(220,84,33,2),(221,84,34,3),(222,82,28,1),(223,82,30,2),(224,82,29,3),(225,82,31,4),(232,81,26,1),(233,81,27,2),(234,81,24,3),(235,81,25,4),(236,83,24,1),(237,83,25,2),(238,83,31,3),(239,83,30,4),(240,83,29,5),(241,83,28,6),(242,83,26,7),(245,87,30,1);
/*!40000 ALTER TABLE `kategori_produk_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_sosial`
--

DROP TABLE IF EXISTS `media_sosial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `media_sosial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(191) NOT NULL,
  `iconKey` varchar(191) NOT NULL,
  `url` varchar(191) NOT NULL,
  `prioritas` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_sosial`
--

LOCK TABLES `media_sosial` WRITE;
/*!40000 ALTER TABLE `media_sosial` DISABLE KEYS */;
INSERT INTO `media_sosial` VALUES (1,'Instagram','instagram','https://www.instagram.com/apix_interior/',0,'2025-11-29 05:03:39.791','2025-11-30 00:30:47.073'),(2,'WhatsApp','whatsapp','https://wa.me/7834787483943',0,'2025-12-10 09:48:35.334','2025-12-10 09:48:35.334'),(3,'TikTok','tiktok','https://www.tiktok.com/apixinterior',0,'2025-12-10 09:48:44.860','2025-12-10 09:48:44.860');
/*!40000 ALTER TABLE `media_sosial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `navbaritem`
--

DROP TABLE IF EXISTS `navbaritem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `navbaritem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(191) NOT NULL,
  `href` varchar(191) NOT NULL,
  `position` enum('MAIN','FOOTER','BOTTOM') NOT NULL DEFAULT 'MAIN',
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isExternal` tinyint(1) NOT NULL DEFAULT 0,
  `iconKey` varchar(191) DEFAULT NULL,
  `showSearch` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `navbaritem`
--

LOCK TABLES `navbaritem` WRITE;
/*!40000 ALTER TABLE `navbaritem` DISABLE KEYS */;
/*!40000 ALTER TABLE `navbaritem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `navbarsetting`
--

DROP TABLE IF EXISTS `navbarsetting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `navbarsetting` (
  `id` int(11) NOT NULL DEFAULT 1,
  `theme` enum('NAVY_GOLD','WHITE_GOLD','NAVY_WHITE','GOLD_NAVY','GOLD_WHITE','WHITE_NAVY') NOT NULL DEFAULT 'NAVY_GOLD',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `navbarsetting`
--

LOCK TABLES `navbarsetting` WRITE;
/*!40000 ALTER TABLE `navbarsetting` DISABLE KEYS */;
INSERT INTO `navbarsetting` VALUES (1,'NAVY_GOLD','2025-12-13 06:50:09.698','2026-01-03 03:43:32.977');
/*!40000 ALTER TABLE `navbarsetting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produk`
--

DROP TABLE IF EXISTS `produk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `produk` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `deskripsiLengkap` varchar(191) DEFAULT NULL,
  `deskripsiSingkat` varchar(191) DEFAULT NULL,
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
  `promoValue` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `produk_slug_key` (`slug`),
  KEY `produk_mainImageId_fkey` (`mainImageId`),
  CONSTRAINT `produk_mainImageId_fkey` FOREIGN KEY (`mainImageId`) REFERENCES `gambar_upload` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produk`
--

LOCK TABLES `produk` WRITE;
/*!40000 ALTER TABLE `produk` DISABLE KEYS */;
INSERT INTO `produk` VALUES (24,'Kabinet Dapur Kitchen Set minimalist white','kabinet-dapur-kitchen-set-minimalist-white','Furniture Rumah','Kabinet Dapur',76,0,1,'SEO(Admin): core=Kitchen Set Atas; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-25 20:00:56.985','Kabinet Dapur Kitchen Set minimalist white dirancang untuk mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien di area Kompartemen dapat diatur agar alur aktivitas lebi','Kabinet Dapur yang menyesuaikan kebutuhan ruang di area dapur dengan hasil rapi dan mudah dirawat.','21–30 hari kerja','HPL + edging rapi',NULL,2199999,'mulai_dari',1,'ya',59,'Multipleks 18mm + rangka kayu','Kitchen Set Atas untuk Dapur di Jabodetabek. Material Multipleks 18mm + rangka kayu, finishing HPL + edging rapi. Tersedia opsi custom dimensi & layout. Cek.','Kitchen Set Atas Dapur | Jabodetabek | Material & Ukuran',247,13,'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl',222,'pre_order','Kayu Natural',2,0,NULL,NULL),(25,'Kabinet Dapur kitchen luxury black','kabinet-dapur-kitchen-luxury-black','Furniture Rumah','Kabinet Dapur',79,0,1,'SEO(Admin): core=Kitchen Set Atas; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-25 20:05:05.025','Kabinet Dapur kitchen luxury black cocok untuk mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien di area Kompartemen dapat diatur agar alur aktivitas lebih nyaman tan','Kabinet Dapur yang menyesuaikan kebutuhan ruang di area dapur tanpa membuat ruangan terlihat penuh.','21–30 hari kerja','HPL + edging rapi',NULL,2290000,'mulai_dari',1,'ya',59,'Multipleks 18mm + rangka kayu','Kitchen Set Atas untuk Dapur di Jabodetabek. Material Multipleks 18mm + rangka kayu, finishing HPL + edging rapi. Tersedia opsi custom dimensi & layout. Cek.','Kitchen Set Atas untuk Dapur • Jabodetabek | Harga per meter',292,13,'kitchen set atas, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl',233,'pre_order','Kayu Natural',3,0,NULL,NULL),(26,'Kabinet Dapur Kitchen dinning kayu Tropis','kabinet-dapur-kitchen-dinning-kayu-tropis','Furniture Rumah','Kabinet Dapur',83,0,1,'Harga mulai Rp 2.900.000/meter lari. Est total 2.27 m: Rp 6.580.000. SEO(Admin): core=Partisi Kisi Kayu; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi',9,'2025-12-25 20:51:19.665','Kabinet Dapur Kitchen dinning kayu Tropis membantu mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien. Kompartemen dapat diatur agar alur aktivitas lebih nyaman tanpa','Kabinet Dapur yang memberi ruang simpan praktis dengan hasil rapi dan mudah dirawat.','21–30 hari kerja','HPL + edging rapi',NULL,2900000,'mulai_dari',1,'ya',58,'Multipleks 18mm + rangka kayu','Partisi Kisi Kayu untuk Dapur — Jabodetabek. Material Multipleks 18mm + rangka kayu + finishing HPL + edging rapi. Bisa penyesuaian dimensi. Pastikan ukuran.','Dapur - Partisi Kisi Kayu - Jabodetabek | Harga per meter',227,13,'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',215,'pre_order','Kayu Natural',4,0,NULL,NULL),(27,'Partisi Kisi Kayu Custom untuk Dapur (per m²)','kabinet-dapur-partisi-kisi-kayu-custom-per-2','Furniture Rumah','Kabinet Dapur',87,0,1,'SEO(Admin): core=Partisi Kisi Kayu; room=Dapur; region=Jabodetabek; uom=per m². Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-25 21:01:45.298','Partisi Kisi Kayu Custom untuk Dapur (per m²) membantu mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien di area Atur kompartemen sesuai kebutuhan agar area terlihat ','Kabinet Dapur yang memberi ruang simpan praktis di area dapur dengan hasil rapi dan mudah dirawat.','21–30 hari kerja','HPL + edging rapi',NULL,2900000,'mulai_dari',1,'ya',58,'Multipleks 18mm + rangka kayu','Partisi Kisi Kayu untuk Dapur — Jabodetabek - Jawa Barat - Jawa Tengah - Jawa Timur. Material Multipleks 18mm + rangka kayu + finishing HPL + edging rapi. Bisa penyesuaian dimensi. Pastikan u','Dapur - Partisi kitchen set hitam minimalist • Jabodetabek - Jawa Barat - Jawa Tengah - Jawa Timur',227,13,'partisi kisi kayu, dapur, finishing, surface, jabodetabek, per m², kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',215,'pre_order','Kayu Natural',5,0,NULL,NULL),(28,'meja makan set kayu tropis','meja-makan-set-kayu-tropis','Furniture Rumah','Meja Makan',89,0,0,'SEO(Admin): core=Partisi Kisi Kayu; room=Kamar Mandi; region=Jabodetabek; uom=per m². Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-25 21:02:31.694','meja makan set kayu tropis dirancang untuk menjadi pusat aktivitas makan bersama dengan permukaan yang mudah dirawat di kamar. Atur kompartemen sesuai kebutuhan agar area terlihat lebih terta','Meja Makan yang membantu penataan lebih teratur di kamar dengan tampilan yang lebih tertata.','7–14 hari kerja','HPL + edging rapi',NULL,5040000,'fixed',0,'tidak',89,'Multipleks 18mm + rangka kayu','Partisi Kisi Kayu untuk Kamar Mandi di Jabodetabek. Material Multipleks 18mm + rangka kayu, finishing HPL + edging rapi. Cek ukuran area dan detail spesifikasi.','Partisi Kisi Kayu untuk Kamar Mandi | Jabodetabek',142,14,'partisi kisi kayu, kamar mandi, finishing, surface, jabodetabek, per m², meja makan, kamar, fungsional, ready stock, multipleks, hpl',73,'ready_stock','Kayu Natural',6,0,NULL,NULL),(29,'dinning set meja makan hitam','meja-makan-dinning-set-hitam','Furniture Rumah','Meja Makan',91,0,0,'SEO(Admin): core=Meja Belajar Built-in; room=Area Masuk / Foyer; region=Jabodetabek; uom=per unit. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-25 21:03:36.306','dinning set meja makan hitam cocok untuk menjadi pusat aktivitas makan bersama dengan permukaan yang mudah dirawat. Susunan penyimpanan bisa disesuaikan supaya ruang tetap lega dan mudah dipa','Meja Makan yang membantu penataan lebih teratur dengan tampilan yang lebih tertata.','7–14 hari kerja','HPL + edging rapi',NULL,2120000,'fixed',0,'tidak',77,'Multipleks 18mm + rangka kayu','Meja Belajar Built-in untuk Area Masuk / Foyer di Jabodetabek - Jawa Barat - Jawa Tengah - Jawa Timur. Material Multipleks 18mm + rangka kayu, finishing HPL + edging rapi. Cek ukuran area dan','Area Masuk / Foyer - Meja Belajar Built-in • Jabodetabek - Jawa Barat - Jawa Tengah - Jawa Timur',157,14,'meja belajar built-in, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per unit, meja makan, fungsional, ready stock, multipleks, hpl',76,'ready_stock','Kayu Natural',7,0,NULL,NULL),(30,'Meja Makan Japan Wood dinning set','meja-makan-japan-wood-dinning-set','Furniture Rumah','Meja Makan',93,0,1,'SEO(Admin): core=Rak Dinding Built-in; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-25 21:04:57.640','Meja Makan Japan Wood dinning set dirancang untuk menjadi pusat aktivitas makan bersama dengan permukaan yang mudah dirawat di area dapur. Atur kompartemen sesuai kebutuhan agar area terlihat','Meja Makan yang membuat area terasa lebih lega di area dapur tanpa membuat ruangan terlihat penuh.','7–14 hari kerja','HPL + edging rapi',NULL,2330000,'mulai_dari',1,'tidak',78,'Multipleks 18mm + rangka kayu','Rak Dinding Built-in untuk Dapur tersedia di Jabodetabek. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Bisa penyesuaian dimensi.','Rak Dinding Built-in untuk Dapur | Jabodetabek',193,14,'rak dinding built-in, dapur, built-in & storage, built-in, carpentry, jabodetabek, per meter, meja makan, fungsional, custom ukuran, multipleks, hpl',72,'pre_order','Kayu Natural',8,0,NULL,NULL),(31,'meja makan set minimalist white japan Seri Sora Pantry','meja-makan-set-minimalist-4','Furniture Rumah','Kabinet Dapur',97,0,1,'SEO(Admin): core=Pintu Kayu Solid Custom; room=Dapur; region=Jabodetabek; uom=per unit. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-25 21:07:32.896','Kabinet Dapur meja makan set minimalist white japan Seri Sora Pantry membantu mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien di area Atur kompartemen sesuai kebutu','Kabinet Dapur yang membuat area terasa lebih lega di area dapur tanpa membuat ruangan terlihat penuh.','21–30 hari kerja','HPL + edging rapi',NULL,1350000,'mulai_dari',1,'ya',61,'Multipleks 18mm + rangka kayu','meja makan set minimalist white japan untuk Dapur tersedia diseluruh pulau jawa. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Tersedia opsi custom.','meja makan set minimalist white japan | Jabodetabek | Material &',296,13,'pintu kayu solid custom, dapur, item, custom, jabodetabek, per unit, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',216,'pre_order','Kayu Natural',9,0,NULL,NULL),(32,'Rak TV backdrop Blackstone','rak-tv-backdrop-blackstone','Furniture Rumah','Rak TV',99,0,1,'Harga mulai Rp 2.100.000/m². Est total 2 m²: Rp 4.200.000. SEO(Admin): core=Backdrop TV Panel; room=Area Masuk / Foyer; region=Jabodetabek; uom=per m². Warna bisa berbeda; toleransi',9,'2025-12-25 21:32:35.475','Rak TV backdrop Blackstone membantu menata perangkat hiburan sekaligus menyimpan aksesori agar area utama rumah tetap rapi. Kompartemen dapat diatur agar alur aktivitas lebih nyaman tanpa mem','Rak TV yang membuat area terasa lebih lega dengan tampilan yang lebih tertata.','14–21 hari kerja','HPL + edging rapi',NULL,2100000,'mulai_dari',1,'ya',52,'Multipleks 18mm + rangka kayu','Backdrop TV Panel untuk Area Masuk / Foyer tersedia di Jabodetabek. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Opsi custom.','Backdrop TV Panel untuk Area Masuk / Foyer • Jabodetabek',173,15,'backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl',46,'pre_order','Kayu Natural',10,0,NULL,NULL),(33,'japanese backdrop tv','japanese-backdrop-tv','Furniture Rumah','Backdrop TV',101,0,1,'Harga mulai Rp 2.440.000/m². Est total 2 m²: Rp 4.880.000. SEO(Admin): core=Backdrop TV Panel; room=Area Masuk / Foyer; region=Jabodetabek; uom=per m². Warna bisa berbeda; toleransi',9,'2025-12-25 21:33:22.400','Rak TV japanese backdrop cocok untuk menata perangkat hiburan sekaligus menyimpan aksesori agar area utama rumah tetap rapi. Susunan penyimpanan bisa disesuaikan supaya ruang tetap lega dan m','Rak TV yang membuat area terasa lebih lega dengan tampilan yang lebih tertata.','14–21 hari kerja','HPL + edging rapi',NULL,2440000,'mulai_dari',1,'ya',36,'Multipleks 18mm + rangka kayu','Backdrop TV Panel untuk Area Masuk / Foyer — Jabodetabek. Material Multipleks 18mm + rangka kayu + finishing HPL + edging rapi. Opsi custom tersedia.','Area Masuk / Foyer - Backdrop TV Panel | Jabodetabek',181,16,'backdrop tv panel, area masuk / foyer, built-in & storage, built-in, carpentry, jabodetabek, per m², rak tv, fungsional, custom ukuran, multipleks, hpl',57,'pre_order','Kayu Natural',11,0,NULL,NULL),(34,'Backdrop TV Panel industrial Garasi - Rak | Jabodetabek','rak-tv-backdrop-panel-industrial-garasi','Furniture Rumah','Rak TV',103,0,1,'SEO(Admin): core=Backdrop TV Panel; room=Carport / Garasi; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-25 21:34:18.488','Backdrop TV Panel Custom untuk Carport / Garasi - Rak | Jabodetabek membantu menata perangkat hiburan sekaligus menyimpan aksesori agar area utama rumah tetap rapi. Susunan penyimpanan bisa d','Rak TV yang memberi ruang simpan praktis dengan hasil rapi dan mudah dirawat.','14–21 hari kerja','HPL + edging rapi',NULL,2850000,'mulai_dari',1,'ya',42,'Multipleks 18mm + rangka kayu','Backdrop TV Panel untuk Carport / Garasi di Jabodetabek. Material Multipleks 18mm + rangka kayu, finishing HPL + edging rapi. Opsi custom tersedia. Bandingkan.','Carport / Garasi - Backdrop TV Panel - Jabodetabek',153,15,'backdrop tv panel, carport / garasi, built-in & storage, built-in, carpentry, jabodetabek, per meter, rak tv, fungsional, custom ukuran, multipleks, hpl',59,'pre_order','Kayu Natural',12,1,'persen',10),(35,'Lemari Black minimalist','lemari-black-minimalist','Furniture Rumah',NULL,105,0,0,'SEO(Admin): core=Lemari; room=Carport / Garasi; region=Jabodetabek; uom=per unit. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-25 21:34:52.106','Lemari Black minimalist cocok untuk membantu menata kebutuhan harian agar ruang terasa lebih tertib. Atur kompartemen sesuai kebutuhan agar area terlihat lebih tertata.\r\n\r\nMaterial Multipleks','Lemari yang membuat area terasa lebih lega tanpa membuat ruangan terlihat penuh.','7–14 hari kerja','HPL + edging rapi',NULL,2480000,'fixed',0,'tidak',0,'Multipleks 18mm + rangka kayu','Lemari untuk Carport / Garasi tersedia di Jabodetabek. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Periksa detail produk sebelum.','Lemari untuk Carport / Garasi | Jabodetabek | Detail &',0,NULL,'lemari, carport / garasi, maintenance, jasa, jabodetabek, per unit, fungsional, ready stock, multipleks, hpl, warna natural, tips penataan',0,'ready_stock','Kayu Natural',13,0,NULL,NULL),(36,'Kabinet Dapur kitchen set marble','kabinet-dapur-kitchen-set-marble','Furniture Rumah','Kabinet Dapur',144,0,1,'Harga mulai Rp 2.810.000/meter lari. Est total 2.56 m: Rp 7.190.000. SEO(Admin): core=Kitchen Set; room=Dapur; region=Jabodetabek; uom=per meter. Warna bisa berbeda; toleransi ukuran;',9,'2025-12-29 07:41:03.518','Kabinet Dapur kitchen set marble cocok untuk mengatur peralatan dan bahan masak agar alur aktivitas dapur lebih efisien di area Susunan penyimpanan bisa disesuaikan supaya ruang tetap lega da','Kabinet Dapur yang menyesuaikan kebutuhan ruang di area dapur dengan hasil rapi dan mudah dirawat.','21–30 hari kerja','HPL + edging rapi',NULL,2810000,'mulai_dari',1,'ya',63,'Multipleks 18mm + rangka kayu','Kitchen Set untuk Dapur tersedia di Jabodetabek. Material Multipleks 18mm + rangka kayu dengan finishing HPL + edging rapi. Tersedia opsi custom dimensi &.','Dapur - Kitchen Set | Jabodetabek | Detail & Spesifikasi',256,13,'kitchen set, dapur, maintenance, jasa, jabodetabek, per meter, kabinet dapur, fungsional, custom ukuran, multipleks, hpl, warna natural',236,'pre_order','Kayu Natural',14,0,NULL,NULL),(37,'Cat Dinding Rapi untuk Area Masuk / Foyer | Jabodetabek','cat-dinding-rapi-area-masuk-foyer','Furniture Rumah',NULL,149,0,0,'SEO(Admin): core=Cat Dinding; room=Area Masuk / Foyer; region=Jabodetabek; uom=per unit. Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.',9,'2025-12-30 02:14:56.567','Cat Dinding Rapi untuk Area Masuk / Foyer | Jabodetabek dirancang untuk membantu menata kebutuhan harian agar ruang terasa lebih tertib. Atur kompartemen sesuai kebutuhan agar area terlihat l','Cat Dinding yang memberi ruang simpan praktis tanpa membuat ruangan terlihat penuh.','7–14 hari kerja','HPL + edging rapi',NULL,2680000,'fixed',0,'tidak',0,'Multipleks 18mm + rangka kayu','Cat Dinding untuk Area Masuk / Foyer — Jabodetabek. Material Multipleks 18mm + rangka kayu + finishing HPL + edging rapi. Cek ukuran area dan detail.','Area Masuk / Foyer - Cat Dinding | Jabodetabek',0,NULL,'cat dinding, area masuk / foyer, finishing, surface, jabodetabek, per unit, fungsional, ready stock, multipleks, hpl, warna natural, tips penataan',0,'ready_stock','Kayu Natural',1,0,NULL,NULL);
/*!40000 ALTER TABLE `produk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produk_galeri`
--

DROP TABLE IF EXISTS `produk_galeri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `produk_galeri` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produkId` int(11) NOT NULL,
  `gambarId` int(11) NOT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `produk_galeri_produkId_gambarId_key` (`produkId`,`gambarId`),
  KEY `produk_galeri_produkId_urutan_idx` (`produkId`,`urutan`),
  KEY `produk_galeri_gambarId_fkey` (`gambarId`),
  CONSTRAINT `produk_galeri_gambarId_fkey` FOREIGN KEY (`gambarId`) REFERENCES `gambar_upload` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `produk_galeri_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=307 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produk_galeri`
--

LOCK TABLES `produk_galeri` WRITE;
/*!40000 ALTER TABLE `produk_galeri` DISABLE KEYS */;
INSERT INTO `produk_galeri` VALUES (1,36,145,0),(2,36,146,1),(3,36,147,2),(4,36,148,3),(26,37,141,0),(27,37,146,1),(300,24,78,0),(301,24,77,1),(302,24,79,2),(303,24,80,3),(304,24,142,4),(305,24,84,5),(306,24,98,6);
/*!40000 ALTER TABLE `produk_galeri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subcategory`
--

DROP TABLE IF EXISTS `subcategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subcategory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `categoryId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Subcategory_categoryId_name_key` (`categoryId`,`name`),
  CONSTRAINT `Subcategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subcategory`
--

LOCK TABLES `subcategory` WRITE;
/*!40000 ALTER TABLE `subcategory` DISABLE KEYS */;
INSERT INTO `subcategory` VALUES (2,'dapur full set',1),(1,'kitchen set',1),(3,'rak tanaman',2),(4,'headboard',3),(5,'rak multifungsi',4),(6,'plant decoration',5),(7,'hiasan headboard',6),(8,'headboard',7),(9,'meja belajar',8),(16,'Backdrop TV',9),(10,'Backdrop TV / Lemari TV',9),(11,'Headboard / Tempat tidur',9),(13,'Kabinet Dapur',9),(12,'Kitchen set',9),(14,'Meja Makan',9),(15,'Rak TV',9);
/*!40000 ALTER TABLE `subcategory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `themesettings`
--

DROP TABLE IF EXISTS `themesettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `themesettings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `navbarBg` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'NAVY',
  `navbarText` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'WHITE',
  `sidebarBg` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'BLACK',
  `sidebarText` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'WHITE',
  `primaryColor` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'GOLD',
  `secondaryColor` enum('GOLD','NAVY','BLACK','WHITE') NOT NULL DEFAULT 'BLACK',
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `themesettings`
--

LOCK TABLES `themesettings` WRITE;
/*!40000 ALTER TABLE `themesettings` DISABLE KEYS */;
/*!40000 ALTER TABLE `themesettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variasi_galeri`
--

DROP TABLE IF EXISTS `variasi_galeri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `variasi_galeri` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `variasiProdukId` int(11) NOT NULL,
  `gambarId` int(11) NOT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `variasi_galeri_variasiProdukId_gambarId_key` (`variasiProdukId`,`gambarId`),
  KEY `variasi_galeri_variasiProdukId_urutan_idx` (`variasiProdukId`,`urutan`),
  KEY `variasi_galeri_gambarId_fkey` (`gambarId`),
  CONSTRAINT `variasi_galeri_gambarId_fkey` FOREIGN KEY (`gambarId`) REFERENCES `gambar_upload` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `variasi_galeri_variasiProdukId_fkey` FOREIGN KEY (`variasiProdukId`) REFERENCES `variasi_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variasi_galeri`
--

LOCK TABLES `variasi_galeri` WRITE;
/*!40000 ALTER TABLE `variasi_galeri` DISABLE KEYS */;
/*!40000 ALTER TABLE `variasi_galeri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variasi_kombinasi`
--

DROP TABLE IF EXISTS `variasi_kombinasi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `variasi_kombinasi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `variasi_kombinasi_variasiProdukId_level_nama_key` (`variasiProdukId`,`level`,`nama`),
  KEY `variasi_kombinasi_variasiProdukId_level_urutan_idx` (`variasiProdukId`,`level`,`urutan`),
  KEY `variasi_kombinasi_imageId_fkey` (`imageId`),
  CONSTRAINT `variasi_kombinasi_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `gambar_upload` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `variasi_kombinasi_variasiProdukId_fkey` FOREIGN KEY (`variasiProdukId`) REFERENCES `variasi_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=224 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variasi_kombinasi`
--

LOCK TABLES `variasi_kombinasi` WRITE;
/*!40000 ALTER TABLE `variasi_kombinasi` DISABLE KEYS */;
INSERT INTO `variasi_kombinasi` VALUES (216,76,1,'pyu','pyu',1000000,1,'persen',50,NULL,0,'2026-01-02 02:22:18.836'),(217,76,1,'gugu','gugu',0,0,NULL,NULL,NULL,1,'2026-01-02 02:22:18.846'),(218,76,1,'1','1',0,0,NULL,NULL,NULL,2,'2026-01-02 02:22:18.852'),(219,76,1,'3','3',0,0,NULL,NULL,NULL,3,'2026-01-02 02:22:18.858'),(220,77,1,'pyu__dedup2','pyu',1000000,1,'persen',50,NULL,0,'2026-01-02 02:22:18.871'),(221,77,1,'gugu__dedup2','gugu',0,0,NULL,NULL,NULL,1,'2026-01-02 02:22:18.876'),(222,77,1,'1__dedup2','1',0,0,NULL,NULL,NULL,2,'2026-01-02 02:22:18.880'),(223,77,1,'3__dedup2','3',0,0,NULL,NULL,NULL,3,'2026-01-02 02:22:18.886');
/*!40000 ALTER TABLE `variasi_kombinasi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variasi_produk`
--

DROP TABLE IF EXISTS `variasi_produk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `variasi_produk` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `variasi_produk_produkId_nama_key` (`produkId`,`nama`),
  KEY `variasi_produk_produkId_urutan_idx` (`produkId`,`urutan`),
  KEY `variasi_produk_imageId_fkey` (`imageId`),
  CONSTRAINT `variasi_produk_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `gambar_upload` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `variasi_produk_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variasi_produk`
--

LOCK TABLES `variasi_produk` WRITE;
/*!40000 ALTER TABLE `variasi_produk` DISABLE KEYS */;
INSERT INTO `variasi_produk` VALUES (5,37,'k','{\"label\":\"k\",\"price\":\"\",\"unitOverride\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"image\":{\"mode\":\"kolase\",\"kolaseId\":146,\"kolaseUrl\":\"/uploads/kabinet-dapur-kitchen-set-marble-bdac85e4-dd88-4a2d-a036-df395ff74b89-1600.webp\",\"uploadField\":\"variasiFotoUpload__id_af68a71c4bf61_19b7af08995\",\"uploadStatus\":\"\",\"uploadName\":\"\",\"uploadToken\":\"\"},\"gallery\":[],\"combos\":{\"lv1\":[]},\"titles\":{\"varTitle\":\"\",\"lv1Title\":\"\",\"lv2Title\":\"\",\"lv3Title\":\"\"}}','UNIT',0,0,NULL,NULL,146,NULL,1,0,'2026-01-01 19:25:41.333'),(76,24,'kk','{\"label\":\"kk\",\"price\":\"2000000\",\"unitOverride\":\"\",\"promo\":{\"active\":true,\"type\":\"percent\",\"value\":\"10\"},\"image\":{\"mode\":\"kolase\",\"kolaseId\":142,\"kolaseUrl\":\"/uploads/variasi-f-84194af8-75a0-48df-a4d8-660ac000df91-1600.webp\",\"uploadField\":\"variasiFotoUpload__id_77c68b22d0b938_19b6bd4024e\",\"uploadStatus\":\"\",\"uploadName\":\"\",\"uploadToken\":\"\"},\"gallery\":[],\"combos\":{\"lv1\":[{\"id\":\"id_ae738b351465c_19b7affa9f5\",\"label\":\"pyu\",\"addPrice\":\"1000000\",\"promo\":{\"active\":true,\"type\":\"percent\",\"value\":\"50\"},\"lv2\":[]},{\"id\":\"id_b75c596a4a7ac8_19b7affe05a\",\"label\":\"gugu\",\"addPrice\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"lv2\":[]},{\"id\":\"id_9dc435d7d7955_19b7b3720fa\",\"label\":\"1\",\"addPrice\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"lv2\":[]},{\"id\":\"id_45b555cb393b58_19b7b372e18\",\"label\":\"3\",\"addPrice\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"lv2\":[]}]},\"titles\":{\"varTitle\":\"Variasi\",\"lv1Title\":\"\",\"lv2Title\":\"\",\"lv3Title\":\"\"}}','UNIT',2000000,1,'persen',10,142,NULL,1,0,'2026-01-02 02:22:18.826'),(77,24,'p','{\"label\":\"p\",\"price\":\"\",\"unitOverride\":\"\",\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"},\"image\":{\"mode\":\"kolase\",\"kolaseId\":98,\"kolaseUrl\":\"/uploads/meja-makan-set-minimalist-white-japan-se-c24bfe73-9bcd-4d0a-ab10-9287a2e201b5-1600.webp\",\"uploadField\":\"variasiFotoUpload__25\",\"uploadStatus\":\"\",\"uploadName\":\"\",\"uploadToken\":\"\"},\"gallery\":[],\"combos\":{\"lv1\":[{\"id\":\"id_4bc269e5645198_19b7b31a19e\",\"label\":\"pyu\",\"addPrice\":\"1000000\",\"lv2\":[],\"promo\":{\"active\":true,\"type\":\"percent\",\"value\":\"50\"}},{\"id\":\"id_3dedad8215905_19b7b31a19e\",\"label\":\"gugu\",\"addPrice\":\"\",\"lv2\":[],\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"}},{\"id\":\"id_ccf15efc8265_19b7b37485f\",\"label\":\"1\",\"addPrice\":\"\",\"lv2\":[],\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"}},{\"id\":\"id_e472f84cd39cc_19b7b37485f\",\"label\":\"3\",\"addPrice\":\"\",\"lv2\":[],\"promo\":{\"active\":false,\"type\":\"percent\",\"value\":\"\"}}]},\"titles\":{\"varTitle\":\"Variasi\",\"lv1Title\":\"\",\"lv2Title\":\"\",\"lv3Title\":\"\"}}','UNIT',0,0,NULL,NULL,98,NULL,1,1,'2026-01-02 02:22:18.864');
/*!40000 ALTER TABLE `variasi_produk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'apixinterior'
--

--
-- Dumping routines for database 'apixinterior'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-04  9:17:26
