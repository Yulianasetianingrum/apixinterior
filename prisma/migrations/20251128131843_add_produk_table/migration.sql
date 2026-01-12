/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `produk` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `harga` to the `produk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `produk` ADD COLUMN `berat` INTEGER NULL,
    ADD COLUMN `bisaCustomUkuran` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `catatanKhusus` VARCHAR(191) NULL,
    ADD COLUMN `categoryId` INTEGER NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deskripsiLengkap` VARCHAR(191) NULL,
    ADD COLUMN `deskripsiSingkat` VARCHAR(191) NULL,
    ADD COLUMN `estimasiPengerjaan` VARCHAR(191) NULL,
    ADD COLUMN `finishing` VARCHAR(191) NULL,
    ADD COLUMN `garansi` VARCHAR(191) NULL,
    ADD COLUMN `harga` INTEGER NOT NULL,
    ADD COLUMN `hargaTipe` VARCHAR(191) NULL,
    ADD COLUMN `isCustom` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `jasaPasang` VARCHAR(191) NULL,
    ADD COLUMN `lebar` INTEGER NULL,
    ADD COLUMN `material` VARCHAR(191) NULL,
    ADD COLUMN `metaDescription` VARCHAR(191) NULL,
    ADD COLUMN `metaTitle` VARCHAR(191) NULL,
    ADD COLUMN `panjang` INTEGER NULL,
    ADD COLUMN `status` VARCHAR(191) NULL,
    ADD COLUMN `subcategoryId` INTEGER NULL,
    ADD COLUMN `tags` VARCHAR(191) NULL,
    ADD COLUMN `tinggi` INTEGER NULL,
    ADD COLUMN `tipeOrder` VARCHAR(191) NULL,
    ADD COLUMN `warna` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `produk_slug_key` ON `produk`(`slug`);
