-- CreateTable
CREATE TABLE `SensoresGenerales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `humedad` DOUBLE NOT NULL,
    `temperatura` DOUBLE NOT NULL,
    `lluvia` DOUBLE NOT NULL,
    `sol` DOUBLE NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Parcelas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idParcela` INTEGER NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `ubicacion` VARCHAR(191) NOT NULL,
    `responsable` VARCHAR(191) NOT NULL,
    `tipoCultivo` VARCHAR(191) NOT NULL,
    `ultimoRiego` DATETIME(3) NOT NULL,
    `humedad` DOUBLE NOT NULL,
    `temperatura` DOUBLE NOT NULL,
    `lluvia` DOUBLE NOT NULL,
    `sol` DOUBLE NOT NULL,
    `latitud` DOUBLE NOT NULL,
    `longitud` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SensoresParcelas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parcelaId` INTEGER NOT NULL,
    `humedad` DOUBLE NOT NULL,
    `temperatura` DOUBLE NOT NULL,
    `lluvia` DOUBLE NOT NULL,
    `sol` DOUBLE NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParcelasEliminadas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `ubicacion` VARCHAR(191) NOT NULL,
    `responsable` VARCHAR(191) NOT NULL,
    `tipoCultivo` VARCHAR(191) NOT NULL,
    `ultimoRiego` DATETIME(3) NOT NULL,
    `latitud` DOUBLE NOT NULL,
    `longitud` DOUBLE NOT NULL,
    `fechaEliminacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SensoresParcelas` ADD CONSTRAINT `SensoresParcelas_parcelaId_fkey` FOREIGN KEY (`parcelaId`) REFERENCES `Parcelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
