ALTER TABLE `orders`
  ADD COLUMN `riderId` VARCHAR(191) NULL,
  ADD INDEX `orders_riderId_idx` (`riderId`),
  ADD CONSTRAINT `orders_riderId_fkey` FOREIGN KEY (`riderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `delivery_tracking` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `riderId` VARCHAR(191) NOT NULL,
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `heading` DOUBLE NULL,
  `speed` DOUBLE NULL,
  `distanceMeters` INTEGER NULL,
  `etaSeconds` INTEGER NULL,
  `arrivedAt` DATETIME(3) NULL,
  `lastUpdatedAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `delivery_tracking_orderId_key` (`orderId`),
  INDEX `delivery_tracking_riderId_idx` (`riderId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `delivery_tracking_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `delivery_tracking_riderId_fkey` FOREIGN KEY (`riderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;