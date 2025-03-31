-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `activation_token` VARCHAR(36) NULL,
    `reset_password_token` VARCHAR(36) NULL,
    `created_on` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_activation_token_key`(`activation_token`),
    UNIQUE INDEX `users_reset_password_token_key`(`reset_password_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
