-- CreateTable
CREATE TABLE `Produk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `kategori` VARCHAR(191) NULL,
    `subkategori` VARCHAR(191) NULL,
    `mainImageId` INTEGER NULL,
    `galleryImageIds` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
