-- BD Market — schema + demo data
--
-- Generated 2026-09-17T12:04:31.777Z
-- 22 tables populated with 664 rows.
--
-- ⚠️  This file DROPS and recreates every table. Import it into an empty
--     database, or one whose contents you do not mind losing.
--
-- Import: hPanel → Databases → phpMyAdmin → select the database →
--         Import → choose this file → Go
--
-- Omitted as operational noise: AuditLog, SearchQuery, PageView

SET NAMES utf8mb4;

-- Foreign key checks MUST be off before the first DROP. Dropping a parent
-- table (User, Product, ...) fails with #1451 while any other table still
-- references it. They stay off for the inserts too, so table order in the
-- file does not matter, and are restored at the very end.
SET FOREIGN_KEY_CHECKS = 0;
-- CreateTable
DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'CUSTOMER',
    `avatar` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `AuditLog`;
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `meta` TEXT NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Customer`;
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `birthday` DATETIME(3) NULL,
    `district` VARCHAR(191) NULL,
    `tags` TEXT NULL,
    `notes` TEXT NULL,
    `avatar` TEXT NULL,
    `totalSpent` DOUBLE NOT NULL DEFAULT 0,
    `orderCount` INTEGER NOT NULL DEFAULT 0,
    `acceptsMarketing` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_userId_key`(`userId`),
    UNIQUE INDEX `Customer_email_key`(`email`),
    INDEX `Customer_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Address`;
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL DEFAULT 'Home',
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `division` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NULL,
    `street` VARCHAR(191) NOT NULL,
    `postcode` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Category`;
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameBn` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `image` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `metaTitle` TEXT NULL,
    `metaDesc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Brand`;
CREATE TABLE `Brand` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logo` TEXT NULL,
    `description` TEXT NULL,
    `country` VARCHAR(191) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Brand_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Product`;
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameBn` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `barcode` TEXT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'simple',
    `description` TEXT NULL,
    `shortDesc` TEXT NULL,
    `price` DOUBLE NOT NULL,
    `comparePrice` DOUBLE NULL,
    `costPrice` DOUBLE NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `stock` INTEGER NOT NULL DEFAULT 0,
    `lowStockAlert` INTEGER NOT NULL DEFAULT 5,
    `manageStock` BOOLEAN NOT NULL DEFAULT true,
    `stockStatus` VARCHAR(191) NOT NULL DEFAULT 'instock',
    `weight` DOUBLE NULL,
    `dimensions` TEXT NULL,
    `categoryId` VARCHAR(191) NULL,
    `brandId` VARCHAR(191) NULL,
    `images` TEXT NOT NULL,
    `tags` TEXT NULL,
    `attributes` TEXT NULL,
    `variants` TEXT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `bestseller` BOOLEAN NOT NULL DEFAULT false,
    `newArrival` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'published',
    `rating` DOUBLE NOT NULL DEFAULT 0,
    `reviewCount` INTEGER NOT NULL DEFAULT 0,
    `soldCount` INTEGER NOT NULL DEFAULT 0,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `fabric` VARCHAR(191) NULL,
    `occasion` VARCHAR(191) NULL,
    `fit` VARCHAR(191) NULL,
    `careInstructions` TEXT NULL,
    `countryOfOrigin` VARCHAR(191) NOT NULL DEFAULT 'Bangladesh',
    `metaTitle` TEXT NULL,
    `metaDesc` TEXT NULL,
    `metaKeywords` TEXT NULL,
    `ogImage` TEXT NULL,
    `canonical` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    UNIQUE INDEX `Product_sku_key`(`sku`),
    INDEX `Product_slug_idx`(`slug`),
    INDEX `Product_status_featured_idx`(`status`, `featured`),
    INDEX `Product_categoryId_idx`(`categoryId`),
    INDEX `Product_price_idx`(`price`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Cart`;
CREATE TABLE `Cart` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `couponCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cart_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `CartItem`;
CREATE TABLE `CartItem` (
    `id` VARCHAR(191) NOT NULL,
    `cartId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `variant` VARCHAR(191) NULL,
    `qty` INTEGER NOT NULL DEFAULT 1,
    `price` DOUBLE NOT NULL,

    UNIQUE INDEX `CartItem_cartId_productId_variant_key`(`cartId`, `productId`, `variant`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Wishlist`;
CREATE TABLE `Wishlist` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Wishlist_customerId_productId_key`(`customerId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Order`;
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `landingPageId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'unpaid',
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cod',
    `paymentRef` TEXT NULL,
    `subtotal` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `shippingCost` DOUBLE NOT NULL DEFAULT 0,
    `tax` DOUBLE NOT NULL DEFAULT 0,
    `total` DOUBLE NOT NULL,
    `couponCode` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `shippingMethod` TEXT NULL,
    `shippingZone` TEXT NULL,
    `shipDivision` VARCHAR(191) NOT NULL,
    `shipDistrict` VARCHAR(191) NOT NULL,
    `shipArea` TEXT NULL,
    `shipStreet` TEXT NOT NULL,
    `shipPostcode` VARCHAR(191) NULL,
    `customerNote` TEXT NULL,
    `adminNote` TEXT NULL,
    `trackingNumber` TEXT NULL,
    `courier` TEXT NULL,
    `ipAddress` TEXT NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `confirmedAt` DATETIME(3) NULL,
    `shippedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    INDEX `Order_orderNumber_idx`(`orderNumber`),
    INDEX `Order_status_idx`(`status`),
    INDEX `Order_createdAt_idx`(`createdAt`),
    INDEX `Order_landingPageId_idx`(`landingPageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `OrderItem`;
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `productName` TEXT NOT NULL,
    `variant` VARCHAR(191) NULL,
    `sku` TEXT NULL,
    `image` TEXT NULL,
    `price` DOUBLE NOT NULL,
    `qty` INTEGER NOT NULL,
    `total` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `OrderEvent`;
CREATE TABLE `OrderEvent` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `by` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Coupon`;
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'percent',
    `value` DOUBLE NOT NULL,
    `minOrder` DOUBLE NOT NULL DEFAULT 0,
    `maxDiscount` DOUBLE NULL,
    `usageLimit` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `perCustomer` INTEGER NOT NULL DEFAULT 1,
    `appliesTo` VARCHAR(191) NOT NULL DEFAULT 'all',
    `targetIds` TEXT NULL,
    `startsAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Review`;
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorEmail` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `title` TEXT NULL,
    `body` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `helpful` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Review_productId_status_idx`(`productId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Page`;
CREATE TABLE `Page` (
    `id` VARCHAR(191) NOT NULL,
    `title` TEXT NOT NULL,
    `titleBn` TEXT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `excerpt` TEXT NULL,
    `template` VARCHAR(191) NOT NULL DEFAULT 'default',
    `status` VARCHAR(191) NOT NULL DEFAULT 'published',
    `showInMenu` BOOLEAN NOT NULL DEFAULT false,
    `menuOrder` INTEGER NOT NULL DEFAULT 0,
    `featuredImage` TEXT NULL,
    `metaTitle` TEXT NULL,
    `metaDesc` TEXT NULL,
    `metaKeywords` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Page_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Post`;
CREATE TABLE `Post` (
    `id` VARCHAR(191) NOT NULL,
    `title` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `coverImage` TEXT NULL,
    `category` TEXT NULL,
    `tags` TEXT NULL,
    `authorName` TEXT NOT NULL DEFAULT 'BD Market Team',
    `status` VARCHAR(191) NOT NULL DEFAULT 'published',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `readMinutes` INTEGER NOT NULL DEFAULT 4,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `metaTitle` TEXT NULL,
    `metaDesc` TEXT NULL,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Post_slug_key`(`slug`),
    INDEX `Post_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Menu`;
CREATE TABLE `Menu` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `items` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Menu_location_key`(`location`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Banner`;
CREATE TABLE `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `title` TEXT NOT NULL,
    `subtitle` TEXT NULL,
    `image` TEXT NOT NULL,
    `ctaLabel` TEXT NULL,
    `ctaHref` TEXT NULL,
    `position` VARCHAR(191) NOT NULL DEFAULT 'hero',
    `bgColor` TEXT NULL,
    `textColor` TEXT NULL,
    `position_order` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Media`;
CREATE TABLE `Media` (
    `id` VARCHAR(191) NOT NULL,
    `filename` TEXT NOT NULL,
    `url` TEXT NOT NULL,
    `mimeType` TEXT NULL,
    `size` INTEGER NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `alt` TEXT NULL,
    `folder` VARCHAR(191) NOT NULL DEFAULT 'uploads',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Setting`;
CREATE TABLE `Setting` (
    `id` VARCHAR(191) NOT NULL,
    `group` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'text',
    `label` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Setting_key_key`(`key`),
    INDEX `Setting_group_idx`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `ShippingZone`;
CREATE TABLE `ShippingZone` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `districts` TEXT NOT NULL,
    `method` VARCHAR(191) NOT NULL DEFAULT 'flat',
    `rate` DOUBLE NOT NULL DEFAULT 0,
    `freeOver` DOUBLE NULL,
    `minDays` INTEGER NOT NULL DEFAULT 2,
    `maxDays` INTEGER NOT NULL DEFAULT 5,
    `codEnabled` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `PaymentMethod`;
CREATE TABLE `PaymentMethod` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameBn` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `icon` TEXT NULL,
    `instructions` TEXT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `isSandbox` BOOLEAN NOT NULL DEFAULT true,
    `fee` DOUBLE NOT NULL DEFAULT 0,
    `feeType` VARCHAR(191) NOT NULL DEFAULT 'fixed',
    `config` TEXT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentMethod_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `TaxRate`;
CREATE TABLE `TaxRate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'BD',
    `rate` DOUBLE NOT NULL DEFAULT 0,
    `inclusive` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `PageView`;
CREATE TABLE `PageView` (
    `id` VARCHAR(191) NOT NULL,
    `path` TEXT NOT NULL,
    `referrer` TEXT NULL,
    `sessionId` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PageView_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `SearchQuery`;
CREATE TABLE `SearchQuery` (
    `id` VARCHAR(191) NOT NULL,
    `query` VARCHAR(191) NOT NULL,
    `results` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SearchQuery_query_idx`(`query`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `Newsletter`;
CREATE TABLE `Newsletter` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'subscribed',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Newsletter_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
DROP TABLE IF EXISTS `LandingPage`;
CREATE TABLE `LandingPage` (
    `id` VARCHAR(191) NOT NULL,
    `title` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `parentSlug` VARCHAR(191) NOT NULL DEFAULT 'collection',
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `blocks` LONGTEXT NOT NULL,
    `metaTitle` TEXT NULL,
    `metaDesc` TEXT NULL,
    `metaKeywords` TEXT NULL,
    `ogImage` TEXT NULL,
    `canonical` TEXT NULL,
    `noIndex` BOOLEAN NOT NULL DEFAULT false,
    `gaId` TEXT NULL,
    `fbPixelId` TEXT NULL,
    `customHead` LONGTEXT NULL,
    `customBody` LONGTEXT NULL,
    `bgColor` TEXT NULL,
    `textColor` TEXT NULL,
    `fontFamily` TEXT NULL,
    `maxWidth` INTEGER NOT NULL DEFAULT 1100,
    `checkoutEnabled` BOOLEAN NOT NULL DEFAULT true,
    `checkoutHeading` TEXT NULL,
    `checkoutFields` TEXT NULL,
    `checkoutButton` TEXT NULL,
    `thankYouNote` TEXT NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LandingPage_slug_key`(`slug`),
    INDEX `LandingPage_status_idx`(`status`),
    INDEX `LandingPage_parentSlug_slug_idx`(`parentSlug`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wishlist` ADD CONSTRAINT `Wishlist_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_landingPageId_fkey` FOREIGN KEY (`landingPageId`) REFERENCES `LandingPage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderEvent` ADD CONSTRAINT `OrderEvent_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- ═══════════════════════════════════════════════════════════
-- Demo data
-- ═══════════════════════════════════════════════════════════

-- Address: 8 rows
INSERT INTO `Address` (`id`, `customerId`, `label`, `fullName`, `phone`, `division`, `district`, `area`, `street`, `postcode`, `isDefault`, `createdAt`) VALUES
('cmtzd3npr003h670t7h5w90l9','cmtzd3npr003g670tlz8dxy4n','Home','Rahim Ahmed','+8801711000001','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',1,'2026-09-13 05:16:59.728'),
('cmtzd3num003l670tpg0pzdfo','cmtzd3nul003k670tomx48gvy','Home','Fatema Begum','+8801711000002','Chattogram','Chattogram','Sadar','House 10, Road 3','1000',1,'2026-09-13 05:16:59.902'),
('cmtzd3o0e003p670tmrjcebrc','cmtzd3o0e003o670t147xaz7v','Home','Karim Hossain','+8801711000003','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',1,'2026-09-13 05:17:00.111'),
('cmtzd3o5g003t670ttg1uqfk3','cmtzd3o5g003s670tie78vrx6','Home','Nusrat Jahan','+8801711000004','Sylhet','Sylhet','Sadar','House 10, Road 3','1000',1,'2026-09-13 05:17:00.293'),
('cmtzd3o9v003x670tatx0f9kb','cmtzd3o9v003w670tn84f2p4c','Home','Tanvir Islam','+8801711000005','Khulna','Khulna','Sadar','House 10, Road 3','1000',1,'2026-09-13 05:17:00.451'),
('cmtzd3oea0041670t5anuw5kl','cmtzd3oea0040670t7iw1tivt','Home','Sadia Rahman','+8801711000006','Rajshahi','Rajshahi','Sadar','House 10, Road 3','1000',1,'2026-09-13 05:17:00.610'),
('cmtzd3oj30045670tu7suark2','cmtzd3oj30044670twbzlk59a','Home','Imran Khan','+8801711000007','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',1,'2026-09-13 05:17:00.784'),
('cmtzd3onk0049670tbh63wuux','cmtzd3onk0048670tlg249haq','Home','Ayesha Siddika','+8801711000008','Dhaka','Gazipur','Sadar','House 10, Road 3','1000',1,'2026-09-13 05:17:00.944');

-- Banner: 5 rows
INSERT INTO `Banner` (`id`, `title`, `subtitle`, `image`, `ctaLabel`, `ctaHref`, `position`, `bgColor`, `textColor`, `position_order`, `status`, `startsAt`, `endsAt`, `createdAt`) VALUES
('cmtzd3p71005e670tk5gds2i3','Eid Collection 2026','Hand-embroidered panjabi, muslin Jamdani & festive three-piece — up to 30% off','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80','Shop Eid Collection','/shop?sort=newest','hero','#006a4e','#ffffff',0,'active',NULL,NULL,'2026-09-13 05:17:01.645'),
('cmtzd3p71005f670t5z6n5sek','Heritage Jamdani','Handwoven by Narayanganj master weavers — a piece of Bangladesh you can wear','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80','Explore Jamdani','/category/saree','hero','#1f2533','#ffffff',1,'active',NULL,NULL,'2026-09-13 05:17:01.645'),
('cmtzd3p71005g670txok1wwrw','Modest Fashion','Premium georgette hijab & nida abaya — comfort with grace','https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80','Shop Modest Wear','/category/hijab-abaya','hero','#7c2d12','#ffffff',2,'active',NULL,NULL,'2026-09-13 05:17:01.645'),
('cmtzd3p71005h670thkq4c8d1','Free Delivery over ৳2,000','Inside Dhaka — 1 to 2 days','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80','Start Shopping','/shop','promo-1',NULL,NULL,0,'active',NULL,NULL,'2026-09-13 05:17:01.645'),
('cmtzd3p71005i670t8dxjroz4','Cash on Delivery','All 64 districts of Bangladesh','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80','Learn More','/pages/shipping','promo-2',NULL,NULL,0,'active',NULL,NULL,'2026-09-13 05:17:01.645');

-- Brand: 10 rows
INSERT INTO `Brand` (`id`, `name`, `slug`, `logo`, `description`, `country`, `featured`, `status`, `createdAt`) VALUES
('cmtzd3kd90010670tvq03ubqt','Aarong','aarong',NULL,'Iconic Bangladeshi lifestyle brand by BRAC.','Bangladesh',1,'active','2026-09-13 05:16:55.389'),
('cmtzd3kfc0011670ti5rzbafy','Yellow','yellow',NULL,'Contemporary Bangladeshi fashion label.','Bangladesh',1,'active','2026-09-13 05:16:55.465'),
('cmtzd3khm0012670tsfj4s9ng','Sailor','sailor',NULL,NULL,'Bangladesh',1,'active','2026-09-13 05:16:55.546'),
('cmtzd3kjq0013670tg0wt2yo8','Dorjibari','dorjibari',NULL,NULL,'Bangladesh',1,'active','2026-09-13 05:16:55.623'),
('cmtzd3klx0014670tq7karsgc','Ecstasy','ecstasy',NULL,NULL,'Bangladesh',0,'active','2026-09-13 05:16:55.701'),
('cmtzd3kof0015670twr14gt7s','Rang Bangladesh','rang-bangladesh',NULL,NULL,'Bangladesh',0,'active','2026-09-13 05:16:55.792'),
('cmtzd3kr40016670t1ibypigr','Kay Kraft','kay-kraft',NULL,NULL,'Bangladesh',1,'active','2026-09-13 05:16:55.889'),
('cmtzd3ktc0017670tpi3cbnry','Anjan''s','anjans',NULL,NULL,'Bangladesh',0,'active','2026-09-13 05:16:55.969'),
('cmtzd3kw10018670th1z6k1sj','Le Reve','le-reve',NULL,NULL,'Bangladesh',0,'active','2026-09-13 05:16:56.065'),
('cmtzd3kyl0019670t33570m2l','Infinity','infinity',NULL,NULL,'Bangladesh',0,'active','2026-09-13 05:16:56.158');

-- Category: 21 rows
INSERT INTO `Category` (`id`, `name`, `nameBn`, `slug`, `description`, `image`, `icon`, `parentId`, `position`, `featured`, `status`, `metaTitle`, `metaDesc`, `createdAt`, `updatedAt`) VALUES
('cmtzd3izc0003670tyxipmxpj','Women','মহিলা','women',NULL,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80','👗',NULL,0,1,'active','Women Collection — মহিলা | BD Market','Shop premium women collection in Bangladesh. Authentic quality, cash on delivery nationwide.','2026-09-13 05:16:53.592','2026-09-13 05:16:53.592'),
('cmtzd3j1t0005670tix9sh0ls','Saree','শাড়ি','saree',NULL,'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80','🥻','cmtzd3izc0003670tyxipmxpj',0,0,'active','Saree — Buy Online in Bangladesh | BD Market','Buy saree online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:53.681','2026-09-13 05:16:53.681'),
('cmtzd3j4a0007670temwomp34','Kurti','কুর্তি','kurti',NULL,'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80','👚','cmtzd3izc0003670tyxipmxpj',1,0,'active','Kurti — Buy Online in Bangladesh | BD Market','Buy kurti online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:53.770','2026-09-13 05:16:53.770'),
('cmtzd3j6g0009670tgetxzsg4','Three Piece','থ্রি-পিস','three-piece',NULL,'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80','✨','cmtzd3izc0003670tyxipmxpj',2,0,'active','Three Piece — Buy Online in Bangladesh | BD Market','Buy three piece online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:53.849','2026-09-13 05:16:53.849'),
('cmtzd3j8n000b670t083s1v97','Salwar Kameez','সালোয়ার কামিজ','salwar-kameez',NULL,'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80','🎀','cmtzd3izc0003670tyxipmxpj',3,0,'active','Salwar Kameez — Buy Online in Bangladesh | BD Market','Buy salwar kameez online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:53.927','2026-09-13 05:16:53.927'),
('cmtzd3jc7000d670tytl3rknt','Lehenga','লেহেঙ্গা','lehenga',NULL,'https://images.unsplash.com/photo-1583935064411-7f41c23b22b1?auto=format&fit=crop&w=900&q=80','💃','cmtzd3izc0003670tyxipmxpj',4,0,'active','Lehenga — Buy Online in Bangladesh | BD Market','Buy lehenga online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:54.056','2026-09-13 05:16:54.056'),
('cmtzd3jex000f670twngf4zdu','Hijab & Abaya','হিজাব ও আবায়া','hijab-abaya',NULL,'https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80','🧕','cmtzd3izc0003670tyxipmxpj',5,0,'active','Hijab & Abaya — Buy Online in Bangladesh | BD Market','Buy hijab & abaya online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:54.154','2026-09-13 05:16:54.154'),
('cmtzd3jh7000h670tu25ce1kg','Dupatta & Orna','ওড়না','dupatta-orna',NULL,'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=80','🧣','cmtzd3izc0003670tyxipmxpj',6,0,'active','Dupatta & Orna — Buy Online in Bangladesh | BD Market','Buy dupatta & orna online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:54.235','2026-09-13 05:16:54.235'),
('cmtzd3jjd000i670t4vnnyfdd','Men','পুরুষ','men',NULL,'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80','👔',NULL,1,1,'active','Men Collection — পুরুষ | BD Market','Shop premium men collection in Bangladesh. Authentic quality, cash on delivery nationwide.','2026-09-13 05:16:54.314','2026-09-13 05:16:54.314'),
('cmtzd3jlm000k670tg5b5m7tm','Panjabi','পাঞ্জাবি','panjabi',NULL,'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80','🕌','cmtzd3jjd000i670t4vnnyfdd',0,0,'active','Panjabi — Buy Online in Bangladesh | BD Market','Buy panjabi online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:54.394','2026-09-13 05:16:54.394'),
('cmtzd3jnr000m670tuvrgct4c','Shirt','শার্ট','shirt',NULL,'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80','👔','cmtzd3jjd000i670t4vnnyfdd',1,0,'active','Shirt — Buy Online in Bangladesh | BD Market','Buy shirt online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:54.472','2026-09-13 05:16:54.472'),
('cmtzd3jpx000o670t05zyjeax','T-Shirt & Polo','টি-শার্ট ও পোলো','t-shirt-polo',NULL,'https://images.unsplash.com/photo-1586790170083-2f7cead4c9d3?auto=format&fit=crop&w=900&q=80','👕','cmtzd3jjd000i670t4vnnyfdd',2,0,'active','T-Shirt & Polo — Buy Online in Bangladesh | BD Market','Buy t-shirt & polo online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:54.549','2026-09-13 05:16:54.549'),
('cmtzd3js5000q670t7j5l9jzp','Pant & Trouser','প্যান্ট','pant-trouser',NULL,'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80','👖','cmtzd3jjd000i670t4vnnyfdd',3,0,'active','Pant & Trouser — Buy Online in Bangladesh | BD Market','Buy pant & trouser online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:54.629','2026-09-13 05:16:54.629'),
('cmtzd3ju8000s670ticz3dmpy','Kabli & Jubba','কাবলি ও জুব্বা','kabli-jubba',NULL,'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80','🧥','cmtzd3jjd000i670t4vnnyfdd',4,0,'active','Kabli & Jubba — Buy Online in Bangladesh | BD Market','Buy kabli & jubba online in Bangladesh at best price. Free shipping over ৳2000.','2026-09-13 05:16:54.704','2026-09-13 05:16:54.704'),
('cmtzd3jwm000t670tn0n8ofo3','Kids','শিশু','kids',NULL,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=80','🧒',NULL,2,0,'active','Kids Collection — শিশু | BD Market','Shop premium kids collection in Bangladesh. Authentic quality, cash on delivery nationwide.','2026-09-13 05:16:54.790','2026-09-13 05:16:54.790'),
('cmtzd3jyu000u670t6s7kw5jj','Accessories','এক্সেসরিজ','accessories',NULL,'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80','👜',NULL,3,0,'active','Accessories Collection — এক্সেসরিজ | BD Market','Shop premium accessories collection in Bangladesh. Authentic quality, cash on delivery nationwide.','2026-09-13 05:16:54.870','2026-09-13 05:16:54.870'),
('cmtzd3k0z000v670t9rfjy8wr','Jewellery','গহনা','jewellery',NULL,'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80','💍',NULL,4,1,'active','Jewellery Collection — গহনা | BD Market','Shop premium jewellery collection in Bangladesh. Authentic quality, cash on delivery nationwide.','2026-09-13 05:16:54.948','2026-09-13 05:16:54.948'),
('cmtzd3k3n000w670t97gv7klr','Watches','ঘড়ি','watches',NULL,'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80','⌚',NULL,5,0,'active','Watches Collection — ঘড়ি | BD Market','Shop premium watches collection in Bangladesh. Authentic quality, cash on delivery nationwide.','2026-09-13 05:16:55.044','2026-09-13 05:16:55.044'),
('cmtzd3k6g000x670tryp1mpct','Shoes','জুতা','shoes',NULL,'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80','👟',NULL,6,0,'active','Shoes Collection — জুতা | BD Market','Shop premium shoes collection in Bangladesh. Authentic quality, cash on delivery nationwide.','2026-09-13 05:16:55.144','2026-09-13 05:16:55.144'),
('cmtzd3k8w000y670toz3wgaka','Beauty & Fragrance','বিউটি ও সুগন্ধি','beauty-fragrance',NULL,'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80','💐',NULL,7,0,'active','Beauty & Fragrance Collection — বিউটি ও সুগন্ধি | BD Market','Shop premium beauty & fragrance collection in Bangladesh. Authentic quality, cash on delivery nationwide.','2026-09-13 05:16:55.232','2026-09-13 05:16:55.232'),
('cmtzd3kb5000z670ttg6zrnff','Home & Living','হোম ও লিভিং','home-living',NULL,'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80','🏠',NULL,8,0,'active','Home & Living Collection — হোম ও লিভিং | BD Market','Shop premium home & living collection in Bangladesh. Authentic quality, cash on delivery nationwide.','2026-09-13 05:16:55.313','2026-09-13 05:16:55.313');

-- Coupon: 6 rows
INSERT INTO `Coupon` (`id`, `code`, `description`, `type`, `value`, `minOrder`, `maxDiscount`, `usageLimit`, `usedCount`, `perCustomer`, `appliesTo`, `targetIds`, `startsAt`, `expiresAt`, `status`, `createdAt`) VALUES
('cmtzd3oqa004a670tu5idxhyc','WELCOME10','10% off your first order','percent',10,1000,500,1000,143,1,'all',NULL,NULL,NULL,'active','2026-09-13 05:17:01.042'),
('cmtzd3oqa004b670trc6abev7','EIDSALE25','Eid Special — 25% off','percent',25,3000,2000,500,89,1,'all',NULL,NULL,NULL,'active','2026-09-13 05:17:01.042'),
('cmtzd3oqa004c670t5twv4j71','FLAT300','Flat ৳300 off orders over ৳2500','fixed',300,2500,NULL,300,57,1,'all',NULL,NULL,NULL,'active','2026-09-13 05:17:01.042'),
('cmtzd3oqa004d670tmzkruim0','FREESHIP','Free shipping on any order','freeship',0,500,NULL,2000,412,1,'all',NULL,NULL,NULL,'active','2026-09-13 05:17:01.042'),
('cmtzd3oqa004e670t5230rp88','BOISHakh15','Pohela Boishakh 15% off','percent',15,2000,1200,800,31,1,'all',NULL,NULL,NULL,'active','2026-09-13 05:17:01.042'),
('cmtzd3oqa004f670t8i1ycq4k','NEWUSER500','৳500 off for new customers','fixed',500,3000,NULL,500,76,1,'all',NULL,NULL,NULL,'active','2026-09-13 05:17:01.042');

-- Customer: 8 rows
INSERT INTO `Customer` (`id`, `userId`, `email`, `name`, `phone`, `gender`, `birthday`, `district`, `tags`, `notes`, `avatar`, `totalSpent`, `orderCount`, `acceptsMarketing`, `createdAt`, `updatedAt`) VALUES
('cmtzd3npr003g670tlz8dxy4n','cmtzd3nnk003e670t3jmaj1w1','rahim@example.com','Rahim Ahmed','+8801711000001',NULL,NULL,'Dhaka','vip,regular',NULL,NULL,2570,1,1,'2026-09-13 05:16:59.728','2026-09-13 05:17:13.281'),
('cmtzd3nul003k670tomx48gvy','cmtzd3nsd003i670ttrn4oghk','fatema@example.com','Fatema Begum','+8801711000002',NULL,NULL,'Chattogram','regular',NULL,NULL,26387,3,1,'2026-09-13 05:16:59.902','2026-09-13 05:17:14.338'),
('cmtzd3o0e003o670t147xaz7v','cmtzd3nwv003m670ti5e79up0','karim@example.com','Karim Hossain','+8801711000003',NULL,NULL,'Dhaka','new',NULL,NULL,13490,1,1,'2026-09-13 05:17:00.111','2026-09-13 05:17:14.502'),
('cmtzd3o5g003s670tie78vrx6','cmtzd3o32003q670tmr7orvra','nusrat@example.com','Nusrat Jahan','+8801711000004',NULL,NULL,'Sylhet','vip',NULL,NULL,56093,3,1,'2026-09-13 05:17:00.293','2026-09-13 05:17:15.583'),
('cmtzd3o9v003w670tn84f2p4c','cmtzd3o7n003u670tzvnyxoam','tanvir@example.com','Tanvir Islam','+8801711000005',NULL,NULL,'Khulna','regular',NULL,NULL,2650,1,1,'2026-09-13 05:17:00.451','2026-09-13 05:17:15.761'),
('cmtzd3oea0040670t7iw1tivt','cmtzd3oc4003y670tfwvdv0ub','sadia@example.com','Sadia Rahman','+8801711000006',NULL,NULL,'Rajshahi','new',NULL,NULL,44265,3,1,'2026-09-13 05:17:00.610','2026-09-13 05:17:15.924'),
('cmtzd3oj30044670twbzlk59a','cmtzd3ogh0042670t8iu1ceu6','imran@example.com','Imran Khan','+8801711000007',NULL,NULL,'Dhaka','regular',NULL,NULL,3450,1,1,'2026-09-13 05:17:00.784','2026-09-13 05:17:12.053'),
('cmtzd3onk0048670tlg249haq','cmtzd3olf0046670td1ygf3q1','ayesha@example.com','Ayesha Siddika','+8801711000008',NULL,NULL,'Gazipur','vip,regular',NULL,NULL,23210,3,1,'2026-09-13 05:17:00.944','2026-09-17 09:58:26.260');

-- LandingPage: 1 row
INSERT INTO `LandingPage` (`id`, `title`, `slug`, `parentSlug`, `status`, `blocks`, `metaTitle`, `metaDesc`, `metaKeywords`, `ogImage`, `canonical`, `noIndex`, `gaId`, `fbPixelId`, `customHead`, `customBody`, `bgColor`, `textColor`, `fontFamily`, `maxWidth`, `checkoutEnabled`, `checkoutHeading`, `checkoutFields`, `checkoutButton`, `thankYouNote`, `views`, `createdAt`, `updatedAt`) VALUES
('cmu4zivnw00043r3w7deueywb','Eid Panjabi Offer','eid-panjabi','collection','published','[{"id":"h1","type":"hero","props":{"image":"","heading":"Eid Panjabi Collection","subheading":"Limited stock","ctaLabel":"Order now","ctaHref":"#order","overlay":45,"height":420,"align":"center"},"style":{}},{"id":"p1","type":"products","props":{"productIds":["cmtzd3l6d001f670tp6nhorg9"],"layout":"single","showPrice":true,"showCompare":true,"showBuy":true,"buyLabel":"Order now"},"style":{}},{"id":"c1","type":"checkout","props":{"heading":"Order now","subheading":"Cash on delivery","buttonLabel":"Place order","successText":"Thank you!","fields":["customerName","phone","district","street"],"required":["customerName","phone","district","street"]},"style":{}},{"id":"bmu51f7m8916va","type":"text","props":{"text":"Describe the product, the offer, or why it is worth buying.","align":"left","size":"base"},"style":{}}]','Eid Panjabi — 30% off','Limited Eid collection with cash on delivery.',NULL,NULL,NULL,0,'G-TEST12345',NULL,NULL,NULL,NULL,NULL,NULL,1100,1,NULL,NULL,NULL,NULL,0,'2026-09-17 03:43:32.300','2026-09-17 05:05:03.569');

-- Media: 48 rows
INSERT INTO `Media` (`id`, `filename`, `url`, `mimeType`, `size`, `width`, `height`, `alt`, `folder`, `createdAt`) VALUES
('cmtzd49cn00q9670t0797b6hd','panjabi1.jpg','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80','image/jpeg',120000,900,1200,'panjabi','products','2026-09-13 05:17:27.768'),
('cmtzd49cn00qa670t1dg82lom','panjabi2.jpg','https://images.unsplash.com/photo-1603252109303-2751441e0052?auto=format&fit=crop&w=900&q=80','image/jpeg',128000,900,1200,'panjabi','products','2026-09-13 05:17:27.768'),
('cmtzd49cn00qb670t8cdka18s','saree1.jpg','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80','image/jpeg',136000,900,1200,'saree','products','2026-09-13 05:17:27.768'),
('cmtzd49cn00qc670thhrttmlt','saree2.jpg','https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80','image/jpeg',144000,900,1200,'saree','products','2026-09-13 05:17:27.768'),
('cmtzd49cn00qd670tmcz0s1hw','saree3.jpg','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80','image/jpeg',152000,900,1200,'saree','products','2026-09-13 05:17:27.768'),
('cmtzd49cn00qe670twjrj75d0','kurti1.jpg','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80','image/jpeg',160000,900,1200,'kurti','products','2026-09-13 05:17:27.768'),
('cmtzd49cn00qf670tifksyuny','kurti2.jpg','https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80','image/jpeg',168000,900,1200,'kurti','products','2026-09-13 05:17:27.768'),
('cmtzd49cn00qg670t52vqv70o','threePiece1.jpg','https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80','image/jpeg',176000,900,1200,'threePiece','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qh670tesnjtw71','salwar1.jpg','https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80','image/jpeg',184000,900,1200,'salwar','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qi670tnq12hf25','lehenga1.jpg','https://images.unsplash.com/photo-1583935064411-7f41c23b22b1?auto=format&fit=crop&w=900&q=80','image/jpeg',192000,900,1200,'lehenga','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qj670tbvnepzw1','kids1.jpg','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=80','image/jpeg',200000,900,1200,'kids','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qk670ti26p3fts','kids2.jpg','https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80','image/jpeg',208000,900,1200,'kids','products','2026-09-13 05:17:27.768'),
('cmtzd49co00ql670toohw9szt','mensShirt1.jpg','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80','image/jpeg',216000,900,1200,'mensShirt','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qm670tsaw9br8x','mensShirt2.jpg','https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80','image/jpeg',224000,900,1200,'mensShirt','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qn670tovurpwmo','mensPant1.jpg','https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80','image/jpeg',232000,900,1200,'mensPant','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qo670t298snl8z','polo1.jpg','https://images.unsplash.com/photo-1586790170083-2f7cead4c9d3?auto=format&fit=crop&w=900&q=80','image/jpeg',240000,900,1200,'polo','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qp670tot0ekksj','tshirt1.jpg','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80','image/jpeg',248000,900,1200,'tshirt','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qq670tkwixeszu','jacket1.jpg','https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80','image/jpeg',256000,900,1200,'jacket','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qr670tgbz9h2ib','hijab1.jpg','https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80','image/jpeg',264000,900,1200,'hijab','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qs670tvws70pr4','dupatta1.jpg','https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=80','image/jpeg',272000,900,1200,'dupatta','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qt670tc1dd0la6','orna1.jpg','https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80','image/jpeg',280000,900,1200,'orna','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qu670tjurt7he7','bag1.jpg','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80','image/jpeg',288000,900,1200,'bag','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qv670t352vvcyp','bag2.jpg','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80','image/jpeg',296000,900,1200,'bag','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qw670tq61q59ob','jwellery1.jpg','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80','image/jpeg',304000,900,1200,'jwellery','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qx670tc480ba3g','jwellery2.jpg','https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80','image/jpeg',312000,900,1200,'jwellery','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qy670t8g43fu40','watch1.jpg','https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80','image/jpeg',320000,900,1200,'watch','products','2026-09-13 05:17:27.768'),
('cmtzd49co00qz670t15ryc75k','watch2.jpg','https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80','image/jpeg',328000,900,1200,'watch','products','2026-09-13 05:17:27.768'),
('cmtzd49co00r0670th1oq5xnt','shoes1.jpg','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80','image/jpeg',336000,900,1200,'shoes','products','2026-09-13 05:17:27.768'),
('cmtzd49co00r1670t9p9bqkiq','shoes2.jpg','https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80','image/jpeg',344000,900,1200,'shoes','products','2026-09-13 05:17:27.768'),
('cmtzd49co00r2670tdim1b0lw','perfume1.jpg','https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80','image/jpeg',352000,900,1200,'perfume','products','2026-09-13 05:17:27.768'),
('cmtzd49co00r3670toleuszb1','home1.jpg','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80','image/jpeg',360000,900,1200,'home','products','2026-09-13 05:17:27.768'),
('cmtzd49co00r4670toizd5kwo','bedding1.jpg','https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80','image/jpeg',368000,900,1200,'bedding','products','2026-09-13 05:17:27.768'),
('cmu0qga1u0019x3isi0tnw7he','Spariqo™-BD-Logo.jpg','/uploads/1789359509720-Spariqo--BD-Logo.jpg','image/jpeg',6969,NULL,NULL,NULL,'uploads','2026-09-14 04:18:29.730'),
('cmu0qgieg001ax3is5543x192','Spariqo™-BD-Logo-Header.jpg','/uploads/1789359520548-Spariqo--BD-Logo-Header.jpg','image/jpeg',37685,NULL,NULL,NULL,'uploads','2026-09-14 04:18:40.552'),
('cmu0qgu43001bx3ismi2kusug','spariqo-icon-300x300.png','/uploads/1789359535713-spariqo-icon-300x300.png','image/png',2575,NULL,NULL,NULL,'uploads','2026-09-14 04:18:55.731'),
('cmu0qhh0v001cx3isn66qgm8g','Spariqo™.png','/uploads/1789359565391-Spariqo-.png','image/png',705576,NULL,NULL,NULL,'uploads','2026-09-14 04:19:25.423'),
('cmu0qojj8001xx3isxpqqb8z4','Spariqo™ Logo.png','/uploads/1789359895260-Spariqo--Logo.png','image/png',64218,NULL,NULL,NULL,'uploads','2026-09-14 04:24:55.268'),
('cmu0uwvwu0002h9y3qwhvqqez','_uptest.png','/uploads/1789367003015-_uptest.png','image/png',78,NULL,NULL,NULL,'uploads','2026-09-14 06:23:23.023'),
('cmu0yykme000bi90msqlrmjyy','bdmarket-brand-logo.jpg','/uploads/1789373800155-bdmarket-brand-logo.jpg','image/jpeg',14745,NULL,NULL,NULL,'uploads','2026-09-14 08:16:40.166'),
('cmu0z395j000ci90mdoq1pl7l','bkash-payments.jpg','/uploads/1789374018575-bkash-payments.jpg','image/jpeg',19930,NULL,NULL,NULL,'uploads','2026-09-14 08:20:18.582'),
('cmu0z51z7000di90mffrkmqd9','bdmarket-logo.png','/uploads/1789374102590-bdmarket-logo.png','image/png',49548,NULL,NULL,NULL,'uploads','2026-09-14 08:21:42.595'),
('cmu0zgufw000wi90mau64yum9','bdmarket-favicon.png','/uploads/1789374652696-bdmarket-favicon.png','image/png',39337,NULL,NULL,NULL,'uploads','2026-09-14 08:30:52.700'),
('cmu0zk3mm001pi90m0fuwtzic','bkash-payments.png','/uploads/1789374804569-bkash-payments.png','image/png',9271,NULL,NULL,NULL,'uploads','2026-09-14 08:33:24.574'),
('cmu0zkd1a001qi90mpds0jai8','nagad-payments.png','/uploads/1789374816763-nagad-payments.png','image/png',9774,NULL,NULL,NULL,'uploads','2026-09-14 08:33:36.767'),
('cmu0zkggi001ri90m4gjkp7dw','rocket-payments.png','/uploads/1789374821198-rocket-payments.png','image/png',9374,NULL,NULL,NULL,'uploads','2026-09-14 08:33:41.202'),
('cmu0zky8m001si90manxmeoqf','visa-payments.png','/uploads/1789374844242-visa-payments.png','image/png',9079,NULL,NULL,NULL,'uploads','2026-09-14 08:34:04.246'),
('cmu0zl2gv001ti90m361lvqls','mastercard-payments.png','/uploads/1789374849720-mastercard-payments.png','image/png',7871,NULL,NULL,NULL,'uploads','2026-09-14 08:34:09.727'),
('cmu0zo62p001ui90mkg55ezhc','cod-payments.png','/uploads/1789374994363-cod-payments.png','image/png',9968,NULL,NULL,NULL,'uploads','2026-09-14 08:36:34.370');

-- Menu: 4 rows
INSERT INTO `Menu` (`id`, `name`, `location`, `items`, `status`, `updatedAt`) VALUES
('cmtzd3p4t005a670t227w0dsq','Main Navigation','header','[{"label":"Home","labelBn":"হোম","href":"/"},{"label":"Women","labelBn":"মহিলা","href":"/category/women","children":[{"label":"Saree","labelBn":"শাড়ি","href":"/category/saree"},{"label":"Kurti","labelBn":"কুর্তি","href":"/category/kurti"},{"label":"Three Piece","labelBn":"থ্রি-পিস","href":"/category/three-piece"},{"label":"Salwar Kameez","labelBn":"সালোয়ার কামিজ","href":"/category/salwar-kameez"},{"label":"Lehenga","labelBn":"লেহেঙ্গা","href":"/category/lehenga"},{"label":"Hijab & Abaya","labelBn":"হিজাব ও আবায়া","href":"/category/hijab-abaya"}]},{"label":"Men","labelBn":"পুরুষ","href":"/category/men","children":[{"label":"Panjabi","labelBn":"পাঞ্জাবি","href":"/category/panjabi"},{"label":"Shirt","labelBn":"শার্ট","href":"/category/shirt"},{"label":"T-Shirt & Polo","href":"/category/t-shirt-polo"},{"label":"Pant & Trouser","href":"/category/pant-trouser"}]},{"label":"Kids","labelBn":"শিশু","href":"/category/kids"},{"label":"Accessories","labelBn":"এক্সেসরিজ","href":"/category/accessories"},{"label":"Jewellery","labelBn":"গহনা","href":"/category/jewellery"},{"label":"Blog","labelBn":"ব্লগ","href":"/blog"},{"label":"Contact","labelBn":"যোগাযোগ","href":"/pages/contact"},{"label":"Women","href":"/category/women","children":[{"label":"Saree","href":"/category/saree"},{"label":"Kurti","href":"/category/kurti"},{"label":"Three Piece","href":"/category/three-piece"},{"label":"Salwar Kameez","href":"/category/salwar-kameez"},{"label":"Lehenga","href":"/category/lehenga"},{"label":"Hijab & Abaya","href":"/category/hijab-abaya"},{"label":"Dupatta & Orna","href":"/category/dupatta-orna"}]}]','active','2026-09-16 13:04:41.091'),
('cmtzd3p4t005b670tljogrsgm','Customer Service','footer-1','[{"label":"About Us","href":"/pages/about"},{"label":"Contact Us","href":"/pages/contact"},{"label":"Track Order","href":"/track"},{"label":"Shipping Info","href":"/pages/shipping"},{"label":"Returns & Refunds","href":"/pages/returns"},{"label":"FAQ","href":"/pages/faq"}]','active','2026-09-13 05:17:01.565'),
('cmtzd3p4t005c670ttk9vyzj2','Shop Links','footer-2','[{"label":"All Products","href":"/shop"},{"label":"New Arrivals","href":"/shop?sort=newest"},{"label":"Best Sellers","href":"/shop?sort=popular"},{"label":"Sale Items","href":"/shop?sale=1"},{"label":"Blog","href":"/blog"}]','active','2026-09-13 05:17:01.565'),
('cmtzd3p4t005d670tdztws658','Legal','footer-3','[{"label":"Privacy Policy","href":"/pages/privacy-policy"},{"label":"Terms & Conditions","href":"/pages/terms"},{"label":"Refund Policy","href":"/pages/returns"}]','active','2026-09-13 05:17:01.565');

-- Newsletter: 7 rows
INSERT INTO `Newsletter` (`id`, `email`, `status`, `createdAt`) VALUES
('cmtzd49fp00r5670tn2fed925','subscriber1@example.com','subscribed','2026-09-13 05:17:27.877'),
('cmtzd49fp00r6670t021szo49','subscriber2@example.com','subscribed','2026-09-13 05:17:27.877'),
('cmtzd49fp00r7670tcbq47rx1','subscriber3@example.com','subscribed','2026-09-13 05:17:27.877'),
('cmtzd49fp00r8670t4ea3k0rz','subscriber4@example.com','subscribed','2026-09-13 05:17:27.877'),
('cmtze3s72000nm03e34z1ubts','smoke2@example.com','subscribed','2026-09-13 05:45:05.150'),
('cmtze3sgu000om03e4zu62rao','smoke3@example.com','subscribed','2026-09-13 05:45:05.502'),
('cmu0pioys000ax3isnimsogm6','olama8@spariqo.com','subscribed','2026-09-14 03:52:22.755');

-- Order: 42 rows
INSERT INTO `Order` (`id`, `orderNumber`, `customerId`, `landingPageId`, `email`, `phone`, `customerName`, `status`, `paymentStatus`, `paymentMethod`, `paymentRef`, `subtotal`, `discount`, `shippingCost`, `tax`, `total`, `couponCode`, `currency`, `shippingMethod`, `shippingZone`, `shipDivision`, `shipDistrict`, `shipArea`, `shipStreet`, `shipPostcode`, `customerNote`, `adminNote`, `trackingNumber`, `courier`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt`, `confirmedAt`, `shippedAt`, `deliveredAt`) VALUES
('cmtzd3wmv00e2670tdzti5dnx','BD26091000','cmtzd3npr003g670tlz8dxy4n',NULL,'rahim@example.com','+8801711000001','Rahim Ahmed','PROCESSING','unpaid','cod',NULL,2450,245,0,0,2205,'WELCOME10','BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,NULL,NULL,NULL,NULL,'2026-07-28 10:44:24.031','2026-09-13 05:44:41.896',NULL,NULL,NULL),
('cmtzd3wp400e7670tbed91e6v','BD26091001','cmtzd3nul003k670tomx48gvy',NULL,'fatema@example.com','+8801711000002','Fatema Begum','PROCESSING','paid','bkash','TRX1789276631367',12090,0,0,0,12090,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Chattogram','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-02 00:54:50.235','2026-09-13 05:17:11.368',NULL,NULL,NULL),
('cmtzd3wrk00ed670tu62uxohu','BD26091002','cmtzd3o0e003o670t147xaz7v',NULL,'karim@example.com','+8801711000003','Karim Hossain','CONFIRMED','paid','nagad','TRX1789276631455',11040,0,0,0,11040,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-30 00:57:59.879','2026-09-13 05:17:11.456','2026-07-30 01:57:59.879',NULL,NULL),
('cmtzd3wtw00el670t1vcrmzkj','BD26091003','cmtzd3o5g003s670tie78vrx6',NULL,'nusrat@example.com','+8801711000004','Nusrat Jahan','PACKED','unpaid','cod',NULL,2900,0,0,0,2900,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Sylhet','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-05 20:01:03.769','2026-09-13 05:17:11.540','2026-08-05 21:01:03.769',NULL,NULL),
('cmtzd3wwo00er670t01wp5wxn','BD26091004','cmtzd3o9v003w670tn84f2p4c',NULL,'tanvir@example.com','+8801711000005','Tanvir Islam','SHIPPED','unpaid','cod',NULL,6230,0,0,0,6230,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Khulna','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,'BDMMIN58N9B','Steadfast',NULL,NULL,'2026-07-29 08:04:42.690','2026-09-13 05:17:11.640','2026-07-29 09:04:42.690','2026-07-30 08:04:42.690',NULL),
('cmtzd3wz500ez670txxirebiw','BD26091005','cmtzd3oea0040670t7iw1tivt',NULL,'sadia@example.com','+8801711000006','Sadia Rahman','DELIVERED','paid','sslcommerz','TRX1789276631728',14950,1495,0,0,13455,'WELCOME10','BDT','Free Delivery','Outside Dhaka','Chattogram','Rajshahi','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMP1ITZREL','RedX',NULL,NULL,'2026-08-28 05:39:31.615','2026-09-13 05:17:11.729','2026-08-28 06:39:31.615','2026-08-29 05:39:31.615','2026-08-31 05:39:31.615'),
('cmtzd3x5f00f9670t6bi7nndl','BD26091006','cmtzd3oj30044670twbzlk59a',NULL,'imran@example.com','+8801711000007','Imran Khan','DELIVERED','paid','cod',NULL,3450,0,0,0,3450,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMABWBG97P','Pathao',NULL,NULL,'2026-08-23 02:10:42.511','2026-09-13 05:17:11.955','2026-08-23 03:10:42.511','2026-08-24 02:10:42.511','2026-08-26 02:10:42.511'),
('cmtzd3xar00fh670tn88u64hg','BD26091007','cmtzd3onk0048670tlg249haq',NULL,'ayesha@example.com','+8801711000008','Ayesha Siddika','DELIVERED','paid','bkash','TRX1789276632147',4750,0,0,0,4750,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Gazipur','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMNO5LLSJ3','Steadfast',NULL,NULL,'2026-08-09 09:03:55.385','2026-09-13 05:17:12.148','2026-08-09 10:03:55.385','2026-08-10 09:03:55.385','2026-08-12 09:03:55.385'),
('cmtzd3xfc00fq670tlczxatfr','BD26091008','cmtzd3npr003g670tlz8dxy4n',NULL,'rahim@example.com','+8801711000001','Rahim Ahmed','CANCELLED','unpaid','cod',NULL,12320,0,0,0,12320,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 11:54:23.726','2026-09-13 05:17:12.312',NULL,NULL,NULL),
('cmtzd3xhm00fy670tqja61zx8','BD26091009','cmtzd3nul003k670tomx48gvy',NULL,'fatema@example.com','+8801711000002','Fatema Begum','DELIVERED','paid','rocket','TRX1789276632392',6900,0,0,0,6900,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Chattogram','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMW4RF57T9','Pathao',NULL,NULL,'2026-07-17 23:11:48.320','2026-09-13 05:17:12.394','2026-07-18 00:11:48.320','2026-07-18 23:11:48.320','2026-07-20 23:11:48.320'),
('cmtzd3xly00g6670tykadg58h','BD26091010','cmtzd3o0e003o670t147xaz7v',NULL,'karim@example.com','+8801711000003','Karim Hossain','PENDING','unpaid','cod',NULL,4870,487,0,0,4383,'WELCOME10','BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-21 23:54:17.447','2026-09-13 05:17:12.550',NULL,NULL,NULL),
('cmtzd3xoo00gc670tu6r04jsg','BD26091011','cmtzd3o5g003s670tie78vrx6',NULL,'nusrat@example.com','+8801711000004','Nusrat Jahan','PROCESSING','paid','bkash','TRX1789276632646',7090,0,0,0,7090,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Sylhet','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-29 16:10:24.842','2026-09-13 05:17:12.648',NULL,NULL,NULL),
('cmtzd3xqy00gj670tzn2rh49g','BD26091012','cmtzd3o9v003w670tn84f2p4c',NULL,'tanvir@example.com','+8801711000005','Tanvir Islam','CONFIRMED','paid','nagad','TRX1789276632729',1490,0,100,0,1590,NULL,'BDT','Standard Delivery','Outside Dhaka','Chattogram','Khulna','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,NULL,NULL,NULL,NULL,'2026-09-04 06:47:09.786','2026-09-13 05:17:12.730','2026-09-04 07:47:09.786',NULL,NULL),
('cmtzd3xt800gp670tsyot1n1z','BD26091013','cmtzd3oea0040670t7iw1tivt',NULL,'sadia@example.com','+8801711000006','Sadia Rahman','PACKED','unpaid','cod',NULL,32280,0,0,0,32280,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Rajshahi','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-18 23:52:15.160','2026-09-13 05:17:12.813','2026-08-19 00:52:15.160',NULL,NULL),
('cmtzd3xw400gw670tpv9cc2bl','BD26091014','cmtzd3oj30044670twbzlk59a',NULL,'imran@example.com','+8801711000007','Imran Khan','SHIPPED','unpaid','cod',NULL,16450,0,0,0,16450,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMF4W7ERF5','RedX',NULL,NULL,'2026-08-18 14:31:00.176','2026-09-13 05:17:12.916','2026-08-18 15:31:00.176','2026-08-19 14:31:00.176',NULL),
('cmtzd3xyz00h5670thi5pf0rk','BD26091015','cmtzd3onk0048670tlg249haq',NULL,'ayesha@example.com','+8801711000008','Ayesha Siddika','DELIVERED','paid','sslcommerz','TRX1789276633018',8400,840,0,0,7560,'WELCOME10','BDT','Free Delivery','Outside Dhaka','Chattogram','Gazipur','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMIA7US0TN','Pathao',NULL,NULL,'2026-07-21 21:36:06.978','2026-09-13 05:17:13.020','2026-07-21 22:36:06.978','2026-07-22 21:36:06.978','2026-07-24 21:36:06.978'),
('cmtzd3y4200hd670t3py9h7vm','BD26091016','cmtzd3npr003g670tlz8dxy4n',NULL,'rahim@example.com','+8801711000001','Rahim Ahmed','DELIVERED','paid','cod',NULL,2570,0,0,0,2570,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,'BDM3H92EO10','Steadfast',NULL,NULL,'2026-08-28 11:39:55.113','2026-09-13 05:17:13.202','2026-08-28 12:39:55.113','2026-08-29 11:39:55.113','2026-08-31 11:39:55.113'),
('cmtzd3y8k00hm670tdjdu0rzl','BD26091017','cmtzd3nul003k670tomx48gvy',NULL,'fatema@example.com','+8801711000002','Fatema Begum','DELIVERED','paid','bkash','TRX1789276633363',15590,0,0,0,15590,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Chattogram','Sadar','House 10, Road 3','1000',NULL,NULL,'BDM3LTGH1Y1','RedX',NULL,NULL,'2026-08-19 07:02:58.212','2026-09-13 05:17:13.364','2026-08-19 08:02:58.212','2026-08-20 07:02:58.212','2026-08-22 07:02:58.212'),
('cmtzd3yd100hw670twfixh78d','BD26091018','cmtzd3o0e003o670t147xaz7v',NULL,'karim@example.com','+8801711000003','Karim Hossain','CANCELLED','unpaid','cod',NULL,8900,0,0,0,8900,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-17 20:20:28.823','2026-09-13 05:17:13.525',NULL,NULL,NULL),
('cmtzd3yfo00i2670t1bbk12v6','BD26091019','cmtzd3o5g003s670tie78vrx6',NULL,'nusrat@example.com','+8801711000004','Nusrat Jahan','DELIVERED','paid','rocket','TRX1789276633618',4470,0,0,0,4470,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Sylhet','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMUGWQ163P','Steadfast',NULL,NULL,'2026-07-17 02:40:35.444','2026-09-13 05:17:13.620','2026-07-17 03:40:35.444','2026-07-18 02:40:35.444','2026-07-20 02:40:35.444'),
('cmtzd3ykc00ib670tlb3k6a4a','BD26091020','cmtzd3o9v003w670tn84f2p4c',NULL,'tanvir@example.com','+8801711000005','Tanvir Islam','PENDING','unpaid','cod',NULL,10860,1086,0,0,9774,'WELCOME10','BDT','Free Delivery','Outside Dhaka','Chattogram','Khulna','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,NULL,NULL,NULL,NULL,'2026-07-17 03:39:00.363','2026-09-13 05:17:13.788',NULL,NULL,NULL),
('cmtzd3ymq00ii670twedswbop','BD26091021','cmtzd3oea0040670t7iw1tivt',NULL,'sadia@example.com','+8801711000006','Sadia Rahman','PROCESSING','paid','bkash','TRX1789276633873',7780,0,0,0,7780,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Rajshahi','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-23 01:08:34.080','2026-09-13 05:17:13.874',NULL,NULL,NULL),
('cmtzd3ypl00in670txi3b4uiu','BD26091022','cmtzd3oj30044670twbzlk59a',NULL,'imran@example.com','+8801711000007','Imran Khan','CONFIRMED','paid','nagad','TRX1789276633975',8830,0,0,0,8830,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-30 09:20:44.941','2026-09-13 05:17:13.977','2026-07-30 10:20:44.941',NULL,NULL),
('cmtzd3ysa00iu670t16vm4vn2','BD26091023','cmtzd3onk0048670tlg249haq',NULL,'ayesha@example.com','+8801711000008','Ayesha Siddika','PACKED','unpaid','cod',NULL,18830,0,0,0,18830,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Gazipur','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-26 05:54:33.743','2026-09-13 05:17:14.074','2026-07-26 06:54:33.743',NULL,NULL),
('cmtzd3yut00j2670t90n4zsou','BD26091024','cmtzd3npr003g670tlz8dxy4n',NULL,'rahim@example.com','+8801711000001','Rahim Ahmed','SHIPPED','unpaid','cod',NULL,1890,0,100,0,1990,NULL,'BDT','Standard Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,'BDMO2AQCYEQ','Pathao',NULL,NULL,'2026-08-27 11:25:16.578','2026-09-13 05:17:14.165','2026-08-27 12:25:16.578','2026-08-28 11:25:16.578',NULL),
('cmtzd3yxf00j9670taqyw5dwp','BD26091025','cmtzd3nul003k670tomx48gvy',NULL,'fatema@example.com','+8801711000002','Fatema Begum','DELIVERED','paid','sslcommerz','TRX1789276634258',4330,433,0,0,3897,'WELCOME10','BDT','Free Delivery','Outside Dhaka','Chattogram','Chattogram','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMSRDH36OK','Steadfast',NULL,NULL,'2026-08-15 06:15:35.815','2026-09-13 05:17:14.260','2026-08-15 07:15:35.815','2026-08-16 06:15:35.815','2026-08-18 06:15:35.815'),
('cmtzd3z1z00ji670t17tquv8c','BD26091026','cmtzd3o0e003o670t147xaz7v',NULL,'karim@example.com','+8801711000003','Karim Hossain','DELIVERED','paid','cod',NULL,13490,0,0,0,13490,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMX55V7E2A','RedX',NULL,NULL,'2026-08-07 09:15:55.369','2026-09-13 05:17:14.423','2026-08-07 10:15:55.369','2026-08-08 09:15:55.369','2026-08-10 09:15:55.369'),
('cmtzd3z6f00js670tcgnnm0ky','BD26091027','cmtzd3o5g003s670tie78vrx6',NULL,'nusrat@example.com','+8801711000004','Nusrat Jahan','DELIVERED','paid','bkash','TRX1789276634581',22400,0,0,0,22400,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Sylhet','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMR7K4M9JQ','Pathao',NULL,NULL,'2026-08-12 14:19:50.877','2026-09-13 05:17:14.583','2026-08-12 15:19:50.877','2026-08-13 14:19:50.877','2026-08-15 14:19:50.877'),
('cmtzd3zb900k0670thwv63x0c','BD26091028','cmtzd3o9v003w670tn84f2p4c',NULL,'tanvir@example.com','+8801711000005','Tanvir Islam','CANCELLED','unpaid','cod',NULL,30080,0,0,0,30080,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Khulna','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,NULL,NULL,NULL,NULL,'2026-08-11 00:02:08.723','2026-09-13 05:17:14.757',NULL,NULL,NULL),
('cmtzd3zdl00k7670twqld16x1','BD26091029','cmtzd3oea0040670t7iw1tivt',NULL,'sadia@example.com','+8801711000006','Sadia Rahman','DELIVERED','paid','rocket','TRX1789276634840',15730,0,0,0,15730,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Rajshahi','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMA511NVBD','RedX',NULL,NULL,'2026-07-16 10:35:24.410','2026-09-13 05:17:14.841','2026-07-16 11:35:24.410','2026-07-17 10:35:24.410','2026-07-19 10:35:24.410'),
('cmtzd3zj700kh670tg8wpshcj','BD26091030','cmtzd3oj30044670twbzlk59a',NULL,'imran@example.com','+8801711000007','Imran Khan','PENDING','unpaid','cod',NULL,4890,489,0,0,4401,'WELCOME10','BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-08 05:47:58.272','2026-09-13 05:17:15.043',NULL,NULL,NULL),
('cmtzd3zm700km670t6uf3jj0s','BD26091031','cmtzd3onk0048670tlg249haq',NULL,'ayesha@example.com','+8801711000008','Ayesha Siddika','PROCESSING','paid','bkash','TRX1789276635149',3270,0,0,0,3270,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Gazipur','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-18 02:05:23.680','2026-09-13 05:17:15.151',NULL,NULL,NULL),
('cmtzd3zp500ks670tdzgqswl6','BD26091032','cmtzd3npr003g670tlz8dxy4n',NULL,'rahim@example.com','+8801711000001','Rahim Ahmed','CONFIRMED','paid','nagad','TRX1789276635256',10980,0,0,0,10980,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,NULL,NULL,NULL,NULL,'2026-07-28 16:46:00.488','2026-09-13 05:17:15.257','2026-07-28 17:46:00.488',NULL,NULL),
('cmtzd3zrg00l0670t25js60d8','BD26091033','cmtzd3nul003k670tomx48gvy',NULL,'fatema@example.com','+8801711000002','Fatema Begum','PACKED','unpaid','cod',NULL,2980,0,0,0,2980,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Chattogram','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-07 04:19:00.518','2026-09-13 05:17:15.340','2026-08-07 05:19:00.518',NULL,NULL),
('cmtzd3ztr00l6670thh1q78an','BD26091034','cmtzd3o0e003o670t147xaz7v',NULL,'karim@example.com','+8801711000003','Karim Hossain','SHIPPED','unpaid','cod',NULL,3390,0,0,0,3390,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMCW8HK4CT','Steadfast',NULL,NULL,'2026-07-24 20:23:48.911','2026-09-13 05:17:15.423','2026-07-24 21:23:48.911','2026-07-25 20:23:48.911',NULL),
('cmtzd3zw300le670tsrha34lf','BD26091035','cmtzd3o5g003s670tie78vrx6',NULL,'nusrat@example.com','+8801711000004','Nusrat Jahan','DELIVERED','paid','sslcommerz','TRX1789276635506',32470,3247,0,0,29223,'WELCOME10','BDT','Free Delivery','Outside Dhaka','Chattogram','Sylhet','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMYO1VK08T','RedX',NULL,NULL,'2026-07-26 03:09:50.574','2026-09-13 05:17:15.507','2026-07-26 04:09:50.574','2026-07-27 03:09:50.574','2026-07-29 03:09:50.574'),
('cmtzd400r00lo670tzzc58xaj','BD26091036','cmtzd3o9v003w670tn84f2p4c',NULL,'tanvir@example.com','+8801711000005','Tanvir Islam','DELIVERED','paid','cod',NULL,2650,0,0,0,2650,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Khulna','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,'BDM0BL7VLWL','Pathao',NULL,NULL,'2026-09-08 14:03:43.837','2026-09-13 05:17:15.675','2026-09-08 15:03:43.837','2026-09-09 14:03:43.837','2026-09-11 14:03:43.837'),
('cmtzd405k00lw670tpqja78ge','BD26091037','cmtzd3oea0040670t7iw1tivt',NULL,'sadia@example.com','+8801711000006','Sadia Rahman','DELIVERED','paid','bkash','TRX1789276635846',15080,0,0,0,15080,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Rajshahi','Sadar','House 10, Road 3','1000',NULL,NULL,'BDMCHFN3FES','Steadfast',NULL,NULL,'2026-07-30 01:38:11.521','2026-09-13 05:17:15.848','2026-07-30 02:38:11.521','2026-07-31 01:38:11.521','2026-08-02 01:38:11.521'),
('cmtzd40bd00m5670tmz22ffpb','BD26091038','cmtzd3oj30044670twbzlk59a',NULL,'imran@example.com','+8801711000007','Imran Khan','CANCELLED','unpaid','cod',NULL,15740,0,0,0,15740,NULL,'BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-17 19:10:41.709','2026-09-13 05:17:16.057',NULL,NULL,NULL),
('cmtzd40dz00md670tvp084qzi','BD26091039','cmtzd3onk0048670tlg249haq',NULL,'ayesha@example.com','+8801711000008','Ayesha Siddika','DELIVERED','paid','rocket','TRX1789276636149',10900,0,0,0,10900,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Gazipur','Sadar','House 10, Road 3','1000',NULL,NULL,'BDM6MVM2R5E','Pathao',NULL,NULL,'2026-08-15 09:14:53.802','2026-09-13 05:17:16.151','2026-08-15 10:14:53.802','2026-08-16 09:14:53.802','2026-08-18 09:14:53.802'),
('cmtzd40im00ml670tkymzfh9v','BD26091040','cmtzd3npr003g670tlz8dxy4n',NULL,'rahim@example.com','+8801711000001','Rahim Ahmed','PENDING','unpaid','cod',NULL,8850,885,0,0,7965,'WELCOME10','BDT','Free Delivery','Inside Dhaka City','Dhaka','Dhaka','Sadar','House 10, Road 3','1000','Please call before delivery.',NULL,NULL,NULL,NULL,NULL,'2026-08-20 12:06:47.090','2026-09-13 05:17:16.318',NULL,NULL,NULL),
('cmtzd40l700mr670t2heljf49','BD26091041','cmtzd3nul003k670tomx48gvy',NULL,'fatema@example.com','+8801711000002','Fatema Begum','PROCESSING','paid','bkash','TRX1789276636410',14780,0,0,0,14780,NULL,'BDT','Free Delivery','Outside Dhaka','Chattogram','Chattogram','Sadar','House 10, Road 3','1000',NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-09 01:49:52.933','2026-09-13 05:17:16.411',NULL,NULL,NULL);

-- OrderEvent: 111 rows
INSERT INTO `OrderEvent` (`id`, `orderId`, `status`, `note`, `by`, `createdAt`) VALUES
('cmtzd3wmv00e5670t4nllnmwn','cmtzd3wmv00e2670tdzti5dnx','PENDING','Order placed successfully','System','2026-07-28 10:44:24.031'),
('cmtzd3wp400eb670tbo30u6gx','cmtzd3wp400e7670tbed91e6v','PENDING','Order placed successfully','System','2026-09-02 00:54:50.235'),
('cmtzd3wrk00ei670t8i9tw78y','cmtzd3wrk00ed670tu62uxohu','PENDING','Order placed successfully','System','2026-07-30 00:57:59.879'),
('cmtzd3wrk00ej670th0nf4sp8','cmtzd3wrk00ed670tu62uxohu','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-30 01:57:59.879'),
('cmtzd3wtw00eo670tej1zwycu','cmtzd3wtw00el670t1vcrmzkj','PENDING','Order placed successfully','System','2026-08-05 20:01:03.769'),
('cmtzd3wtw00ep670tg54k6ucf','cmtzd3wtw00el670t1vcrmzkj','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-05 21:01:03.769'),
('cmtzd3wwo00ev670tsew79sfg','cmtzd3wwo00er670t01wp5wxn','PENDING','Order placed successfully','System','2026-07-29 08:04:42.690'),
('cmtzd3wwo00ew670t21gwapvj','cmtzd3wwo00er670t01wp5wxn','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-29 09:04:42.690'),
('cmtzd3wwo00ex670tu5jb94qn','cmtzd3wwo00er670t01wp5wxn','SHIPPED','Handed over to courier','Store Manager','2026-07-30 08:04:42.690'),
('cmtzd3wz500f4670tj46nhax5','cmtzd3wz500ez670txxirebiw','PENDING','Order placed successfully','System','2026-08-28 05:39:31.615'),
('cmtzd3wz500f5670t580ey4cc','cmtzd3wz500ez670txxirebiw','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-28 06:39:31.615'),
('cmtzd3wz500f6670tm8rgn0jj','cmtzd3wz500ez670txxirebiw','SHIPPED','Handed over to courier','Store Manager','2026-08-29 05:39:31.615'),
('cmtzd3wz500f7670tikhgy4mm','cmtzd3wz500ez670txxirebiw','DELIVERED','Delivered and payment collected','Courier','2026-08-31 05:39:31.615'),
('cmtzd3x5f00fc670tig3fwfz1','cmtzd3x5f00f9670t6bi7nndl','PENDING','Order placed successfully','System','2026-08-23 02:10:42.511'),
('cmtzd3x5f00fd670tivekosoo','cmtzd3x5f00f9670t6bi7nndl','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-23 03:10:42.511'),
('cmtzd3x5f00fe670tn7dkwjef','cmtzd3x5f00f9670t6bi7nndl','SHIPPED','Handed over to courier','Store Manager','2026-08-24 02:10:42.511'),
('cmtzd3x5f00ff670tkdcgvmxg','cmtzd3x5f00f9670t6bi7nndl','DELIVERED','Delivered and payment collected','Courier','2026-08-26 02:10:42.511'),
('cmtzd3xas00fl670t2595uy0o','cmtzd3xar00fh670tn88u64hg','PENDING','Order placed successfully','System','2026-08-09 09:03:55.385'),
('cmtzd3xas00fm670twbnpvc0l','cmtzd3xar00fh670tn88u64hg','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-09 10:03:55.385'),
('cmtzd3xas00fn670tcp3h3wuu','cmtzd3xar00fh670tn88u64hg','SHIPPED','Handed over to courier','Store Manager','2026-08-10 09:03:55.385'),
('cmtzd3xas00fo670tpzqhnaiu','cmtzd3xar00fh670tn88u64hg','DELIVERED','Delivered and payment collected','Courier','2026-08-12 09:03:55.385'),
('cmtzd3xfc00fv670tim3m5y0b','cmtzd3xfc00fq670tlczxatfr','PENDING','Order placed successfully','System','2026-08-27 11:54:23.726'),
('cmtzd3xfc00fw670t6ae6carm','cmtzd3xfc00fq670tlczxatfr','CANCELLED','Cancelled at customer request','Store Manager','2026-08-27 13:54:23.726'),
('cmtzd3xhm00g1670t7dptgsva','cmtzd3xhm00fy670tqja61zx8','PENDING','Order placed successfully','System','2026-07-17 23:11:48.320'),
('cmtzd3xhm00g2670t3l1k2mmi','cmtzd3xhm00fy670tqja61zx8','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-18 00:11:48.320'),
('cmtzd3xhm00g3670t2cwb600v','cmtzd3xhm00fy670tqja61zx8','SHIPPED','Handed over to courier','Store Manager','2026-07-18 23:11:48.320'),
('cmtzd3xhm00g4670tunhjubob','cmtzd3xhm00fy670tqja61zx8','DELIVERED','Delivered and payment collected','Courier','2026-07-20 23:11:48.320'),
('cmtzd3xly00ga670tcogncmg5','cmtzd3xly00g6670tykadg58h','PENDING','Order placed successfully','System','2026-08-21 23:54:17.447'),
('cmtzd3xoo00gh670t7yqk0ub0','cmtzd3xoo00gc670tu6r04jsg','PENDING','Order placed successfully','System','2026-07-29 16:10:24.842'),
('cmtzd3xqy00gm670t0r6dckyo','cmtzd3xqy00gj670tzn2rh49g','PENDING','Order placed successfully','System','2026-09-04 06:47:09.786'),
('cmtzd3xqy00gn670tcl58o0c0','cmtzd3xqy00gj670tzn2rh49g','CONFIRMED','Order confirmed by phone','Store Manager','2026-09-04 07:47:09.786'),
('cmtzd3xt900gt670t14olydf7','cmtzd3xt800gp670tsyot1n1z','PENDING','Order placed successfully','System','2026-08-18 23:52:15.160'),
('cmtzd3xt900gu670tb5i2jgd6','cmtzd3xt800gp670tsyot1n1z','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-19 00:52:15.160'),
('cmtzd3xw400h1670tkr19omie','cmtzd3xw400gw670tpv9cc2bl','PENDING','Order placed successfully','System','2026-08-18 14:31:00.176'),
('cmtzd3xw400h2670tww5ywofk','cmtzd3xw400gw670tpv9cc2bl','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-18 15:31:00.176'),
('cmtzd3xw400h3670tcel4krre','cmtzd3xw400gw670tpv9cc2bl','SHIPPED','Handed over to courier','Store Manager','2026-08-19 14:31:00.176'),
('cmtzd3xyz00h8670t32pldzx9','cmtzd3xyz00h5670thi5pf0rk','PENDING','Order placed successfully','System','2026-07-21 21:36:06.978'),
('cmtzd3xyz00h9670t0gnq47ap','cmtzd3xyz00h5670thi5pf0rk','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-21 22:36:06.978'),
('cmtzd3xyz00ha670tutiygsy1','cmtzd3xyz00h5670thi5pf0rk','SHIPPED','Handed over to courier','Store Manager','2026-07-22 21:36:06.978'),
('cmtzd3xyz00hb670tlhizhbih','cmtzd3xyz00h5670thi5pf0rk','DELIVERED','Delivered and payment collected','Courier','2026-07-24 21:36:06.978'),
('cmtzd3y4200hh670txd9n1cuh','cmtzd3y4200hd670t3py9h7vm','PENDING','Order placed successfully','System','2026-08-28 11:39:55.113'),
('cmtzd3y4200hi670t35kkrhgk','cmtzd3y4200hd670t3py9h7vm','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-28 12:39:55.113'),
('cmtzd3y4200hj670tc5vji72j','cmtzd3y4200hd670t3py9h7vm','SHIPPED','Handed over to courier','Store Manager','2026-08-29 11:39:55.113'),
('cmtzd3y4200hk670t5nxyijm3','cmtzd3y4200hd670t3py9h7vm','DELIVERED','Delivered and payment collected','Courier','2026-08-31 11:39:55.113'),
('cmtzd3y8k00hr670txxqrdpkx','cmtzd3y8k00hm670tdjdu0rzl','PENDING','Order placed successfully','System','2026-08-19 07:02:58.212'),
('cmtzd3y8k00hs670tges7t0dp','cmtzd3y8k00hm670tdjdu0rzl','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-19 08:02:58.212'),
('cmtzd3y8k00ht670txwutoclq','cmtzd3y8k00hm670tdjdu0rzl','SHIPPED','Handed over to courier','Store Manager','2026-08-20 07:02:58.212'),
('cmtzd3y8k00hu670tvs2myhwf','cmtzd3y8k00hm670tdjdu0rzl','DELIVERED','Delivered and payment collected','Courier','2026-08-22 07:02:58.212'),
('cmtzd3yd100hz670t8rv87ogn','cmtzd3yd100hw670twfixh78d','PENDING','Order placed successfully','System','2026-08-17 20:20:28.823'),
('cmtzd3yd100i0670ta2gef5pt','cmtzd3yd100hw670twfixh78d','CANCELLED','Cancelled at customer request','Store Manager','2026-08-17 22:20:28.823'),
('cmtzd3yfo00i6670tqj9qtad1','cmtzd3yfo00i2670t1bbk12v6','PENDING','Order placed successfully','System','2026-07-17 02:40:35.444'),
('cmtzd3yfo00i7670tjv1la0n8','cmtzd3yfo00i2670t1bbk12v6','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-17 03:40:35.444'),
('cmtzd3yfo00i8670tcdg326og','cmtzd3yfo00i2670t1bbk12v6','SHIPPED','Handed over to courier','Store Manager','2026-07-18 02:40:35.444'),
('cmtzd3yfo00i9670tyc2b6kkz','cmtzd3yfo00i2670t1bbk12v6','DELIVERED','Delivered and payment collected','Courier','2026-07-20 02:40:35.444'),
('cmtzd3ykc00ig670tshhkmhra','cmtzd3ykc00ib670tlb3k6a4a','PENDING','Order placed successfully','System','2026-07-17 03:39:00.363'),
('cmtzd3ymq00il670twz1bjvac','cmtzd3ymq00ii670twedswbop','PENDING','Order placed successfully','System','2026-07-23 01:08:34.080'),
('cmtzd3ypm00ir670tdmf74bcy','cmtzd3ypl00in670txi3b4uiu','PENDING','Order placed successfully','System','2026-07-30 09:20:44.941'),
('cmtzd3ypm00is670t16suqo2a','cmtzd3ypl00in670txi3b4uiu','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-30 10:20:44.941'),
('cmtzd3ysa00iz670tqq6dth94','cmtzd3ysa00iu670t16vm4vn2','PENDING','Order placed successfully','System','2026-07-26 05:54:33.743'),
('cmtzd3ysa00j0670tyslqqcxa','cmtzd3ysa00iu670t16vm4vn2','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-26 06:54:33.743'),
('cmtzd3yut00j5670tm530a1nt','cmtzd3yut00j2670t90n4zsou','PENDING','Order placed successfully','System','2026-08-27 11:25:16.578'),
('cmtzd3yut00j6670tnibvqgrr','cmtzd3yut00j2670t90n4zsou','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-27 12:25:16.578'),
('cmtzd3yut00j7670t8wwg28it','cmtzd3yut00j2670t90n4zsou','SHIPPED','Handed over to courier','Store Manager','2026-08-28 11:25:16.578'),
('cmtzd3yxg00jd670t24efecji','cmtzd3yxf00j9670taqyw5dwp','PENDING','Order placed successfully','System','2026-08-15 06:15:35.815'),
('cmtzd3yxg00je670t9a4h04vg','cmtzd3yxf00j9670taqyw5dwp','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-15 07:15:35.815'),
('cmtzd3yxg00jf670tus3jp2g0','cmtzd3yxf00j9670taqyw5dwp','SHIPPED','Handed over to courier','Store Manager','2026-08-16 06:15:35.815'),
('cmtzd3yxg00jg670t6oht5bj2','cmtzd3yxf00j9670taqyw5dwp','DELIVERED','Delivered and payment collected','Courier','2026-08-18 06:15:35.815'),
('cmtzd3z1z00jn670tcqou7iru','cmtzd3z1z00ji670t17tquv8c','PENDING','Order placed successfully','System','2026-08-07 09:15:55.369'),
('cmtzd3z1z00jo670tut6qv7w0','cmtzd3z1z00ji670t17tquv8c','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-07 10:15:55.369'),
('cmtzd3z1z00jp670tr6zt5757','cmtzd3z1z00ji670t17tquv8c','SHIPPED','Handed over to courier','Store Manager','2026-08-08 09:15:55.369'),
('cmtzd3z1z00jq670tq1aqfdkp','cmtzd3z1z00ji670t17tquv8c','DELIVERED','Delivered and payment collected','Courier','2026-08-10 09:15:55.369'),
('cmtzd3z6f00jv670tmd1bbv6q','cmtzd3z6f00js670tcgnnm0ky','PENDING','Order placed successfully','System','2026-08-12 14:19:50.877'),
('cmtzd3z6f00jw670tmhjk1dij','cmtzd3z6f00js670tcgnnm0ky','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-12 15:19:50.877'),
('cmtzd3z6f00jx670t3ov8tu1e','cmtzd3z6f00js670tcgnnm0ky','SHIPPED','Handed over to courier','Store Manager','2026-08-13 14:19:50.877'),
('cmtzd3z6f00jy670t7pppowrd','cmtzd3z6f00js670tcgnnm0ky','DELIVERED','Delivered and payment collected','Courier','2026-08-15 14:19:50.877'),
('cmtzd3zb900k4670twnjtddho','cmtzd3zb900k0670thwv63x0c','PENDING','Order placed successfully','System','2026-08-11 00:02:08.723'),
('cmtzd3zb900k5670tk9woi8rp','cmtzd3zb900k0670thwv63x0c','CANCELLED','Cancelled at customer request','Store Manager','2026-08-11 02:02:08.723'),
('cmtzd3zdl00kc670tc50dyu45','cmtzd3zdl00k7670twqld16x1','PENDING','Order placed successfully','System','2026-07-16 10:35:24.410'),
('cmtzd3zdl00kd670tb4zlzjxe','cmtzd3zdl00k7670twqld16x1','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-16 11:35:24.410'),
('cmtzd3zdl00ke670t950rc6rm','cmtzd3zdl00k7670twqld16x1','SHIPPED','Handed over to courier','Store Manager','2026-07-17 10:35:24.410'),
('cmtzd3zdl00kf670thdyh5epj','cmtzd3zdl00k7670twqld16x1','DELIVERED','Delivered and payment collected','Courier','2026-07-19 10:35:24.410'),
('cmtzd3zj700kk670tbmdxupr5','cmtzd3zj700kh670tg8wpshcj','PENDING','Order placed successfully','System','2026-09-08 05:47:58.272'),
('cmtzd3zm700kq670tcw7rn0pg','cmtzd3zm700km670t6uf3jj0s','PENDING','Order placed successfully','System','2026-07-18 02:05:23.680'),
('cmtzd3zp500kx670t06nplmwu','cmtzd3zp500ks670tdzgqswl6','PENDING','Order placed successfully','System','2026-07-28 16:46:00.488'),
('cmtzd3zp500ky670t6npb6al9','cmtzd3zp500ks670tdzgqswl6','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-28 17:46:00.488'),
('cmtzd3zrg00l3670toyqaesem','cmtzd3zrg00l0670t25js60d8','PENDING','Order placed successfully','System','2026-08-07 04:19:00.518'),
('cmtzd3zrg00l4670tyqo1w1j4','cmtzd3zrg00l0670t25js60d8','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-07 05:19:00.518'),
('cmtzd3ztr00la670tydza2i1w','cmtzd3ztr00l6670thh1q78an','PENDING','Order placed successfully','System','2026-07-24 20:23:48.911'),
('cmtzd3ztr00lb670t5a2qflm3','cmtzd3ztr00l6670thh1q78an','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-24 21:23:48.911'),
('cmtzd3ztr00lc670tollh6ccr','cmtzd3ztr00l6670thh1q78an','SHIPPED','Handed over to courier','Store Manager','2026-07-25 20:23:48.911'),
('cmtzd3zw300lj670t50ha151h','cmtzd3zw300le670tsrha34lf','PENDING','Order placed successfully','System','2026-07-26 03:09:50.574'),
('cmtzd3zw300lk670tzoh5tkki','cmtzd3zw300le670tsrha34lf','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-26 04:09:50.574'),
('cmtzd3zw300ll670tw28ii37n','cmtzd3zw300le670tsrha34lf','SHIPPED','Handed over to courier','Store Manager','2026-07-27 03:09:50.574'),
('cmtzd3zw300lm670tbk49ppxc','cmtzd3zw300le670tsrha34lf','DELIVERED','Delivered and payment collected','Courier','2026-07-29 03:09:50.574'),
('cmtzd400r00lr670tfirydhrm','cmtzd400r00lo670tzzc58xaj','PENDING','Order placed successfully','System','2026-09-08 14:03:43.837'),
('cmtzd400r00ls670t59pfcnkn','cmtzd400r00lo670tzzc58xaj','CONFIRMED','Order confirmed by phone','Store Manager','2026-09-08 15:03:43.837'),
('cmtzd400r00lt670tqbrsktrc','cmtzd400r00lo670tzzc58xaj','SHIPPED','Handed over to courier','Store Manager','2026-09-09 14:03:43.837'),
('cmtzd400r00lu670teoqpve3n','cmtzd400r00lo670tzzc58xaj','DELIVERED','Delivered and payment collected','Courier','2026-09-11 14:03:43.837'),
('cmtzd405l00m0670t3ila3wvs','cmtzd405k00lw670tpqja78ge','PENDING','Order placed successfully','System','2026-07-30 01:38:11.521'),
('cmtzd405l00m1670t9qzgbm7j','cmtzd405k00lw670tpqja78ge','CONFIRMED','Order confirmed by phone','Store Manager','2026-07-30 02:38:11.521'),
('cmtzd405l00m2670taowmx4p1','cmtzd405k00lw670tpqja78ge','SHIPPED','Handed over to courier','Store Manager','2026-07-31 01:38:11.521'),
('cmtzd405l00m3670ti6053po5','cmtzd405k00lw670tpqja78ge','DELIVERED','Delivered and payment collected','Courier','2026-08-02 01:38:11.521'),
('cmtzd40bd00ma670tbisvubi9','cmtzd40bd00m5670tmz22ffpb','PENDING','Order placed successfully','System','2026-07-17 19:10:41.709'),
('cmtzd40bd00mb670tf81bq5cw','cmtzd40bd00m5670tmz22ffpb','CANCELLED','Cancelled at customer request','Store Manager','2026-07-17 21:10:41.709'),
('cmtzd40dz00mg670ty538d31r','cmtzd40dz00md670tvp084qzi','PENDING','Order placed successfully','System','2026-08-15 09:14:53.802'),
('cmtzd40dz00mh670to4ido7i3','cmtzd40dz00md670tvp084qzi','CONFIRMED','Order confirmed by phone','Store Manager','2026-08-15 10:14:53.802'),
('cmtzd40dz00mi670tcrv9xlzm','cmtzd40dz00md670tvp084qzi','SHIPPED','Handed over to courier','Store Manager','2026-08-16 09:14:53.802'),
('cmtzd40dz00mj670txw18sc3i','cmtzd40dz00md670tvp084qzi','DELIVERED','Delivered and payment collected','Courier','2026-08-18 09:14:53.802'),
('cmtzd40im00mp670t7floqclu','cmtzd40im00ml670tkymzfh9v','PENDING','Order placed successfully','System','2026-08-20 12:06:47.090'),
('cmtzd40l700mw670tho0zlim2','cmtzd40l700mr670t2heljf49','PENDING','Order placed successfully','System','2026-08-09 01:49:52.933'),
('cmtze3a9d000dm03e2fipsxe7','cmtzd3wmv00e2670tdzti5dnx','PROCESSING','Status changed to PROCESSING','Super Admin','2026-09-13 05:44:41.905');

-- OrderItem: 84 rows
INSERT INTO `OrderItem` (`id`, `orderId`, `productId`, `productName`, `variant`, `sku`, `image`, `price`, `qty`, `total`) VALUES
('cmtzd3wmv00e4670thymif2a1','cmtzd3wmv00e2670tdzti5dnx','cmtzd3l1g001b670tz87dxc3t','Premium Embroidered Cotton Panjabi','M / Navy','BDM-PNJ-001','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',2450,1,2450),
('cmtzd3wp400e9670tieswtp0g','cmtzd3wp400e7670tbed91e6v','cmtzd3l8o001h670tcbernipe','Embroidered Karchupi Panjabi','M / Navy','BDM-PNJ-004','https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',5450,2,10900),
('cmtzd3wp400ea670tc0qkqx2k','cmtzd3wp400e7670tbed91e6v','cmtzd3lrm001v670tsxghi3dg','Rayon Printed A-Line Kurti','M / Navy','BDM-KRT-002','https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80',1190,1,1190),
('cmtzd3wrk00ef670t5h0fhl2z','cmtzd3wrk00ed670tu62uxohu','cmtzd3lg1001n670tsc5hxdzo','Soft Cotton Tant Saree','M / Navy','BDM-SAR-003','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',2350,1,2350),
('cmtzd3wrk00eg670tm5jh7tkg','cmtzd3wrk00ed670tu62uxohu','cmtzd3lyq0021670ta1u7gq2q','Unstitched Three Piece Salwar Kameez','M / Navy','BDM-TPS-001','https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80',3250,2,6500),
('cmtzd3wrk00eh670tkm7931rl','cmtzd3wrk00ed670tu62uxohu','cmtzd3mfx002f670t9k8mkw28','Slim Fit Stretch Chino Pant','M / Navy','BDM-PNT-001','https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80',2190,1,2190),
('cmtzd3wtw00en670tufuy3xja','cmtzd3wtw00el670t1vcrmzkj','cmtzd3lou001t670tfgbw1t72','Embroidered Cotton Kurti','M / Navy','BDM-KRT-001','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',1450,2,2900),
('cmtzd3wwo00et670t5b4z4otl','cmtzd3wwo00er670t01wp5wxn','cmtzd3lwg001z670trh0kuxwa','Kurti with Palazzo Set','M / Navy','BDM-KRT-004','https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80',2650,1,2650),
('cmtzd3wwo00eu670t26rnyjja','cmtzd3wwo00er670t01wp5wxn','cmtzd3mcp002d670tnx7jb2z5','Oxford Formal Shirt','M / Navy','BDM-SHT-001','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',1790,2,3580),
('cmtzd3wz500f1670tjbf63xym','cmtzd3wz500ez670txxirebiw','cmtzd3m340025670t7na9u0fl','Cotton Salwar Kameez Stitched Set','M / Navy','BDM-SLK-001','https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',2790,2,5580),
('cmtzd3wz500f2670tu8ao6mur','cmtzd3wz500ez670txxirebiw','cmtzd3mlg002j670t2tc85xfz','Graphic Print Cotton T-Shirt','M / Navy','BDM-TSH-001','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',790,1,790),
('cmtzd3wz500f3670t8kk6lmxl','cmtzd3wz500ez670txxirebiw','cmtzd3n1k002x670t8nfv2vsu','Analog Leather Strap Watch','M / Navy','BDM-WCH-001','https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80',4290,2,8580),
('cmtzd3x5f00fb670twtcyosfr','cmtzd3x5f00f9670t6bi7nndl','cmtzd3mad002b670ttfgxw74m','Embroidered Nida Abaya','M / Navy','BDM-ABY-001','https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80',3450,1,3450),
('cmtzd3xas00fj670thu12z7jm','cmtzd3xar00fh670tn88u64hg','cmtzd3mij002h670tsmdd3kjw','Pique Cotton Polo Shirt','M / Navy','BDM-PLO-001','https://images.unsplash.com/photo-1586790170083-2f7cead4c9d3?auto=format&fit=crop&w=900&q=80',1250,2,2500),
('cmtzd3xas00fk670tl8u2tfwp','cmtzd3xar00fh670tn88u64hg','cmtzd3myw002v670tsowutewt','Kundan Choker Necklace','M / Navy','BDM-JWL-002','https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80',2250,1,2250),
('cmtzd3xfc00fs670tm23ueqye','cmtzd3xfc00fq670tlczxatfr','cmtzd3mpv002n670t7mkr3c5h','Girls Party Frock','M / Navy','BDM-KID-002','https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80',1890,1,1890),
('cmtzd3xfc00ft670tb59lki3q','cmtzd3xfc00fq670tlczxatfr','cmtzd3n620031670tzj80ttqg','Leather Formal Oxford Shoes','M / Navy','BDM-SHO-001','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',3990,2,7980),
('cmtzd3xfc00fu670tjxv35yeu','cmtzd3xfc00fq670tlczxatfr','cmtzd3l1g001b670tz87dxc3t','Premium Embroidered Cotton Panjabi','M / Navy','BDM-PNJ-001','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',2450,1,2450),
('cmtzd3xhm00g0670trmxfgrz1','cmtzd3xhm00fy670tqja61zx8','cmtzd3mwl002t670tp2repw85','Traditional Gold Plated Jewellery Set','M / Navy','BDM-JWL-001','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80',3450,2,6900),
('cmtzd3xly00g8670tp61vk2xz','cmtzd3xly00g6670tykadg58h','cmtzd3n3s002z670t90on4rf3','Smart Fitness Band','M / Navy','BDM-WCH-002','https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80',2890,1,2890),
('cmtzd3xly00g9670tsna5weog','cmtzd3xly00g6670tykadg58h','cmtzd3nla003d670tga0dmkyi','Terracotta Tea Set','M / Navy','BDM-HOM-003','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',990,2,1980),
('cmtzd3xoo00ge670t2rwcbylw','cmtzd3xoo00gc670tu6r04jsg','cmtzd3nc00035670tnwbyj7xo','Attar Oil Perfume — 12ml','M / Navy','BDM-PRF-001','https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',1250,2,2500),
('cmtzd3xoo00gf670t39fckz8h','cmtzd3xoo00gc670tu6r04jsg','cmtzd3l6d001f670tp6nhorg9','Casual Printed Cotton Panjabi','M / Navy','BDM-PNJ-003','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',1690,1,1690),
('cmtzd3xoo00gg670t7ieaazhg','cmtzd3xoo00gc670tu6r04jsg','cmtzd3lou001t670tfgbw1t72','Embroidered Cotton Kurti','M / Navy','BDM-KRT-001','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',1450,2,2900),
('cmtzd3xqy00gl670tesp1f2zd','cmtzd3xqy00gj670tzn2rh49g','cmtzd3nj0003b670tim99eopc','Nakshi Kantha Cushion Cover Set','M / Navy','BDM-HOM-002','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',1490,1,1490),
('cmtzd3xt900gr670tfb0y9hg7','cmtzd3xt800gp670tsyot1n1z','cmtzd3l3z001d670txrzkac9g','Silk Blend Festive Panjabi','M / Navy','BDM-PNJ-002','https://images.unsplash.com/photo-1603252109303-2751441e0052?auto=format&fit=crop&w=900&q=80',3890,2,7780),
('cmtzd3xt900gs670tbgwrsxzf','cmtzd3xt800gp670tsyot1n1z','cmtzd3llj001r670tyjc45d40','Muslin Jamdani Bridal Saree','M / Navy','BDM-SAR-005','https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80',24500,1,24500),
('cmtzd3xw400gy670tk9va804c','cmtzd3xw400gw670tpv9cc2bl','cmtzd3law001j670tort68duj','Jamdani Handloom Saree','M / Navy','BDM-SAR-001','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',8500,1,8500),
('cmtzd3xw400gz670tvhkrm0nz','cmtzd3xw400gw670tpv9cc2bl','cmtzd3lu3001x670ts52nh51k','Chikankari Kurti with Lace Detail','M / Navy','BDM-KRT-003','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',2250,2,4500),
('cmtzd3xw400h0670t5vs7uowu','cmtzd3xw400gw670tpv9cc2bl','cmtzd3mad002b670ttfgxw74m','Embroidered Nida Abaya','M / Navy','BDM-ABY-001','https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80',3450,1,3450),
('cmtzd3xyz00h7670th9rrn0oe','cmtzd3xyz00h5670thi5pf0rk','cmtzd3lit001p670t8r6n0vor','Georgette Party Saree with Sequins','M / Navy','BDM-SAR-004','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',4200,2,8400),
('cmtzd3y4200hf670tpby9oi0f','cmtzd3y4200hd670t3py9h7vm','cmtzd3lrm001v670tsxghi3dg','Rayon Printed A-Line Kurti','M / Navy','BDM-KRT-002','https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80',1190,1,1190),
('cmtzd3y4200hg670ta9tljq2j','cmtzd3y4200hd670t3py9h7vm','cmtzd3m800029670tdizomf8j','Premium Georgette Hijab','M / Navy','BDM-HJB-001','https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80',690,2,1380),
('cmtzd3y8k00ho670to46plxfz','cmtzd3y8k00hm670tdjdu0rzl','cmtzd3lyq0021670ta1u7gq2q','Unstitched Three Piece Salwar Kameez','M / Navy','BDM-TPS-001','https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80',3250,2,6500),
('cmtzd3y8k00hp670tdc6rt2kf','cmtzd3y8k00hm670tdjdu0rzl','cmtzd3mfx002f670t9k8mkw28','Slim Fit Stretch Chino Pant','M / Navy','BDM-PNT-001','https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80',2190,1,2190),
('cmtzd3y8k00hq670ts3bjofhi','cmtzd3y8k00hm670tdjdu0rzl','cmtzd3mwl002t670tp2repw85','Traditional Gold Plated Jewellery Set','M / Navy','BDM-JWL-001','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80',3450,2,6900),
('cmtzd3yd100hy670tqppuymmf','cmtzd3yd100hw670twfixh78d','cmtzd3m5g0027670teeybs10z','Designer Party Lehenga Choli','M / Navy','BDM-LHG-001','https://images.unsplash.com/photo-1583935064411-7f41c23b22b1?auto=format&fit=crop&w=900&q=80',8900,1,8900),
('cmtzd3yfo00i4670tba3sndx8','cmtzd3yfo00i2670t1bbk12v6','cmtzd3mcp002d670tnx7jb2z5','Oxford Formal Shirt','M / Navy','BDM-SHT-001','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',1790,2,3580),
('cmtzd3yfo00i5670txc2t8vs0','cmtzd3yfo00i2670t1bbk12v6','cmtzd3muc002r670t37u2ars5','Jute Tote Bag with Print','M / Navy','BDM-BAG-002','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80',890,1,890),
('cmtzd3ykc00id670tdkb554r4','cmtzd3ykc00ib670tlb3k6a4a','cmtzd3mlg002j670t2tc85xfz','Graphic Print Cotton T-Shirt','M / Navy','BDM-TSH-001','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',790,1,790),
('cmtzd3ykc00ie670txebgq5y4','cmtzd3ykc00ib670tlb3k6a4a','cmtzd3n1k002x670t8nfv2vsu','Analog Leather Strap Watch','M / Navy','BDM-WCH-001','https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80',4290,2,8580),
('cmtzd3ykc00if670tdfj0e1vx','cmtzd3ykc00ib670tlb3k6a4a','cmtzd3nj0003b670tim99eopc','Nakshi Kantha Cushion Cover Set','M / Navy','BDM-HOM-002','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',1490,1,1490),
('cmtzd3ymq00ik670t1iauelsj','cmtzd3ymq00ii670twedswbop','cmtzd3ms4002p670t85hnc4kt','Handcrafted Leather Handbag','M / Navy','BDM-BAG-001','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',3890,2,7780),
('cmtzd3ypl00ip670t7vkqmeak','cmtzd3ypl00in670txi3b4uiu','cmtzd3myw002v670tsowutewt','Kundan Choker Necklace','M / Navy','BDM-JWL-002','https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80',2250,1,2250),
('cmtzd3ypm00iq670tkzl71zga','cmtzd3ypl00in670txi3b4uiu','cmtzd3ngp0039670tmmf0ehk7','Handloom Cotton Bed Cover Set','M / Navy','BDM-HOM-001','https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',3290,2,6580),
('cmtzd3ysa00iw670t6v4ip014','cmtzd3ysa00iu670t16vm4vn2','cmtzd3n620031670tzj80ttqg','Leather Formal Oxford Shoes','M / Navy','BDM-SHO-001','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',3990,2,7980),
('cmtzd3ysa00ix670tb7blpjk4','cmtzd3ysa00iu670t16vm4vn2','cmtzd3l1g001b670tz87dxc3t','Premium Embroidered Cotton Panjabi','M / Navy','BDM-PNJ-001','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',2450,1,2450),
('cmtzd3ysa00iy670t6r30awuv','cmtzd3ysa00iu670t16vm4vn2','cmtzd3lit001p670t8r6n0vor','Georgette Party Saree with Sequins','M / Navy','BDM-SAR-004','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',4200,2,8400),
('cmtzd3yut00j4670tuvemsr1o','cmtzd3yut00j2670t90n4zsou','cmtzd3nej0037670tlwzfpv64','Herbal Skincare Gift Set','M / Navy','BDM-BTY-001','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80',1890,1,1890),
('cmtzd3yxg00jb670tuab1fwa2','cmtzd3yxf00j9670taqyw5dwp','cmtzd3nla003d670tga0dmkyi','Terracotta Tea Set','M / Navy','BDM-HOM-003','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',990,2,1980),
('cmtzd3yxg00jc670t7hoj3ow8','cmtzd3yxf00j9670taqyw5dwp','cmtzd3lg1001n670tsc5hxdzo','Soft Cotton Tant Saree','M / Navy','BDM-SAR-003','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',2350,1,2350),
('cmtzd3z1z00jk670tcxrbcfkg','cmtzd3z1z00ji670t17tquv8c','cmtzd3l6d001f670tp6nhorg9','Casual Printed Cotton Panjabi','M / Navy','BDM-PNJ-003','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',1690,1,1690),
('cmtzd3z1z00jl670to8b9m2y5','cmtzd3z1z00ji670t17tquv8c','cmtzd3lou001t670tfgbw1t72','Embroidered Cotton Kurti','M / Navy','BDM-KRT-001','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',1450,2,2900),
('cmtzd3z1z00jm670t5r2vh4gr','cmtzd3z1z00ji670t17tquv8c','cmtzd3m5g0027670teeybs10z','Designer Party Lehenga Choli','M / Navy','BDM-LHG-001','https://images.unsplash.com/photo-1583935064411-7f41c23b22b1?auto=format&fit=crop&w=900&q=80',8900,1,8900),
('cmtzd3z6f00ju670tjvvvy6ch','cmtzd3z6f00js670tcgnnm0ky','cmtzd3ld7001l670t815akf7k','Katan Silk Saree with Zari Border','M / Navy','BDM-SAR-002','https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80',11200,2,22400),
('cmtzd3zb900k2670tdopkabs6','cmtzd3zb900k0670thwv63x0c','cmtzd3llj001r670tyjc45d40','Muslin Jamdani Bridal Saree','M / Navy','BDM-SAR-005','https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80',24500,1,24500),
('cmtzd3zb900k3670tr252u5b3','cmtzd3zb900k0670thwv63x0c','cmtzd3m340025670t7na9u0fl','Cotton Salwar Kameez Stitched Set','M / Navy','BDM-SLK-001','https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',2790,2,5580),
('cmtzd3zdl00k9670tbnr5vnnx','cmtzd3zdl00k7670twqld16x1','cmtzd3lu3001x670ts52nh51k','Chikankari Kurti with Lace Detail','M / Navy','BDM-KRT-003','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',2250,2,4500),
('cmtzd3zdl00ka670twjdfex1v','cmtzd3zdl00k7670twqld16x1','cmtzd3mad002b670ttfgxw74m','Embroidered Nida Abaya','M / Navy','BDM-ABY-001','https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80',3450,1,3450),
('cmtzd3zdl00kb670ty4zi7mcs','cmtzd3zdl00k7670twqld16x1','cmtzd3ms4002p670t85hnc4kt','Handcrafted Leather Handbag','M / Navy','BDM-BAG-001','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',3890,2,7780),
('cmtzd3zj700kj670tytfiwjb0','cmtzd3zj700kh670tg8wpshcj','cmtzd3m0v0023670ttak6l1t1','Embroidered Georgette Three Piece','M / Navy','BDM-TPS-002','https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',4890,1,4890),
('cmtzd3zm700ko670thoog755m','cmtzd3zm700km670t6uf3jj0s','cmtzd3m800029670tdizomf8j','Premium Georgette Hijab','M / Navy','BDM-HJB-001','https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80',690,2,1380),
('cmtzd3zm700kp670tbv5mm3ve','cmtzd3zm700km670t6uf3jj0s','cmtzd3mpv002n670t7mkr3c5h','Girls Party Frock','M / Navy','BDM-KID-002','https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80',1890,1,1890),
('cmtzd3zp500ku670tjygobqr3','cmtzd3zp500ks670tdzgqswl6','cmtzd3mfx002f670t9k8mkw28','Slim Fit Stretch Chino Pant','M / Navy','BDM-PNT-001','https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80',2190,1,2190),
('cmtzd3zp500kv670tw2ttpbs8','cmtzd3zp500ks670tdzgqswl6','cmtzd3mwl002t670tp2repw85','Traditional Gold Plated Jewellery Set','M / Navy','BDM-JWL-001','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80',3450,2,6900),
('cmtzd3zp500kw670thcqwswhg','cmtzd3zp500ks670tdzgqswl6','cmtzd3nej0037670tlwzfpv64','Herbal Skincare Gift Set','M / Navy','BDM-BTY-001','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80',1890,1,1890),
('cmtzd3zrg00l2670tyidjdi0l','cmtzd3zrg00l0670t25js60d8','cmtzd3mno002l670t52bsxzo0','Kids Festive Panjabi Set','M / Navy','BDM-KID-001','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=80',1490,2,2980),
('cmtzd3ztr00l8670tl5c89fxl','cmtzd3ztr00l6670thh1q78an','cmtzd3muc002r670t37u2ars5','Jute Tote Bag with Print','M / Navy','BDM-BAG-002','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80',890,1,890),
('cmtzd3ztr00l9670t8tbkn2l7','cmtzd3ztr00l6670thh1q78an','cmtzd3nc00035670tnwbyj7xo','Attar Oil Perfume — 12ml','M / Navy','BDM-PRF-001','https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',1250,2,2500),
('cmtzd3zw300lg670towuvw4zl','cmtzd3zw300le670tsrha34lf','cmtzd3n1k002x670t8nfv2vsu','Analog Leather Strap Watch','M / Navy','BDM-WCH-001','https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80',4290,2,8580),
('cmtzd3zw300lh670t2049in4f','cmtzd3zw300le670tsrha34lf','cmtzd3nj0003b670tim99eopc','Nakshi Kantha Cushion Cover Set','M / Navy','BDM-HOM-002','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',1490,1,1490),
('cmtzd3zw300li670tccvpfx9k','cmtzd3zw300le670tsrha34lf','cmtzd3ld7001l670t815akf7k','Katan Silk Saree with Zari Border','M / Navy','BDM-SAR-002','https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80',11200,2,22400),
('cmtzd400r00lq670tp7lz0stw','cmtzd400r00lo670tzzc58xaj','cmtzd3n9c0033670tkxsevxh3','Running Sports Sneakers','M / Navy','BDM-SHO-002','https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80',2650,1,2650),
('cmtzd405l00ly670t8ojgm2o5','cmtzd405k00lw670tpqja78ge','cmtzd3ngp0039670tmmf0ehk7','Handloom Cotton Bed Cover Set','M / Navy','BDM-HOM-001','https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',3290,2,6580),
('cmtzd405l00lz670tu6dkdcj8','cmtzd405k00lw670tpqja78ge','cmtzd3law001j670tort68duj','Jamdani Handloom Saree','M / Navy','BDM-SAR-001','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',8500,1,8500),
('cmtzd40bd00m7670t75m4hrm3','cmtzd40bd00m5670tmz22ffpb','cmtzd3l1g001b670tz87dxc3t','Premium Embroidered Cotton Panjabi','M / Navy','BDM-PNJ-001','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',2450,1,2450),
('cmtzd40bd00m8670tnbdd47l4','cmtzd40bd00m5670tmz22ffpb','cmtzd3lit001p670t8r6n0vor','Georgette Party Saree with Sequins','M / Navy','BDM-SAR-004','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',4200,2,8400),
('cmtzd40bd00m9670tu76071xr','cmtzd40bd00m5670tmz22ffpb','cmtzd3m0v0023670ttak6l1t1','Embroidered Georgette Three Piece','M / Navy','BDM-TPS-002','https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',4890,1,4890),
('cmtzd40dz00mf670tst0ghdhp','cmtzd40dz00md670tvp084qzi','cmtzd3l8o001h670tcbernipe','Embroidered Karchupi Panjabi','M / Navy','BDM-PNJ-004','https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',5450,2,10900),
('cmtzd40im00mn670tpbzze51e','cmtzd40im00ml670tkymzfh9v','cmtzd3lg1001n670tsc5hxdzo','Soft Cotton Tant Saree','M / Navy','BDM-SAR-003','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',2350,1,2350),
('cmtzd40im00mo670t6eag608u','cmtzd40im00ml670tkymzfh9v','cmtzd3lyq0021670ta1u7gq2q','Unstitched Three Piece Salwar Kameez','M / Navy','BDM-TPS-001','https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80',3250,2,6500),
('cmtzd40l700mt670ttgsoxgc9','cmtzd40l700mr670t2heljf49','cmtzd3lou001t670tfgbw1t72','Embroidered Cotton Kurti','M / Navy','BDM-KRT-001','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',1450,2,2900),
('cmtzd40l700mu670t1f2i7hnx','cmtzd40l700mr670t2heljf49','cmtzd3m5g0027670teeybs10z','Designer Party Lehenga Choli','M / Navy','BDM-LHG-001','https://images.unsplash.com/photo-1583935064411-7f41c23b22b1?auto=format&fit=crop&w=900&q=80',8900,1,8900),
('cmtzd40l700mv670tecd4hqi8','cmtzd40l700mr670t2heljf49','cmtzd3mno002l670t52bsxzo0','Kids Festive Panjabi Set','M / Navy','BDM-KID-001','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=80',1490,2,2980);

-- Page: 8 rows
INSERT INTO `Page` (`id`, `title`, `titleBn`, `slug`, `content`, `excerpt`, `template`, `status`, `showInMenu`, `menuOrder`, `featuredImage`, `metaTitle`, `metaDesc`, `metaKeywords`, `createdAt`, `updatedAt`) VALUES
('cmtzd3p0e004w670tlyc5w0id','About Us','আমাদের সম্পর্কে','about','<h2>Who We Are</h2><p>BD Market is a Bangladeshi fashion and lifestyle store built for the modern shopper. We bring together authentic local craftsmanship — Jamdani sarees from Narayanganj, panjabis from Dhaka, jute goods from Faridpur — and make them available to every district of Bangladesh with cash on delivery.</p><h2>Our Mission</h2><p>To make authentic Bangladeshi fashion accessible, affordable and reliable — while supporting the artisans and weavers who keep our heritage alive.</p><h2>Why Shop With Us</h2><ul><li><strong>Authentic products</strong> — sourced directly from Bangladeshi manufacturers and artisans</li><li><strong>Cash on Delivery</strong> — available in every district, no advance payment needed</li><li><strong>Nationwide delivery</strong> — 64 districts covered within 1–7 business days</li><li><strong>Easy returns</strong> — 7-day return policy on unused items</li><li><strong>Secure payment</strong> — bKash, Nagad, Rocket and card payments via SSLCommerz</li></ul>',NULL,'default','published',1,1,NULL,'About BD Market — Authentic Bangladeshi Fashion Store','Learn about BD Market, a Bangladeshi fashion and lifestyle store committed to authentic local craftsmanship and nationwide cash on delivery.',NULL,'2026-09-13 05:17:01.407','2026-09-13 05:17:01.407'),
('cmtzd3p0e004x670t3f59cevw','Contact Us','যোগাযোগ','contact','<h2>Get in Touch</h2><p>We are here to help you 7 days a week.</p><h3>Customer Support</h3><p><strong>Hotline:</strong> 01700-000000 (9 AM – 9 PM)<br><strong>WhatsApp:</strong> +880 1700-000000<br><strong>Email:</strong> support@bdmarket.com.bd</p><h3>Head Office</h3><p>House 12, Road 5, Dhanmondi<br>Dhaka 1205, Bangladesh</p><h3>Order Tracking</h3><p>You can track your order anytime from your <a href="/account/orders">account page</a> or by entering your order number on our tracking page.</p>',NULL,'default','published',1,2,NULL,'Contact BD Market — Customer Support & Hotline','Contact BD Market customer support. Call our hotline, WhatsApp us or email us for order help, returns and product queries.',NULL,'2026-09-13 05:17:01.407','2026-09-13 05:17:01.407'),
('cmtzd3p0e004y670ttz917jbv','Privacy Policy','প্রাইভেসি পলিসি','privacy-policy','<h2>Privacy Policy</h2><p>Last updated: September 2026</p><p>BD Market respects your privacy. This policy explains what information we collect, how we use it, and your rights.</p><h3>Information We Collect</h3><ul><li>Name, phone number and delivery address for order fulfilment</li><li>Email address for order confirmation and account access</li><li>Payment reference information (we never store card numbers or wallet PINs)</li><li>Browsing data to improve our store experience</li></ul><h3>How We Use Your Information</h3><p>Your information is used solely to process orders, arrange delivery, provide customer support and improve our services. We never sell your personal data to third parties.</p><h3>Data Sharing</h3><p>We share delivery details with our courier partners only as needed to deliver your order.</p><h3>Your Rights</h3><p>You may request access to, correction of, or deletion of your personal data by emailing support@bdmarket.com.bd.</p>',NULL,'default','published',0,0,NULL,'Privacy Policy | BD Market','Read how BD Market collects, uses and protects your personal information.',NULL,'2026-09-13 05:17:01.407','2026-09-13 05:17:01.407'),
('cmtzd3p0e004z670t8n7mw3m9','Terms & Conditions',NULL,'terms','<h2>Terms & Conditions</h2><p>By using bdmarket.com.bd you agree to the following terms.</p><h3>Orders</h3><p>All orders are subject to product availability and confirmation. We reserve the right to cancel any order.</p><h3>Pricing</h3><p>All prices are in Bangladeshi Taka (BDT) and inclusive of applicable VAT unless stated otherwise. Prices may change without notice.</p><h3>Delivery</h3><p>Standard delivery is 1–7 business days depending on district. Delivery times are estimates and not guaranteed.</p><h3>Returns</h3><p>Unused items in original packaging may be returned within 7 days of delivery. Return shipping costs are the customer''s responsibility unless the item is defective.</p><h3>Payment</h3><p>Cash on delivery, bKash, Nagad, Rocket and card payments are accepted. Orders paid via mobile wallet are confirmed after verification.</p>',NULL,'default','published',0,0,NULL,'Terms & Conditions | BD Market','Terms and conditions for shopping with BD Market.',NULL,'2026-09-13 05:17:01.407','2026-09-13 05:17:01.407'),
('cmtzd3p0e0050670tqyk5io62','Return & Refund Policy',NULL,'returns','<h2>Return & Refund Policy</h2><h3>Return Window</h3><p>You may request a return within <strong>7 days</strong> of receiving your order.</p><h3>Conditions</h3><ul><li>Item must be unused, unwashed and in original packaging with tags attached</li><li>Original invoice must be presented</li><li>Intimate apparel, cosmetics and personalised items are non-returnable</li></ul><h3>How to Return</h3><ol><li>Call our hotline 01700-000000 or email support@bdmarket.com.bd</li><li>Provide your order number and reason for return</li><li>We will arrange a pickup or provide a return address</li></ol><h3>Refunds</h3><p>Refunds are processed within 5–7 business days after we receive and inspect the returned item. Refunds are issued via the original payment method, or as store credit for cash on delivery orders.</p>',NULL,'default','published',1,3,NULL,'Return & Refund Policy | BD Market','BD Market 7-day return and refund policy explained.',NULL,'2026-09-13 05:17:01.407','2026-09-13 05:17:01.407'),
('cmtzd3p0e0051670tvbe2ivl1','Shipping & Delivery',NULL,'shipping','<h2>Shipping & Delivery</h2><h3>Delivery Charges</h3><table><thead><tr><th>Area</th><th>Charge</th><th>Time</th></tr></thead><tbody><tr><td>Inside Dhaka City</td><td>৳60</td><td>1–2 days</td></tr><tr><td>Dhaka Suburbs</td><td>৳100</td><td>2–3 days</td></tr><tr><td>Chattogram Division</td><td>৳130</td><td>3–5 days</td></tr><tr><td>Other Divisions</td><td>৳150</td><td>4–7 days</td></tr></tbody></table><h3>Free Shipping</h3><p>Free delivery on all orders above <strong>৳2,000</strong> inside Dhaka and <strong>৳5,000</strong> nationwide.</p><h3>Cash on Delivery</h3><p>COD is available in all 64 districts. Please keep the exact amount ready for the delivery agent.</p>',NULL,'default','published',0,0,NULL,'Shipping & Delivery Information | BD Market','Delivery charges, times and free shipping thresholds for BD Market across Bangladesh.',NULL,'2026-09-13 05:17:01.407','2026-09-13 05:17:01.407'),
('cmtzd3p0e0052670tuz5k16xj','Track Your Order',NULL,'track-order','<h2>Track Your Order</h2><p>Enter your order number below to check the current status of your delivery.</p>',NULL,'default','published',0,0,NULL,'Track Your Order | BD Market','Track your BD Market order status online.',NULL,'2026-09-13 05:17:01.407','2026-09-13 05:17:01.407'),
('cmtzd3p0e0053670tm14abhbz','FAQ',NULL,'faq','<h2>Frequently Asked Questions</h2><h3>How do I place an order?</h3><p>Browse our shop, add items to your cart and proceed to checkout. You can order as a guest or create an account.</p><h3>What payment methods do you accept?</h3><p>Cash on Delivery, bKash, Nagad, Rocket and card payments via SSLCommerz.</p><h3>How long does delivery take?</h3><p>1–2 days inside Dhaka, 3–7 days for other districts.</p><h3>Can I return an item?</h3><p>Yes — unused items can be returned within 7 days. See our <a href="/pages/returns">Return Policy</a>.</p><h3>Do you deliver outside Bangladesh?</h3><p>Currently we deliver only within Bangladesh.</p><h3>Is my payment secure?</h3><p>Yes. Wallet payments are verified via gateway APIs and we never store card or PIN data.</p>',NULL,'default','published',0,0,NULL,'FAQ — Frequently Asked Questions | BD Market','Answers to common questions about ordering, payment, delivery and returns at BD Market.',NULL,'2026-09-13 05:17:01.407','2026-09-13 05:17:01.407');

-- PaymentMethod: 6 rows
INSERT INTO `PaymentMethod` (`id`, `code`, `name`, `nameBn`, `description`, `icon`, `instructions`, `isEnabled`, `isSandbox`, `fee`, `feeType`, `config`, `position`, `updatedAt`) VALUES
('cmtzd3ovv004n670turygh993','cod','Cash on Delivery','ক্যাশ অন ডেলিভারি','Pay in cash when your order arrives at your doorstep.','💵','Please keep the exact amount ready. Our delivery agent will collect payment at delivery.',1,0,0,'fixed',NULL,0,'2026-09-13 05:17:01.243'),
('cmtzd3ovv004o670to7m64zr0','bkash','bKash','বিকাশ','Pay instantly with bKash mobile wallet.','📱','Send money to 01700-000000 (Merchant). Use your order number as reference. Your order will be confirmed after payment verification.',1,1,0,'percent','{"merchant":"01700000000","type":"merchant"}',1,'2026-09-13 05:17:01.243'),
('cmtzd3ovv004p670t75aoiuvf','nagad','Nagad','নগদ','Pay with Nagad mobile wallet — fast and secure.','📲','Send money to 01700-000000 (Merchant). Include your order number in the reference field.',1,1,0,'fixed','{"merchant":"01700000000"}',2,'2026-09-13 05:17:01.243'),
('cmtzd3ovv004q670to34txejw','rocket','Rocket','রকেট','DBBL Rocket mobile banking.','🚀','Send money to 017000000001-2. Mention your order number as reference.',1,1,0,'fixed',NULL,3,'2026-09-13 05:17:01.243'),
('cmtzd3ovv004r670trmf83gab','sslcommerz','Card / Net Banking (SSLCommerz)','কার্ড / নেট ব্যাংকিং','Visa, Mastercard, AMEX and internet banking via SSLCommerz.','💳','You will be redirected to the SSLCommerz secure payment gateway.',1,1,0,'percent',NULL,4,'2026-09-13 05:17:01.243'),
('cmtzd3ovv004s670tvlg2r31o','bank','Bank Transfer','ব্যাংক ট্রান্সফার','Direct bank transfer to our account.','🏦','Transfer to: BD Market Ltd, A/C 1234567890, Dutch-Bangla Bank, Dhanmondi Branch. Send the deposit slip to support@bdmarket.com.bd.',0,0,0,'fixed',NULL,5,'2026-09-13 05:17:01.243');

-- Post: 6 rows
INSERT INTO `Post` (`id`, `title`, `slug`, `excerpt`, `content`, `coverImage`, `category`, `tags`, `authorName`, `status`, `featured`, `readMinutes`, `viewCount`, `metaTitle`, `metaDesc`, `publishedAt`, `createdAt`, `updatedAt`) VALUES
('cmtzd3p2o0054670t6peuqdai','Jamdani: The Heritage Weave of Bangladesh','jamdani-heritage-weave-bangladesh','Jamdani is more than fabric — it is a 2,000-year-old conversation between weaver and thread. Here is why it matters.','<p>Jamdani weaving is one of the most intricate textile arts in the world, and it belongs to Bangladesh. Recognised by UNESCO as Intangible Cultural Heritage, it is practised today by thousands of weavers along the banks of the Shitalakshya river in Narayanganj and Dhaka.</p><h2>What Makes Jamdani Different</h2><p>Unlike printed or embroidered fabric, Jamdani motifs are woven <em>into</em> the cloth. The weaver uses a supplementary weft technique, adding each motif by hand as the fabric grows. A single saree can take 15 to 45 days.</p><h2>The Motifs</h2><p>Traditional motifs include <em>panna hajar</em> (thousand emeralds), <em>tercha</em> (diagonal waves) and <em>jor buti</em> (paired flowers). Each carries regional meaning passed down through generations.</p><h2>How to Care for Jamdani</h2><ul><li>Dry clean only for the first wash</li><li>Store folded in a cotton or muslin bag</li><li>Rotate folds every few months to prevent creasing</li><li>Keep away from direct sunlight and naphthalene balls</li></ul><p>When you buy a Jamdani saree, you are not just buying clothing — you are supporting a weaver family and keeping an ancient craft alive.</p>','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80','Culture','jamdani,heritage,handloom,culture','BD Market Team','published',1,7,3422,NULL,NULL,'2026-09-13 05:17:01.488','2026-09-13 05:17:01.488','2026-09-17 09:58:23.082'),
('cmtzd3p2o0055670ty73ttdom','Eid Fashion Guide 2026: What to Wear This Season','eid-fashion-guide-2026','From karchupi panjabi to muslin saree — our complete Eid styling guide for 2026 with budget picks.','<p>Eid is the biggest fashion moment of the Bangladeshi calendar. Here is how to look your best in 2026 without overspending.</p><h2>For Men</h2><p>The panjabi remains king. This year we are seeing a shift toward <strong>muted tones</strong> — cream, sage, dusty rose — paired with white pyjama and a simple leather <em>nagra</em>. If you want to stand out, a karchupi panjabi with tonal embroidery delivers impact without being loud.</p><h2>For Women</h2><p>Muslin and Jamdani sarees are always the safe luxury choice. For a modern twist, pair a plain silk saree with a heavily embroidered blouse. Three-piece sets in georgette remain the most comfortable festive option for long days.</p><h2>Budget Picks</h2><ul><li>Under ৳2000 — printed cotton panjabi, rayon kurti</li><li>৳2000–5000 — embroidered cotton panjabi, cotton kurti-palazzo set</li><li>৳5000+ — katan silk saree, karchupi panjabi</li></ul><h2>Kids</h2><p>Comfort matters more than anything. Choose soft cotton panjabi sets with elasticated waists so they can run around freely.</p>','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80','Fashion','eid,fashion,guide,panjabi','BD Market Team','published',1,6,5222,NULL,NULL,'2026-09-13 05:17:01.488','2026-09-13 05:17:01.488','2026-09-14 08:48:02.798'),
('cmtzd3p2o0056670taincuixz','How to Choose the Right Saree for Your Body Type','choose-right-saree-body-type','Petite, tall, curvy or straight — there is a saree drape and fabric that flatters every silhouette.','<p>A saree flatters everyone — the trick is choosing the right fabric, border weight and drape.</p><h2>Petite Frames</h2><p>Choose lighter fabrics like chiffon, georgette or soft cotton. Avoid heavy borders that overwhelm your frame. A narrower border and a slightly higher drape add height.</p><h2>Tall Frames</h2><p>You can carry bold borders, broad pallus and heavy weaves like Katan silk. Large motifs look proportionate on you.</p><h2>Curvy Silhouettes</h2><p>Crepe, georgette and South Cotton drape smoothly without adding bulk. Avoid stiff starched fabrics. A well-fitted blouse is more important than the saree itself.</p><h2>Straight Figures</h2><p>Textured fabric — Jamdani, tissue, organza — creates depth. Add a pleated pallu and a belt to define the waist.</p>','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80','Style Guide','saree,style,guide,size','BD Market Team','published',0,5,2874,NULL,NULL,'2026-09-13 05:17:01.488','2026-09-13 05:17:01.488','2026-09-13 05:17:01.488'),
('cmtzd3p2o0057670tydep5r0b','Cash on Delivery in Bangladesh: How It Works','cash-on-delivery-bangladesh-guide','COD makes online shopping trust-free. Here is exactly what to expect when your parcel arrives.','<p>Cash on Delivery is the most trusted payment method in Bangladesh — and for good reason. You pay only when the product is in your hands.</p><h2>The COD Process</h2><ol><li>Place your order without any advance payment</li><li>We confirm by phone or SMS within a few hours</li><li>Your parcel is dispatched through our courier partner</li><li>The delivery agent calls before arriving</li><li>Inspect the parcel, then pay in cash</li></ol><h2>Tips</h2><ul><li>Keep the exact amount ready — agents rarely carry change</li><li>You may open and inspect the packet before paying (for most items)</li><li>Refusing delivery repeatedly may lead to COD being disabled on your account</li></ul><h2>COD Charges</h2><p>COD is free on all orders — no extra handling fee.</p>','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80','Guides','cod,delivery,guide,payment','BD Market Team','published',0,4,1936,NULL,NULL,'2026-09-13 05:17:01.488','2026-09-13 05:17:01.488','2026-09-13 05:17:01.488'),
('cmtzd3p2o0058670tpzgej4qd','Panjabi Care: Make Your Festive Wear Last Years','panjabi-care-guide','Embroidery, silk blends and starch — how to wash and store panjabi so it looks new every Eid.','<p>A good panjabi is an investment. With the right care it will serve you for a decade of Eids.</p><h2>Cotton Panjabi</h2><p>Machine wash cold on a gentle cycle, inside out. Do not wring. Dry in shade to prevent fading. Iron on medium while slightly damp.</p><h2>Silk & Silk Blend</h2><p>Dry clean only. If hand washing, use a mild baby shampoo in cold water, never rub the fabric and never wring. Dry flat in shade.</p><h2>Embroidered / Karchupi</h2><p>Dry clean only. Never iron directly on embroidery — use a pressing cloth or iron from the reverse side. Store folded with muslin between layers.</p><h2>Storage</h2><ul><li>Use padded hangers for silk, fold cotton</li><li>Avoid plastic bags — they trap moisture</li><li>Add neem leaves instead of naphthalene for natural protection</li></ul>','https://images.unsplash.com/photo-1603252109303-2751441e0052?auto=format&fit=crop&w=900&q=80','Care','panjabi,care,washing,maintenance','BD Market Team','published',0,5,1452,NULL,NULL,'2026-09-13 05:17:01.488','2026-09-13 05:17:01.488','2026-09-13 05:17:01.488'),
('cmtzd3p2o0059670thq96r9s3','Top 10 Bangladeshi Fashion Brands You Should Know','top-bangladeshi-fashion-brands','From heritage houses to new-gen labels — the Bangladeshi brands shaping what we wear.','<p>Bangladeshi fashion has never been more exciting. These are the labels defining the moment.</p><h2>Heritage Houses</h2><p><strong>Aarong</strong> — the benchmark for Bangladeshi craft retail, supporting over 65,000 artisans. <strong>Kay Kraft</strong> — known for bold prints and fusion silhouettes. <strong>Rang Bangladesh</strong> — the home of authentic Jamdani.</p><h2>Contemporary Labels</h2><p><strong>Yellow</strong> — clean, minimal, everyday wear. <strong>Le Reve</strong> — occasion-wear specialists. <strong>Dorjibari</strong> — the go-to for festive panjabi. <strong>Sailor</strong> — reliable basics at fair prices.</p><h2>New Generation</h2><p><strong>Infinity</strong> — youth-focused casualwear. <strong>Ecstasy</strong> — party and bridal. <strong>Anjan''s</strong> — menswear essentials.</p><p>Every purchase from a local brand keeps money, skills and jobs inside Bangladesh.</p>','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80','Brands','brands,bangladesh,fashion,local','BD Market Team','published',0,8,4103,NULL,NULL,'2026-09-13 05:17:01.488','2026-09-13 05:17:01.488','2026-09-13 05:17:01.488');

-- Product: 38 rows
INSERT INTO `Product` (`id`, `name`, `nameBn`, `slug`, `sku`, `barcode`, `type`, `description`, `shortDesc`, `price`, `comparePrice`, `costPrice`, `currency`, `stock`, `lowStockAlert`, `manageStock`, `stockStatus`, `weight`, `dimensions`, `categoryId`, `brandId`, `images`, `tags`, `attributes`, `variants`, `featured`, `bestseller`, `newArrival`, `status`, `rating`, `reviewCount`, `soldCount`, `viewCount`, `fabric`, `occasion`, `fit`, `careInstructions`, `countryOfOrigin`, `metaTitle`, `metaDesc`, `metaKeywords`, `ogImage`, `canonical`, `createdAt`, `updatedAt`) VALUES
('cmtzd3l1g001b670tz87dxc3t','Premium Embroidered Cotton Panjabi','প্রিমিয়াম এমব্রয়ডারি কটন পাঞ্জাবি','premium-embroidered-cotton-panjabi','BDM-PNJ-001',NULL,'variable','Crafted from premium 100% cotton with intricate hand embroidery on the placket and collar. Features a classic mandarin collar, full button placket and side vents for ease of movement. Breathable fabric makes it comfortable for long festive days.

- Fabric: 100% Premium Cotton
- Collar: Mandarin
- Sleeve: Full Sleeve
- Fit: Regular Fit
- Care: Machine wash cold, do not bleach','Hand-embroidered cotton panjabi with mandarin collar — ideal for Eid and festive occasions.',2450,3200,1400,'BDT',48,5,1,'instock',NULL,NULL,'cmtzd3jlm000k670tg5b5m7tm','cmtzd3kd90010670tvq03ubqt','["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1603252109303-2751441e0052?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80"]','panjabi,eid,traditional,men','[{"name":"Fabric","values":["100% Cotton"]},{"name":"Occasion","values":["Eid, Wedding, Festive"]},{"name":"Fit","values":["Regular Fit"]},{"name":"Size","values":["S","M","L","XL","XXL"]},{"name":"Color","values":["White","Navy","Maroon"]}]','[{"id":"s-white","size":"S","color":"White","price":2450,"stock":3,"sku":"BDM-PNJ-001-S-WHITE"},{"id":"s-navy","size":"S","color":"Navy","price":2450,"stock":3,"sku":"BDM-PNJ-001-S-NAVY"},{"id":"s-maroon","size":"S","color":"Maroon","price":2450,"stock":3,"sku":"BDM-PNJ-001-S-MAROON"},{"id":"m-white","size":"M","color":"White","price":2450,"stock":3,"sku":"BDM-PNJ-001-M-WHITE"},{"id":"m-navy","size":"M","color":"Navy","price":2450,"stock":3,"sku":"BDM-PNJ-001-M-NAVY"},{"id":"m-maroon","size":"M","color":"Maroon","price":2450,"stock":3,"sku":"BDM-PNJ-001-M-MAROON"},{"id":"l-white","size":"L","color":"White","price":2450,"stock":3,"sku":"BDM-PNJ-001-L-WHITE"},{"id":"l-navy","size":"L","color":"Navy","price":2450,"stock":3,"sku":"BDM-PNJ-001-L-NAVY"},{"id":"l-maroon","size":"L","color":"Maroon","price":2450,"stock":3,"sku":"BDM-PNJ-001-L-MAROON"},{"id":"xl-white","size":"XL","color":"White","price":2450,"stock":3,"sku":"BDM-PNJ-001-XL-WHITE"},{"id":"xl-navy","size":"XL","color":"Navy","price":2450,"stock":3,"sku":"BDM-PNJ-001-XL-NAVY"},{"id":"xl-maroon","size":"XL","color":"Maroon","price":2450,"stock":3,"sku":"BDM-PNJ-001-XL-MAROON"},{"id":"xxl-white","size":"XXL","color":"White","price":2450,"stock":3,"sku":"BDM-PNJ-001-XXL-WHITE"},{"id":"xxl-navy","size":"XXL","color":"Navy","price":2450,"stock":3,"sku":"BDM-PNJ-001-XXL-NAVY"},{"id":"xxl-maroon","size":"XXL","color":"Maroon","price":2450,"stock":3,"sku":"BDM-PNJ-001-XXL-MAROON"}]',1,1,1,'published',4.8,126,412,2925,'100% Cotton','Eid, Wedding, Festive','Regular Fit','Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Premium Embroidered Cotton Panjabi — Buy Online in Bangladesh | BD Market','Hand-embroidered cotton panjabi with mandarin collar — ideal for Eid and festive occasions.','panjabi,eid,traditional,men','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:56.260','2026-09-15 09:03:09.147'),
('cmtzd3l3z001d670txrzkac9g','Silk Blend Festive Panjabi','সিল্ক ব্লেন্ড ফেস্টিভ পাঞ্জাবি','silk-blend-festive-panjabi','BDM-PNJ-002',NULL,'variable','A refined silk-blend panjabi with a soft sheen and self-textured weave. Tailored for wedding and reception wear with a structured shoulder and clean silhouette.

- Fabric: Silk Blend
- Fit: Slim Fit
- Care: Dry clean recommended','Lustrous silk-blend panjabi with subtle self-texture — perfect for weddings.',3890,4800,2200,'BDT',24,5,1,'instock',NULL,NULL,'cmtzd3jlm000k670tg5b5m7tm','cmtzd3kjq0013670tg0wt2yo8','["https://images.unsplash.com/photo-1603252109303-2751441e0052?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80"]','panjabi,silk,wedding','[{"name":"Fabric","values":["Silk Blend"]},{"name":"Occasion","values":["Wedding, Reception"]},{"name":"Size","values":["M","L","XL","XXL"]},{"name":"Color","values":["Cream","Black","Teal"]}]','[{"id":"m-cream","size":"M","color":"Cream","price":3890,"stock":2,"sku":"BDM-PNJ-002-M-CREAM"},{"id":"m-black","size":"M","color":"Black","price":3890,"stock":2,"sku":"BDM-PNJ-002-M-BLACK"},{"id":"m-teal","size":"M","color":"Teal","price":3890,"stock":2,"sku":"BDM-PNJ-002-M-TEAL"},{"id":"l-cream","size":"L","color":"Cream","price":3890,"stock":2,"sku":"BDM-PNJ-002-L-CREAM"},{"id":"l-black","size":"L","color":"Black","price":3890,"stock":2,"sku":"BDM-PNJ-002-L-BLACK"},{"id":"l-teal","size":"L","color":"Teal","price":3890,"stock":2,"sku":"BDM-PNJ-002-L-TEAL"},{"id":"xl-cream","size":"XL","color":"Cream","price":3890,"stock":2,"sku":"BDM-PNJ-002-XL-CREAM"},{"id":"xl-black","size":"XL","color":"Black","price":3890,"stock":2,"sku":"BDM-PNJ-002-XL-BLACK"},{"id":"xl-teal","size":"XL","color":"Teal","price":3890,"stock":2,"sku":"BDM-PNJ-002-XL-TEAL"},{"id":"xxl-cream","size":"XXL","color":"Cream","price":3890,"stock":2,"sku":"BDM-PNJ-002-XXL-CREAM"},{"id":"xxl-black","size":"XXL","color":"Black","price":3890,"stock":2,"sku":"BDM-PNJ-002-XXL-BLACK"},{"id":"xxl-teal","size":"XXL","color":"Teal","price":3890,"stock":2,"sku":"BDM-PNJ-002-XXL-TEAL"}]',1,0,1,'published',4.7,68,187,1321,'Silk Blend','Wedding, Reception',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Silk Blend Festive Panjabi — Buy Online in Bangladesh | BD Market','Lustrous silk-blend panjabi with subtle self-texture — perfect for weddings.','panjabi,silk,wedding','https://images.unsplash.com/photo-1603252109303-2751441e0052?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:56.351','2026-09-15 08:32:57.755'),
('cmtzd3l6d001f670tp6nhorg9','Casual Printed Cotton Panjabi','ক্যাজুয়াল প্রিন্টেড কটন পাঞ্জাবি','casual-printed-cotton-panjabi','BDM-PNJ-003',NULL,'variable','Lightweight printed cotton panjabi designed for daily wear. Soft hand-feel, easy to wash and holds colour well after repeated washes.','Everyday cotton panjabi with a modern block print — comfortable and affordable.',1690,2200,950,'BDT',62,5,1,'instock',NULL,NULL,'cmtzd3jlm000k670tg5b5m7tm','cmtzd3khm0012670tsfj4s9ng','["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80"]','panjabi,casual,daily','[{"name":"Fabric","values":["Cotton"]},{"name":"Occasion","values":["Casual, Daily"]},{"name":"Size","values":["S","M","L","XL"]},{"name":"Color","values":["Grey","Olive","Blue"]}]','[{"id":"s-grey","size":"S","color":"Grey","price":1690,"stock":5,"sku":"BDM-PNJ-003-S-GREY"},{"id":"s-olive","size":"S","color":"Olive","price":1690,"stock":5,"sku":"BDM-PNJ-003-S-OLIVE"},{"id":"s-blue","size":"S","color":"Blue","price":1690,"stock":5,"sku":"BDM-PNJ-003-S-BLUE"},{"id":"m-grey","size":"M","color":"Grey","price":1690,"stock":5,"sku":"BDM-PNJ-003-M-GREY"},{"id":"m-olive","size":"M","color":"Olive","price":1690,"stock":5,"sku":"BDM-PNJ-003-M-OLIVE"},{"id":"m-blue","size":"M","color":"Blue","price":1690,"stock":5,"sku":"BDM-PNJ-003-M-BLUE"},{"id":"l-grey","size":"L","color":"Grey","price":1690,"stock":5,"sku":"BDM-PNJ-003-L-GREY"},{"id":"l-olive","size":"L","color":"Olive","price":1690,"stock":5,"sku":"BDM-PNJ-003-L-OLIVE"},{"id":"l-blue","size":"L","color":"Blue","price":1690,"stock":5,"sku":"BDM-PNJ-003-L-BLUE"},{"id":"xl-grey","size":"XL","color":"Grey","price":1690,"stock":5,"sku":"BDM-PNJ-003-XL-GREY"},{"id":"xl-olive","size":"XL","color":"Olive","price":1690,"stock":5,"sku":"BDM-PNJ-003-XL-OLIVE"},{"id":"xl-blue","size":"XL","color":"Blue","price":1690,"stock":5,"sku":"BDM-PNJ-003-XL-BLUE"}]',0,1,1,'published',4.5,94,356,2520,'Cotton','Casual, Daily',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Casual Printed Cotton Panjabi — Buy Online in Bangladesh | BD Market','Everyday cotton panjabi with a modern block print — comfortable and affordable.','panjabi,casual,daily','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:56.438','2026-09-17 08:52:51.342'),
('cmtzd3l8o001h670tcbernipe','Embroidered Karchupi Panjabi','কারচুপি পাঞ্জাবি','embroidered-karchupi-panjabi','BDM-PNJ-004',NULL,'variable','Exquisitely hand-embroidered karchupi panjabi with zardozi and sequin detailing along the placket and cuffs. A heirloom-quality festive piece.

- Fabric: Viscose Silk
- Embellishment: Hand Karchupi + Zardozi
- Care: Dry clean only','Hand karchupi work with zardozi detailing — a statement festive piece.',5450,6800,3200,'BDT',12,5,1,'instock',NULL,NULL,'cmtzd3ju8000s670ticz3dmpy','cmtzd3kr40016670t1ibypigr','["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1603252109303-2751441e0052?auto=format&fit=crop&w=900&q=80"]','karchupi,panjabi,luxury','[{"name":"Fabric","values":["Viscose Silk"]},{"name":"Occasion","values":["Wedding, Eid"]},{"name":"Size","values":["M","L","XL"]},{"name":"Color","values":["Deep Maroon","Off White"]}]','[{"id":"m-deepmaroon","size":"M","color":"Deep Maroon","price":5450,"stock":2,"sku":"BDM-PNJ-004-M-DEEPMAROON"},{"id":"m-offwhite","size":"M","color":"Off White","price":5450,"stock":2,"sku":"BDM-PNJ-004-M-OFFWHITE"},{"id":"l-deepmaroon","size":"L","color":"Deep Maroon","price":5450,"stock":2,"sku":"BDM-PNJ-004-L-DEEPMAROON"},{"id":"l-offwhite","size":"L","color":"Off White","price":5450,"stock":2,"sku":"BDM-PNJ-004-L-OFFWHITE"},{"id":"xl-deepmaroon","size":"XL","color":"Deep Maroon","price":5450,"stock":2,"sku":"BDM-PNJ-004-XL-DEEPMAROON"},{"id":"xl-offwhite","size":"XL","color":"Off White","price":5450,"stock":2,"sku":"BDM-PNJ-004-XL-OFFWHITE"}]',1,0,1,'published',4.9,42,96,684,'Viscose Silk','Wedding, Eid',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Embroidered Karchupi Panjabi — Buy Online in Bangladesh | BD Market','Hand karchupi work with zardozi detailing — a statement festive piece.','karchupi,panjabi,luxury','https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:56.520','2026-09-14 11:01:41.363'),
('cmtzd3law001j670tort68duj','Jamdani Handloom Saree','জামদানি হ্যান্ডলুম শাড়ি','jamdani-handloom-saree','BDM-SAR-001',NULL,'variable','Genuine handwoven Jamdani saree crafted by master weavers of Narayanganj. The intricate discontinuous supplementary weft technique creates floating motifs that appear to hover over the fabric.

- Weave: Handloom Jamdani
- Origin: Narayanganj, Bangladesh
- Length: 12 haat with blouse piece
- Care: Dry clean only','Authentic handwoven Jamdani from Narayanganj weavers — a Bangladeshi heritage piece.',8500,12000,5200,'BDT',18,5,1,'instock',NULL,NULL,'cmtzd3j1t0005670tix9sh0ls','cmtzd3kd90010670tvq03ubqt','["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80"]','jamdani,saree,handloom,traditional,gi','[{"name":"Fabric","values":["Handloom Cotton Silk"]},{"name":"Occasion","values":["Wedding, Pohela Boishakh"]},{"name":"Color","values":["Red","Navy","Green","Peach"]}]',NULL,1,1,1,'published',4.9,214,512,3596,'Handloom Cotton Silk','Wedding, Pohela Boishakh',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Jamdani Handloom Saree — Buy Online in Bangladesh | BD Market','Authentic handwoven Jamdani from Narayanganj weavers — a Bangladeshi heritage piece.','jamdani,saree,handloom,traditional,gi','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:56.601','2026-09-14 11:01:41.572'),
('cmtzd3ld7001l670t815akf7k','Katan Silk Saree with Zari Border','কাতান সিল্ক শাড়ি','katan-silk-saree-with-zari-border','BDM-SAR-002',NULL,'variable','Woven in pure Katan silk with an opulent zari border and pallu. The crisp texture and rich drape make it a classic choice for weddings.

- Fabric: Pure Katan Silk
- Border: Real Zari
- Care: Dry clean only','Pure Katan silk with real zari border — a timeless wedding saree.',11200,15000,7000,'BDT',9,5,1,'instock',NULL,NULL,'cmtzd3j1t0005670tix9sh0ls','cmtzd3kof0015670twr14gt7s','["https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80"]','katan,silk,saree,wedding','[{"name":"Fabric","values":["Katan Silk"]},{"name":"Occasion","values":["Wedding, Reception"]},{"name":"Color","values":["Deep Red","Royal Blue","Bottle Green"]}]',NULL,1,0,1,'published',4.8,87,143,1011,'Katan Silk','Wedding, Reception',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Katan Silk Saree with Zari Border — Buy Online in Bangladesh | BD Market','Pure Katan silk with real zari border — a timeless wedding saree.','katan,silk,saree,wedding','https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:56.683','2026-09-15 08:32:58.763'),
('cmtzd3lg1001n670tsc5hxdzo','Soft Cotton Tant Saree','সফট কটন তাঁতের শাড়ি','soft-cotton-tant-saree','BDM-SAR-003',NULL,'variable','Classic Bengal tant saree in soft combed cotton. Lightweight, breathable and easy to maintain — a daily-wear essential for Bangladeshi women.','Breathable tant cotton saree — comfortable all day, easy to drape.',2350,3100,1350,'BDT',55,5,1,'instock',NULL,NULL,'cmtzd3j1t0005670tix9sh0ls','cmtzd3kfc0011670ti5rzbafy','["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80"]','tant,cotton,saree,daily','[{"name":"Fabric","values":["Pure Cotton Tant"]},{"name":"Occasion","values":["Daily, Office, Casual"]},{"name":"Color","values":["Sky Blue","Yellow","Pink","White"]}]',NULL,0,1,1,'published',4.6,178,624,4383,'Pure Cotton Tant','Daily, Office, Casual',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Soft Cotton Tant Saree — Buy Online in Bangladesh | BD Market','Breathable tant cotton saree — comfortable all day, easy to drape.','tant,cotton,saree,daily','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:56.785','2026-09-15 08:26:16.418'),
('cmtzd3lit001p670t8r6n0vor','Georgette Party Saree with Sequins','জর্জেট পার্টি শাড়ি','georgette-party-saree-with-sequins','BDM-SAR-004',NULL,'variable','A flowing georgette saree with scattered sequin embellishment and a scalloped border. Comes with unstitched blouse piece.','Flowy georgette saree with sequin work — made for evening parties.',4200,5500,2500,'BDT',31,5,1,'instock',NULL,NULL,'cmtzd3j1t0005670tix9sh0ls','cmtzd3klx0014670tq7karsgc','["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1583935064411-7f41c23b22b1?auto=format&fit=crop&w=900&q=80"]','georgette,party,saree,sequins','[{"name":"Fabric","values":["Georgette"]},{"name":"Occasion","values":["Party, Reception"]},{"name":"Color","values":["Wine","Black","Teal"]}]',NULL,0,0,1,'published',4.4,63,198,1397,'Georgette','Party, Reception',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Georgette Party Saree with Sequins — Buy Online in Bangladesh | BD Market','Flowy georgette saree with sequin work — made for evening parties.','georgette,party,saree,sequins','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:56.885','2026-09-14 11:01:41.302'),
('cmtzd3llj001r670tyjc45d40','Muslin Jamdani Bridal Saree','মসলিন জামদানি ব্রাইডাল শাড়ি','muslin-jamdani-bridal-saree','BDM-SAR-005',NULL,'variable','An extraordinary bridal piece woven from ultra-fine muslin yarn in the traditional Jamdani technique. Takes 45+ days on the loom. Limited production.

- Weave: Handloom Muslin Jamdani
- Weave time: 45+ days
- Care: Dry clean only, store in muslin cloth','Heirloom muslin Jamdani — the finest bridal weave of Bangladesh.',24500,32000,15000,'BDT',4,5,1,'instock',NULL,NULL,'cmtzd3j1t0005670tix9sh0ls','cmtzd3kd90010670tvq03ubqt','["https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1583935064411-7f41c23b22b1?auto=format&fit=crop&w=900&q=80"]','muslin,bridal,saree,luxury,wedding','[{"name":"Fabric","values":["Handwoven Muslin"]},{"name":"Occasion","values":["Bridal, Wedding"]},{"name":"Color","values":["Ivory","Gold"]}]',NULL,1,0,1,'published',5,29,41,299,'Handwoven Muslin','Bridal, Wedding',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Muslin Jamdani Bridal Saree — Buy Online in Bangladesh | BD Market','Heirloom muslin Jamdani — the finest bridal weave of Bangladesh.','muslin,bridal,saree,luxury,wedding','https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:56.983','2026-09-14 11:01:40.970'),
('cmtzd3lou001t670tfgbw1t72','Embroidered Cotton Kurti','এমব্রয়ডারি কটন কুর্তি','embroidered-cotton-kurti','BDM-KRT-001',NULL,'variable','A wardrobe staple — soft cotton kurti with intricate thread embroidery on the yoke and a comfortable straight cut. Pairs well with jeans, palazzo or leggings.','Soft cotton kurti with delicate thread embroidery on the yoke.',1450,1950,780,'BDT',88,5,1,'instock',NULL,NULL,'cmtzd3j4a0007670temwomp34','cmtzd3kfc0011670ti5rzbafy','["https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80"]','kurti,cotton,embroidered,daily','[{"name":"Fabric","values":["Cotton"]},{"name":"Occasion","values":["Daily, Office"]},{"name":"Size","values":["S","M","L","XL","XXL"]},{"name":"Color","values":["White","Mustard","Teal","Pink"]}]','[{"id":"s-white","size":"S","color":"White","price":1450,"stock":5,"sku":"BDM-KRT-001-S-WHITE"},{"id":"s-mustard","size":"S","color":"Mustard","price":1450,"stock":5,"sku":"BDM-KRT-001-S-MUSTARD"},{"id":"s-teal","size":"S","color":"Teal","price":1450,"stock":5,"sku":"BDM-KRT-001-S-TEAL"},{"id":"m-white","size":"M","color":"White","price":1450,"stock":5,"sku":"BDM-KRT-001-M-WHITE"},{"id":"m-mustard","size":"M","color":"Mustard","price":1450,"stock":5,"sku":"BDM-KRT-001-M-MUSTARD"},{"id":"m-teal","size":"M","color":"Teal","price":1450,"stock":5,"sku":"BDM-KRT-001-M-TEAL"},{"id":"l-white","size":"L","color":"White","price":1450,"stock":5,"sku":"BDM-KRT-001-L-WHITE"},{"id":"l-mustard","size":"L","color":"Mustard","price":1450,"stock":5,"sku":"BDM-KRT-001-L-MUSTARD"},{"id":"l-teal","size":"L","color":"Teal","price":1450,"stock":5,"sku":"BDM-KRT-001-L-TEAL"},{"id":"xl-white","size":"XL","color":"White","price":1450,"stock":5,"sku":"BDM-KRT-001-XL-WHITE"},{"id":"xl-mustard","size":"XL","color":"Mustard","price":1450,"stock":5,"sku":"BDM-KRT-001-XL-MUSTARD"},{"id":"xl-teal","size":"XL","color":"Teal","price":1450,"stock":5,"sku":"BDM-KRT-001-XL-TEAL"},{"id":"xxl-white","size":"XXL","color":"White","price":1450,"stock":5,"sku":"BDM-KRT-001-XXL-WHITE"},{"id":"xxl-mustard","size":"XXL","color":"Mustard","price":1450,"stock":5,"sku":"BDM-KRT-001-XXL-MUSTARD"},{"id":"xxl-teal","size":"XXL","color":"Teal","price":1450,"stock":5,"sku":"BDM-KRT-001-XXL-TEAL"}]',1,1,1,'published',4.7,231,874,6179,'Cotton','Daily, Office',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Embroidered Cotton Kurti — Buy Online in Bangladesh | BD Market','Soft cotton kurti with delicate thread embroidery on the yoke.','kurti,cotton,embroidered,daily','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.102','2026-09-15 08:26:16.390'),
('cmtzd3lrm001v670tsxghi3dg','Rayon Printed A-Line Kurti','রেয়ন প্রিন্টেড এ-লাইন কুর্তি','rayon-printed-a-line-kurti','BDM-KRT-002',NULL,'variable','Breathable rayon kurti in a flattering A-line silhouette with side pockets and vibrant hand-block prints. Machine washable.','Flowy A-line rayon kurti with vibrant block prints — all-day comfort.',1190,1590,650,'BDT',120,5,1,'instock',NULL,NULL,'cmtzd3j4a0007670temwomp34','cmtzd3khm0012670tsfj4s9ng','["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80"]','kurti,rayon,printed,alina','[{"name":"Fabric","values":["Rayon"]},{"name":"Occasion","values":["Casual, Daily"]},{"name":"Size","values":["S","M","L","XL","XXL","3XL"]},{"name":"Color","values":["Blue","Green","Maroon","Black"]}]','[{"id":"s-blue","size":"S","color":"Blue","price":1190,"stock":6,"sku":"BDM-KRT-002-S-BLUE"},{"id":"s-green","size":"S","color":"Green","price":1190,"stock":6,"sku":"BDM-KRT-002-S-GREEN"},{"id":"s-maroon","size":"S","color":"Maroon","price":1190,"stock":6,"sku":"BDM-KRT-002-S-MAROON"},{"id":"m-blue","size":"M","color":"Blue","price":1190,"stock":6,"sku":"BDM-KRT-002-M-BLUE"},{"id":"m-green","size":"M","color":"Green","price":1190,"stock":6,"sku":"BDM-KRT-002-M-GREEN"},{"id":"m-maroon","size":"M","color":"Maroon","price":1190,"stock":6,"sku":"BDM-KRT-002-M-MAROON"},{"id":"l-blue","size":"L","color":"Blue","price":1190,"stock":6,"sku":"BDM-KRT-002-L-BLUE"},{"id":"l-green","size":"L","color":"Green","price":1190,"stock":6,"sku":"BDM-KRT-002-L-GREEN"},{"id":"l-maroon","size":"L","color":"Maroon","price":1190,"stock":6,"sku":"BDM-KRT-002-L-MAROON"},{"id":"xl-blue","size":"XL","color":"Blue","price":1190,"stock":6,"sku":"BDM-KRT-002-XL-BLUE"},{"id":"xl-green","size":"XL","color":"Green","price":1190,"stock":6,"sku":"BDM-KRT-002-XL-GREEN"},{"id":"xl-maroon","size":"XL","color":"Maroon","price":1190,"stock":6,"sku":"BDM-KRT-002-XL-MAROON"},{"id":"xxl-blue","size":"XXL","color":"Blue","price":1190,"stock":6,"sku":"BDM-KRT-002-XXL-BLUE"},{"id":"xxl-green","size":"XXL","color":"Green","price":1190,"stock":6,"sku":"BDM-KRT-002-XXL-GREEN"},{"id":"xxl-maroon","size":"XXL","color":"Maroon","price":1190,"stock":6,"sku":"BDM-KRT-002-XXL-MAROON"},{"id":"3xl-blue","size":"3XL","color":"Blue","price":1190,"stock":6,"sku":"BDM-KRT-002-3XL-BLUE"},{"id":"3xl-green","size":"3XL","color":"Green","price":1190,"stock":6,"sku":"BDM-KRT-002-3XL-GREEN"},{"id":"3xl-maroon","size":"3XL","color":"Maroon","price":1190,"stock":6,"sku":"BDM-KRT-002-3XL-MAROON"}]',0,1,1,'published',4.5,187,1032,7244,'Rayon','Casual, Daily',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Rayon Printed A-Line Kurti — Buy Online in Bangladesh | BD Market','Flowy A-line rayon kurti with vibrant block prints — all-day comfort.','kurti,rayon,printed,alina','https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.202','2026-09-14 11:01:40.953'),
('cmtzd3lu3001x670ts52nh51k','Chikankari Kurti with Lace Detail','চিকনকারি কুর্তি','chikankari-kurti-with-lace-detail','BDM-KRT-003',NULL,'variable','Delicate chikankari embroidery covers the front panel, finished with crochet lace on the hem and sleeves. Elegant yet understated.','Fine chikankari hand embroidery with crochet lace trims.',2250,2900,1300,'BDT',42,5,1,'instock',NULL,NULL,'cmtzd3j4a0007670temwomp34','cmtzd3kr40016670t1ibypigr','["https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80"]','chikankari,kurti,embroidery','[{"name":"Fabric","values":["Cotton"]},{"name":"Occasion","values":["Office, Semi-formal"]},{"name":"Size","values":["S","M","L","XL"]},{"name":"Color","values":["White","Pastel Blue","Peach"]}]','[{"id":"s-white","size":"S","color":"White","price":2250,"stock":3,"sku":"BDM-KRT-003-S-WHITE"},{"id":"s-pastelblue","size":"S","color":"Pastel Blue","price":2250,"stock":3,"sku":"BDM-KRT-003-S-PASTELBLUE"},{"id":"s-peach","size":"S","color":"Peach","price":2250,"stock":3,"sku":"BDM-KRT-003-S-PEACH"},{"id":"m-white","size":"M","color":"White","price":2250,"stock":3,"sku":"BDM-KRT-003-M-WHITE"},{"id":"m-pastelblue","size":"M","color":"Pastel Blue","price":2250,"stock":3,"sku":"BDM-KRT-003-M-PASTELBLUE"},{"id":"m-peach","size":"M","color":"Peach","price":2250,"stock":3,"sku":"BDM-KRT-003-M-PEACH"},{"id":"l-white","size":"L","color":"White","price":2250,"stock":3,"sku":"BDM-KRT-003-L-WHITE"},{"id":"l-pastelblue","size":"L","color":"Pastel Blue","price":2250,"stock":3,"sku":"BDM-KRT-003-L-PASTELBLUE"},{"id":"l-peach","size":"L","color":"Peach","price":2250,"stock":3,"sku":"BDM-KRT-003-L-PEACH"},{"id":"xl-white","size":"XL","color":"White","price":2250,"stock":3,"sku":"BDM-KRT-003-XL-WHITE"},{"id":"xl-pastelblue","size":"XL","color":"Pastel Blue","price":2250,"stock":3,"sku":"BDM-KRT-003-XL-PASTELBLUE"},{"id":"xl-peach","size":"XL","color":"Peach","price":2250,"stock":3,"sku":"BDM-KRT-003-XL-PEACH"}]',0,0,1,'published',4.6,76,214,1509,'Cotton','Office, Semi-formal',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Chikankari Kurti with Lace Detail — Buy Online in Bangladesh | BD Market','Fine chikankari hand embroidery with crochet lace trims.','chikankari,kurti,embroidery','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.292','2026-09-15 08:32:58.632'),
('cmtzd3lwg001z670trh0kuxwa','Kurti with Palazzo Set','কুর্তি ও প্যালাজো সেট','kurti-with-palazzo-set','BDM-KRT-004',NULL,'variable','A coordinated two-piece set with a straight-cut kurti and matching flared palazzo. Made from a cotton-silk blend that drapes beautifully.','Coordinated kurti + palazzo set — ready to wear, zero styling effort.',2650,3400,1550,'BDT',36,5,1,'instock',NULL,NULL,'cmtzd3j8n000b670t083s1v97','cmtzd3kof0015670twr14gt7s','["https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80"]','kurti,palazzo,set,co-ord','[{"name":"Fabric","values":["Cotton Silk"]},{"name":"Occasion","values":["Office, Party"]},{"name":"Size","values":["S","M","L","XL"]},{"name":"Color","values":["Olive","Navy","Rust"]}]','[{"id":"s-olive","size":"S","color":"Olive","price":2650,"stock":3,"sku":"BDM-KRT-004-S-OLIVE"},{"id":"s-navy","size":"S","color":"Navy","price":2650,"stock":3,"sku":"BDM-KRT-004-S-NAVY"},{"id":"s-rust","size":"S","color":"Rust","price":2650,"stock":3,"sku":"BDM-KRT-004-S-RUST"},{"id":"m-olive","size":"M","color":"Olive","price":2650,"stock":3,"sku":"BDM-KRT-004-M-OLIVE"},{"id":"m-navy","size":"M","color":"Navy","price":2650,"stock":3,"sku":"BDM-KRT-004-M-NAVY"},{"id":"m-rust","size":"M","color":"Rust","price":2650,"stock":3,"sku":"BDM-KRT-004-M-RUST"},{"id":"l-olive","size":"L","color":"Olive","price":2650,"stock":3,"sku":"BDM-KRT-004-L-OLIVE"},{"id":"l-navy","size":"L","color":"Navy","price":2650,"stock":3,"sku":"BDM-KRT-004-L-NAVY"},{"id":"l-rust","size":"L","color":"Rust","price":2650,"stock":3,"sku":"BDM-KRT-004-L-RUST"},{"id":"xl-olive","size":"XL","color":"Olive","price":2650,"stock":3,"sku":"BDM-KRT-004-XL-OLIVE"},{"id":"xl-navy","size":"XL","color":"Navy","price":2650,"stock":3,"sku":"BDM-KRT-004-XL-NAVY"},{"id":"xl-rust","size":"XL","color":"Rust","price":2650,"stock":3,"sku":"BDM-KRT-004-XL-RUST"}]',1,0,1,'published',4.6,58,176,1244,'Cotton Silk','Office, Party',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Kurti with Palazzo Set — Buy Online in Bangladesh | BD Market','Coordinated kurti + palazzo set — ready to wear, zero styling effort.','kurti,palazzo,set,co-ord','https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.376','2026-09-15 08:26:16.414'),
('cmtzd3lyq0021670ta1u7gq2q','Unstitched Three Piece Salwar Kameez','আনস্টিচড থ্রি-পিস','unstitched-three-piece-salwar-kameez','BDM-TPS-001',NULL,'variable','Three-piece unstitched set containing printed kameez fabric (2.5 haat), salwar fabric (2.5 haat) and a matching dupatta. Print designed in-house.','Complete unstitched three-piece with kameez, salwar and dupatta.',3250,4200,1900,'BDT',44,5,1,'instock',NULL,NULL,'cmtzd3j6g0009670tgetxzsg4','cmtzd3kd90010670tvq03ubqt','["https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80"]','threepiece,salwar,unstitched','[{"name":"Fabric","values":["Cotton"]},{"name":"Occasion","values":["Festive, Daily"]},{"name":"Color","values":["Teal","Mustard","Purple"]}]',NULL,1,0,1,'published',4.7,142,388,2726,'Cotton','Festive, Daily',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Unstitched Three Piece Salwar Kameez — Buy Online in Bangladesh | BD Market','Complete unstitched three-piece with kameez, salwar and dupatta.','threepiece,salwar,unstitched','https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.458','2026-09-14 11:01:40.977'),
('cmtzd3m0v0023670ttak6l1t1','Embroidered Georgette Three Piece','এমব্রয়ডারি জর্জেট থ্রি-পিস','embroidered-georgette-three-piece','BDM-TPS-002',NULL,'variable','Georgette kameez with dense thread and sequin embroidery, paired with santoon salwar and a net dupatta with sequin border.','Heavily embroidered georgette three-piece with net dupatta.',4890,6200,2900,'BDT',27,5,1,'instock',NULL,NULL,'cmtzd3j6g0009670tgetxzsg4','cmtzd3kw10018670th1z6k1sj','["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80"]','georgette,threepiece,embroidered','[{"name":"Fabric","values":["Georgette"]},{"name":"Occasion","values":["Party, Reception"]},{"name":"Color","values":["Wine","Emerald","Powder Blue"]}]',NULL,0,1,1,'published',4.8,91,246,1732,'Georgette','Party, Reception',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Embroidered Georgette Three Piece — Buy Online in Bangladesh | BD Market','Heavily embroidered georgette three-piece with net dupatta.','georgette,threepiece,embroidered','https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.536','2026-09-14 11:01:40.967'),
('cmtzd3m340025670t7na9u0fl','Cotton Salwar Kameez Stitched Set','কটন সালোয়ার কামিজ সেট','cotton-salwar-kameez-stitched-set','BDM-SLK-001',NULL,'variable','Pre-stitched salwar kameez in breathable cotton. Features a straight kameez with side slits, elasticated salwar and printed dupatta.','Ready-to-wear cotton salwar kameez — comfortable and practical.',2790,3600,1600,'BDT',51,5,1,'instock',NULL,NULL,'cmtzd3j8n000b670t083s1v97','cmtzd3khm0012670tsfj4s9ng','["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80"]','salwar,kameez,stitched,cotton','[{"name":"Fabric","values":["Cotton"]},{"name":"Occasion","values":["Daily, Office"]},{"name":"Size","values":["S","M","L","XL","XXL"]},{"name":"Color","values":["Blue","Green","White"]}]','[{"id":"s-blue","size":"S","color":"Blue","price":2790,"stock":3,"sku":"BDM-SLK-001-S-BLUE"},{"id":"s-green","size":"S","color":"Green","price":2790,"stock":3,"sku":"BDM-SLK-001-S-GREEN"},{"id":"s-white","size":"S","color":"White","price":2790,"stock":3,"sku":"BDM-SLK-001-S-WHITE"},{"id":"m-blue","size":"M","color":"Blue","price":2790,"stock":3,"sku":"BDM-SLK-001-M-BLUE"},{"id":"m-green","size":"M","color":"Green","price":2790,"stock":3,"sku":"BDM-SLK-001-M-GREEN"},{"id":"m-white","size":"M","color":"White","price":2790,"stock":3,"sku":"BDM-SLK-001-M-WHITE"},{"id":"l-blue","size":"L","color":"Blue","price":2790,"stock":3,"sku":"BDM-SLK-001-L-BLUE"},{"id":"l-green","size":"L","color":"Green","price":2790,"stock":3,"sku":"BDM-SLK-001-L-GREEN"},{"id":"l-white","size":"L","color":"White","price":2790,"stock":3,"sku":"BDM-SLK-001-L-WHITE"},{"id":"xl-blue","size":"XL","color":"Blue","price":2790,"stock":3,"sku":"BDM-SLK-001-XL-BLUE"},{"id":"xl-green","size":"XL","color":"Green","price":2790,"stock":3,"sku":"BDM-SLK-001-XL-GREEN"},{"id":"xl-white","size":"XL","color":"White","price":2790,"stock":3,"sku":"BDM-SLK-001-XL-WHITE"},{"id":"xxl-blue","size":"XXL","color":"Blue","price":2790,"stock":3,"sku":"BDM-SLK-001-XXL-BLUE"},{"id":"xxl-green","size":"XXL","color":"Green","price":2790,"stock":3,"sku":"BDM-SLK-001-XXL-GREEN"},{"id":"xxl-white","size":"XXL","color":"White","price":2790,"stock":3,"sku":"BDM-SLK-001-XXL-WHITE"}]',0,0,1,'published',4.4,67,189,1333,'Cotton','Daily, Office',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Cotton Salwar Kameez Stitched Set — Buy Online in Bangladesh | BD Market','Ready-to-wear cotton salwar kameez — comfortable and practical.','salwar,kameez,stitched,cotton','https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.617','2026-09-15 08:26:18.645'),
('cmtzd3m5g0027670teeybs10z','Designer Party Lehenga Choli','ডিজাইনার লেহেঙ্গা চোলি','designer-party-lehenga-choli','BDM-LHG-001',NULL,'variable','A dramatic flared lehenga with heavy embroidery on the choli and a soft net dupatta with sequin work. Comes semi-stitched for a tailored fit.','Flared lehenga with embroidered choli and net dupatta.',8900,12500,5400,'BDT',11,5,1,'instock',NULL,NULL,'cmtzd3jc7000d670tytl3rknt','cmtzd3klx0014670tq7karsgc','["https://images.unsplash.com/photo-1583935064411-7f41c23b22b1?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80"]','lehenga,choli,party,wedding','[{"name":"Fabric","values":["Velvet & Net"]},{"name":"Occasion","values":["Wedding, Party"]},{"name":"Size","values":["S","M","L","XL"]},{"name":"Color","values":["Red","Royal Blue","Gold"]}]','[{"id":"s-red","size":"S","color":"Red","price":8900,"stock":1,"sku":"BDM-LHG-001-S-RED"},{"id":"s-royalblue","size":"S","color":"Royal Blue","price":8900,"stock":1,"sku":"BDM-LHG-001-S-ROYALBLUE"},{"id":"s-gold","size":"S","color":"Gold","price":8900,"stock":1,"sku":"BDM-LHG-001-S-GOLD"},{"id":"m-red","size":"M","color":"Red","price":8900,"stock":1,"sku":"BDM-LHG-001-M-RED"},{"id":"m-royalblue","size":"M","color":"Royal Blue","price":8900,"stock":1,"sku":"BDM-LHG-001-M-ROYALBLUE"},{"id":"m-gold","size":"M","color":"Gold","price":8900,"stock":1,"sku":"BDM-LHG-001-M-GOLD"},{"id":"l-red","size":"L","color":"Red","price":8900,"stock":1,"sku":"BDM-LHG-001-L-RED"},{"id":"l-royalblue","size":"L","color":"Royal Blue","price":8900,"stock":1,"sku":"BDM-LHG-001-L-ROYALBLUE"},{"id":"l-gold","size":"L","color":"Gold","price":8900,"stock":1,"sku":"BDM-LHG-001-L-GOLD"},{"id":"xl-red","size":"XL","color":"Red","price":8900,"stock":1,"sku":"BDM-LHG-001-XL-RED"},{"id":"xl-royalblue","size":"XL","color":"Royal Blue","price":8900,"stock":1,"sku":"BDM-LHG-001-XL-ROYALBLUE"},{"id":"xl-gold","size":"XL","color":"Gold","price":8900,"stock":1,"sku":"BDM-LHG-001-XL-GOLD"}]',1,0,1,'published',4.7,38,84,599,'Velvet & Net','Wedding, Party',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Designer Party Lehenga Choli — Buy Online in Bangladesh | BD Market','Flared lehenga with embroidered choli and net dupatta.','lehenga,choli,party,wedding','https://images.unsplash.com/photo-1583935064411-7f41c23b22b1?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.700','2026-09-14 11:01:41.141'),
('cmtzd3m800029670tdizomf8j','Premium Georgette Hijab','প্রিমিয়াম জর্জেট হিজাব','premium-georgette-hijab','BDM-HJB-001',NULL,'variable','Premium georgette hijab with a matte finish, non-slip texture and generous size (180cm x 75cm). Colour-fast and machine washable.','Non-slip georgette hijab — soft, opaque and easy to style.',690,950,350,'BDT',210,5,1,'instock',NULL,NULL,'cmtzd3jex000f670twngf4zdu','cmtzd3kyl0019670t33570m2l','["https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=80"]','hijab,georgette,modest','[{"name":"Fabric","values":["Georgette"]},{"name":"Occasion","values":["Daily"]},{"name":"Color","values":["Black","Navy","Beige","Maroon","Emerald"]}]',NULL,1,1,1,'published',4.8,312,1450,10164,'Georgette','Daily',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Premium Georgette Hijab — Buy Online in Bangladesh | BD Market','Non-slip georgette hijab — soft, opaque and easy to style.','hijab,georgette,modest','https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.792','2026-09-15 08:32:59.278'),
('cmtzd3mad002b670ttfgxw74m','Embroidered Nida Abaya','এমব্রয়ডারি নিদা আবায়া','embroidered-nida-abaya','BDM-ABY-001',NULL,'variable','A graceful nida abaya with a relaxed A-line cut, concealed front zip and tonal thread embroidery at the sleeve cuffs. Includes matching scarf.','Flowing nida abaya with tonal embroidery at the cuffs.',3450,4600,2000,'BDT',33,5,1,'instock',NULL,NULL,'cmtzd3jex000f670twngf4zdu','cmtzd3kw10018670th1z6k1sj','["https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80"]','abaya,nida,modest,burqa','[{"name":"Fabric","values":["Nida"]},{"name":"Occasion","values":["Daily, Office"]},{"name":"Size","values":["S","M","L","XL"]},{"name":"Color","values":["Black","Brown","Grey"]}]','[{"id":"s-black","size":"S","color":"Black","price":3450,"stock":2,"sku":"BDM-ABY-001-S-BLACK"},{"id":"s-brown","size":"S","color":"Brown","price":3450,"stock":2,"sku":"BDM-ABY-001-S-BROWN"},{"id":"s-grey","size":"S","color":"Grey","price":3450,"stock":2,"sku":"BDM-ABY-001-S-GREY"},{"id":"m-black","size":"M","color":"Black","price":3450,"stock":2,"sku":"BDM-ABY-001-M-BLACK"},{"id":"m-brown","size":"M","color":"Brown","price":3450,"stock":2,"sku":"BDM-ABY-001-M-BROWN"},{"id":"m-grey","size":"M","color":"Grey","price":3450,"stock":2,"sku":"BDM-ABY-001-M-GREY"},{"id":"l-black","size":"L","color":"Black","price":3450,"stock":2,"sku":"BDM-ABY-001-L-BLACK"},{"id":"l-brown","size":"L","color":"Brown","price":3450,"stock":2,"sku":"BDM-ABY-001-L-BROWN"},{"id":"l-grey","size":"L","color":"Grey","price":3450,"stock":2,"sku":"BDM-ABY-001-L-GREY"},{"id":"xl-black","size":"XL","color":"Black","price":3450,"stock":2,"sku":"BDM-ABY-001-XL-BLACK"},{"id":"xl-brown","size":"XL","color":"Brown","price":3450,"stock":2,"sku":"BDM-ABY-001-XL-BROWN"},{"id":"xl-grey","size":"XL","color":"Grey","price":3450,"stock":2,"sku":"BDM-ABY-001-XL-GREY"}]',1,0,1,'published',4.7,74,212,1510,'Nida','Daily, Office',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Embroidered Nida Abaya — Buy Online in Bangladesh | BD Market','Flowing nida abaya with tonal embroidery at the cuffs.','abaya,nida,modest,burqa','https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.877','2026-09-14 11:01:41.648'),
('cmtzd3mcp002d670tnx7jb2z5','Oxford Formal Shirt','অক্সফোর্ড ফরমাল শার্ট','oxford-formal-shirt','BDM-SHT-001',NULL,'variable','Woven from durable oxford cotton with a semi-cutaway collar, single cuff and mother-of-pearl buttons. Wrinkle-resistant finish.','Crisp oxford cotton shirt with a structured collar — office-ready.',1790,2400,980,'BDT',76,5,1,'instock',NULL,NULL,'cmtzd3jnr000m670tuvrgct4c','cmtzd3ktc0017670tpi3cbnry','["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80"]','shirt,formal,oxford,office','[{"name":"Fabric","values":["Oxford Cotton"]},{"name":"Occasion","values":["Office, Formal"]},{"name":"Size","values":["S","M","L","XL","XXL"]},{"name":"Color","values":["White","Sky","Grey","Navy"]}]','[{"id":"s-white","size":"S","color":"White","price":1790,"stock":5,"sku":"BDM-SHT-001-S-WHITE"},{"id":"s-sky","size":"S","color":"Sky","price":1790,"stock":5,"sku":"BDM-SHT-001-S-SKY"},{"id":"s-grey","size":"S","color":"Grey","price":1790,"stock":5,"sku":"BDM-SHT-001-S-GREY"},{"id":"m-white","size":"M","color":"White","price":1790,"stock":5,"sku":"BDM-SHT-001-M-WHITE"},{"id":"m-sky","size":"M","color":"Sky","price":1790,"stock":5,"sku":"BDM-SHT-001-M-SKY"},{"id":"m-grey","size":"M","color":"Grey","price":1790,"stock":5,"sku":"BDM-SHT-001-M-GREY"},{"id":"l-white","size":"L","color":"White","price":1790,"stock":5,"sku":"BDM-SHT-001-L-WHITE"},{"id":"l-sky","size":"L","color":"Sky","price":1790,"stock":5,"sku":"BDM-SHT-001-L-SKY"},{"id":"l-grey","size":"L","color":"Grey","price":1790,"stock":5,"sku":"BDM-SHT-001-L-GREY"},{"id":"xl-white","size":"XL","color":"White","price":1790,"stock":5,"sku":"BDM-SHT-001-XL-WHITE"},{"id":"xl-sky","size":"XL","color":"Sky","price":1790,"stock":5,"sku":"BDM-SHT-001-XL-SKY"},{"id":"xl-grey","size":"XL","color":"Grey","price":1790,"stock":5,"sku":"BDM-SHT-001-XL-GREY"},{"id":"xxl-white","size":"XXL","color":"White","price":1790,"stock":5,"sku":"BDM-SHT-001-XXL-WHITE"},{"id":"xxl-sky","size":"XXL","color":"Sky","price":1790,"stock":5,"sku":"BDM-SHT-001-XXL-SKY"},{"id":"xxl-grey","size":"XXL","color":"Grey","price":1790,"stock":5,"sku":"BDM-SHT-001-XXL-GREY"}]',1,1,1,'published',4.6,156,512,3596,'Oxford Cotton','Office, Formal',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Oxford Formal Shirt — Buy Online in Bangladesh | BD Market','Crisp oxford cotton shirt with a structured collar — office-ready.','shirt,formal,oxford,office','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:57.961','2026-09-15 08:26:19.315'),
('cmtzd3mfx002f670t9k8mkw28','Slim Fit Stretch Chino Pant','স্লিম ফিট চিনো প্যান্ট','slim-fit-stretch-chino-pant','BDM-PNT-001',NULL,'variable','Cotton twill chino with 2% elastane for all-day comfort. Features a clean slim leg, slant pockets and a hidden coin pocket.','Stretch chino with a clean slim leg — comfort meets polish.',2190,2900,1250,'BDT',64,5,1,'instock',NULL,NULL,'cmtzd3js5000q670t7j5l9jzp','cmtzd3kfc0011670ti5rzbafy','["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80"]','pant,chino,slimfit,trouser','[{"name":"Fabric","values":["Cotton Twill with Stretch"]},{"name":"Occasion","values":["Casual, Office"]},{"name":"Size","values":["30","32","34","36","38"]},{"name":"Color","values":["Khaki","Navy","Black","Olive"]}]','[{"id":"30-khaki","size":"30","color":"Khaki","price":2190,"stock":4,"sku":"BDM-PNT-001-30-KHAKI"},{"id":"30-navy","size":"30","color":"Navy","price":2190,"stock":4,"sku":"BDM-PNT-001-30-NAVY"},{"id":"30-black","size":"30","color":"Black","price":2190,"stock":4,"sku":"BDM-PNT-001-30-BLACK"},{"id":"32-khaki","size":"32","color":"Khaki","price":2190,"stock":4,"sku":"BDM-PNT-001-32-KHAKI"},{"id":"32-navy","size":"32","color":"Navy","price":2190,"stock":4,"sku":"BDM-PNT-001-32-NAVY"},{"id":"32-black","size":"32","color":"Black","price":2190,"stock":4,"sku":"BDM-PNT-001-32-BLACK"},{"id":"34-khaki","size":"34","color":"Khaki","price":2190,"stock":4,"sku":"BDM-PNT-001-34-KHAKI"},{"id":"34-navy","size":"34","color":"Navy","price":2190,"stock":4,"sku":"BDM-PNT-001-34-NAVY"},{"id":"34-black","size":"34","color":"Black","price":2190,"stock":4,"sku":"BDM-PNT-001-34-BLACK"},{"id":"36-khaki","size":"36","color":"Khaki","price":2190,"stock":4,"sku":"BDM-PNT-001-36-KHAKI"},{"id":"36-navy","size":"36","color":"Navy","price":2190,"stock":4,"sku":"BDM-PNT-001-36-NAVY"},{"id":"36-black","size":"36","color":"Black","price":2190,"stock":4,"sku":"BDM-PNT-001-36-BLACK"},{"id":"38-khaki","size":"38","color":"Khaki","price":2190,"stock":4,"sku":"BDM-PNT-001-38-KHAKI"},{"id":"38-navy","size":"38","color":"Navy","price":2190,"stock":4,"sku":"BDM-PNT-001-38-NAVY"},{"id":"38-black","size":"38","color":"Black","price":2190,"stock":4,"sku":"BDM-PNT-001-38-BLACK"}]',0,0,0,'published',4.5,98,341,2395,'Cotton Twill with Stretch','Casual, Office',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Slim Fit Stretch Chino Pant — Buy Online in Bangladesh | BD Market','Stretch chino with a clean slim leg — comfort meets polish.','pant,chino,slimfit,trouser','https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.077','2026-09-14 11:01:41.858'),
('cmtzd3mij002h670tsmdd3kjw','Pique Cotton Polo Shirt','পিকে কটন পোলো শার্ট','pique-cotton-polo-shirt','BDM-PLO-001',NULL,'variable','Breathable pique cotton polo with a ribbed collar, two-button placket and side vents. Holds shape wash after wash.','Classic pique polo with ribbed collar and cuffs.',1250,1750,680,'BDT',145,5,1,'instock',NULL,NULL,'cmtzd3jpx000o670t05zyjeax','cmtzd3khm0012670tsfj4s9ng','["https://images.unsplash.com/photo-1586790170083-2f7cead4c9d3?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"]','polo,pique,casual','[{"name":"Fabric","values":["Pique Cotton"]},{"name":"Occasion","values":["Casual"]},{"name":"Size","values":["S","M","L","XL","XXL"]},{"name":"Color","values":["White","Black","Maroon","Forest"]}]','[{"id":"s-white","size":"S","color":"White","price":1250,"stock":9,"sku":"BDM-PLO-001-S-WHITE"},{"id":"s-black","size":"S","color":"Black","price":1250,"stock":9,"sku":"BDM-PLO-001-S-BLACK"},{"id":"s-maroon","size":"S","color":"Maroon","price":1250,"stock":9,"sku":"BDM-PLO-001-S-MAROON"},{"id":"m-white","size":"M","color":"White","price":1250,"stock":9,"sku":"BDM-PLO-001-M-WHITE"},{"id":"m-black","size":"M","color":"Black","price":1250,"stock":9,"sku":"BDM-PLO-001-M-BLACK"},{"id":"m-maroon","size":"M","color":"Maroon","price":1250,"stock":9,"sku":"BDM-PLO-001-M-MAROON"},{"id":"l-white","size":"L","color":"White","price":1250,"stock":9,"sku":"BDM-PLO-001-L-WHITE"},{"id":"l-black","size":"L","color":"Black","price":1250,"stock":9,"sku":"BDM-PLO-001-L-BLACK"},{"id":"l-maroon","size":"L","color":"Maroon","price":1250,"stock":9,"sku":"BDM-PLO-001-L-MAROON"},{"id":"xl-white","size":"XL","color":"White","price":1250,"stock":9,"sku":"BDM-PLO-001-XL-WHITE"},{"id":"xl-black","size":"XL","color":"Black","price":1250,"stock":9,"sku":"BDM-PLO-001-XL-BLACK"},{"id":"xl-maroon","size":"XL","color":"Maroon","price":1250,"stock":9,"sku":"BDM-PLO-001-XL-MAROON"},{"id":"xxl-white","size":"XXL","color":"White","price":1250,"stock":9,"sku":"BDM-PLO-001-XXL-WHITE"},{"id":"xxl-black","size":"XXL","color":"Black","price":1250,"stock":9,"sku":"BDM-PLO-001-XXL-BLACK"},{"id":"xxl-maroon","size":"XXL","color":"Maroon","price":1250,"stock":9,"sku":"BDM-PLO-001-XXL-MAROON"}]',0,1,0,'published',4.5,203,786,5508,'Pique Cotton','Casual',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Pique Cotton Polo Shirt — Buy Online in Bangladesh | BD Market','Classic pique polo with ribbed collar and cuffs.','polo,pique,casual','https://images.unsplash.com/photo-1586790170083-2f7cead4c9d3?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.171','2026-09-14 10:41:39.201'),
('cmtzd3mlg002j670t2tc85xfz','Graphic Print Cotton T-Shirt','গ্রাফিক প্রিন্ট টি-শার্ট','graphic-print-cotton-t-shirt','BDM-TSH-001',NULL,'variable','180 GSM combed cotton t-shirt with a soft water-based graphic print that will not crack or peel. Pre-shrunk for a consistent fit.','Soft combed cotton tee with a water-based print.',790,1150,400,'BDT',220,5,1,'instock',NULL,NULL,'cmtzd3jpx000o670t05zyjeax','cmtzd3kyl0019670t33570m2l','["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1586790170083-2f7cead4c9d3?auto=format&fit=crop&w=900&q=80"]','tshirt,graphic,cotton,casual','[{"name":"Fabric","values":["Combed Cotton"]},{"name":"Occasion","values":["Casual"]},{"name":"Size","values":["S","M","L","XL","XXL"]},{"name":"Color","values":["White","Navy","Charcoal"]}]','[{"id":"s-white","size":"S","color":"White","price":790,"stock":14,"sku":"BDM-TSH-001-S-WHITE"},{"id":"s-navy","size":"S","color":"Navy","price":790,"stock":14,"sku":"BDM-TSH-001-S-NAVY"},{"id":"s-charcoal","size":"S","color":"Charcoal","price":790,"stock":14,"sku":"BDM-TSH-001-S-CHARCOAL"},{"id":"m-white","size":"M","color":"White","price":790,"stock":14,"sku":"BDM-TSH-001-M-WHITE"},{"id":"m-navy","size":"M","color":"Navy","price":790,"stock":14,"sku":"BDM-TSH-001-M-NAVY"},{"id":"m-charcoal","size":"M","color":"Charcoal","price":790,"stock":14,"sku":"BDM-TSH-001-M-CHARCOAL"},{"id":"l-white","size":"L","color":"White","price":790,"stock":14,"sku":"BDM-TSH-001-L-WHITE"},{"id":"l-navy","size":"L","color":"Navy","price":790,"stock":14,"sku":"BDM-TSH-001-L-NAVY"},{"id":"l-charcoal","size":"L","color":"Charcoal","price":790,"stock":14,"sku":"BDM-TSH-001-L-CHARCOAL"},{"id":"xl-white","size":"XL","color":"White","price":790,"stock":14,"sku":"BDM-TSH-001-XL-WHITE"},{"id":"xl-navy","size":"XL","color":"Navy","price":790,"stock":14,"sku":"BDM-TSH-001-XL-NAVY"},{"id":"xl-charcoal","size":"XL","color":"Charcoal","price":790,"stock":14,"sku":"BDM-TSH-001-XL-CHARCOAL"},{"id":"xxl-white","size":"XXL","color":"White","price":790,"stock":14,"sku":"BDM-TSH-001-XXL-WHITE"},{"id":"xxl-navy","size":"XXL","color":"Navy","price":790,"stock":14,"sku":"BDM-TSH-001-XXL-NAVY"},{"id":"xxl-charcoal","size":"XXL","color":"Charcoal","price":790,"stock":14,"sku":"BDM-TSH-001-XXL-CHARCOAL"}]',0,1,0,'published',4.4,289,1240,8684,'Combed Cotton','Casual',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Graphic Print Cotton T-Shirt — Buy Online in Bangladesh | BD Market','Soft combed cotton tee with a water-based print.','tshirt,graphic,cotton,casual','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.276','2026-09-14 10:22:16.169'),
('cmtzd3mno002l670t52bsxzo0','Kids Festive Panjabi Set','শিশুদের ফেস্টিভ পাঞ্জাবি সেট','kids-festive-panjabi-set','BDM-KID-001',NULL,'variable','Kids festive panjabi with matching pyjama. Made from soft, skin-friendly cotton with smooth seams and easy buttons for quick dressing.','Adorable festive panjabi set for boys — soft cotton, easy to wear.',1490,2000,850,'BDT',58,5,1,'instock',NULL,NULL,'cmtzd3jwm000t670tn0n8ofo3','cmtzd3kjq0013670tg0wt2yo8','["https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80"]','kids,panjabi,eid,children','[{"name":"Fabric","values":["Cotton"]},{"name":"Occasion","values":["Eid, Festive"]},{"name":"Size","values":["2-3Y","4-5Y","6-7Y","8-9Y","10-11Y"]},{"name":"Color","values":["White","Cream","Sky"]}]','[{"id":"2-3y-white","size":"2-3Y","color":"White","price":1490,"stock":3,"sku":"BDM-KID-001-2-3Y-WHITE"},{"id":"2-3y-cream","size":"2-3Y","color":"Cream","price":1490,"stock":3,"sku":"BDM-KID-001-2-3Y-CREAM"},{"id":"2-3y-sky","size":"2-3Y","color":"Sky","price":1490,"stock":3,"sku":"BDM-KID-001-2-3Y-SKY"},{"id":"4-5y-white","size":"4-5Y","color":"White","price":1490,"stock":3,"sku":"BDM-KID-001-4-5Y-WHITE"},{"id":"4-5y-cream","size":"4-5Y","color":"Cream","price":1490,"stock":3,"sku":"BDM-KID-001-4-5Y-CREAM"},{"id":"4-5y-sky","size":"4-5Y","color":"Sky","price":1490,"stock":3,"sku":"BDM-KID-001-4-5Y-SKY"},{"id":"6-7y-white","size":"6-7Y","color":"White","price":1490,"stock":3,"sku":"BDM-KID-001-6-7Y-WHITE"},{"id":"6-7y-cream","size":"6-7Y","color":"Cream","price":1490,"stock":3,"sku":"BDM-KID-001-6-7Y-CREAM"},{"id":"6-7y-sky","size":"6-7Y","color":"Sky","price":1490,"stock":3,"sku":"BDM-KID-001-6-7Y-SKY"},{"id":"8-9y-white","size":"8-9Y","color":"White","price":1490,"stock":3,"sku":"BDM-KID-001-8-9Y-WHITE"},{"id":"8-9y-cream","size":"8-9Y","color":"Cream","price":1490,"stock":3,"sku":"BDM-KID-001-8-9Y-CREAM"},{"id":"8-9y-sky","size":"8-9Y","color":"Sky","price":1490,"stock":3,"sku":"BDM-KID-001-8-9Y-SKY"},{"id":"10-11y-white","size":"10-11Y","color":"White","price":1490,"stock":3,"sku":"BDM-KID-001-10-11Y-WHITE"},{"id":"10-11y-cream","size":"10-11Y","color":"Cream","price":1490,"stock":3,"sku":"BDM-KID-001-10-11Y-CREAM"},{"id":"10-11y-sky","size":"10-11Y","color":"Sky","price":1490,"stock":3,"sku":"BDM-KID-001-10-11Y-SKY"}]',1,0,0,'published',4.7,84,267,1877,'Cotton','Eid, Festive',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Kids Festive Panjabi Set — Buy Online in Bangladesh | BD Market','Adorable festive panjabi set for boys — soft cotton, easy to wear.','kids,panjabi,eid,children','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.356','2026-09-14 11:01:41.762'),
('cmtzd3mpv002n670t7mkr3c5h','Girls Party Frock','মেয়েদের পার্টি ফ্রক','girls-party-frock','BDM-KID-002',NULL,'variable','A twirl-worthy party frock with a satin bodice, layered net skirt and a statement bow at the waist. Fully lined for comfort.','Layered satin-net frock with bow detail — party ready.',1890,2500,1100,'BDT',47,5,1,'instock',NULL,NULL,'cmtzd3jwm000t670tn0n8ofo3','cmtzd3kfc0011670ti5rzbafy','["https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=80"]','kids,frock,girls,party','[{"name":"Fabric","values":["Satin & Net"]},{"name":"Occasion","values":["Party, Birthday"]},{"name":"Size","values":["2-3Y","4-5Y","6-7Y","8-9Y"]},{"name":"Color","values":["Pink","Peach","Lavender"]}]','[{"id":"2-3y-pink","size":"2-3Y","color":"Pink","price":1890,"stock":3,"sku":"BDM-KID-002-2-3Y-PINK"},{"id":"2-3y-peach","size":"2-3Y","color":"Peach","price":1890,"stock":3,"sku":"BDM-KID-002-2-3Y-PEACH"},{"id":"2-3y-lavender","size":"2-3Y","color":"Lavender","price":1890,"stock":3,"sku":"BDM-KID-002-2-3Y-LAVENDER"},{"id":"4-5y-pink","size":"4-5Y","color":"Pink","price":1890,"stock":3,"sku":"BDM-KID-002-4-5Y-PINK"},{"id":"4-5y-peach","size":"4-5Y","color":"Peach","price":1890,"stock":3,"sku":"BDM-KID-002-4-5Y-PEACH"},{"id":"4-5y-lavender","size":"4-5Y","color":"Lavender","price":1890,"stock":3,"sku":"BDM-KID-002-4-5Y-LAVENDER"},{"id":"6-7y-pink","size":"6-7Y","color":"Pink","price":1890,"stock":3,"sku":"BDM-KID-002-6-7Y-PINK"},{"id":"6-7y-peach","size":"6-7Y","color":"Peach","price":1890,"stock":3,"sku":"BDM-KID-002-6-7Y-PEACH"},{"id":"6-7y-lavender","size":"6-7Y","color":"Lavender","price":1890,"stock":3,"sku":"BDM-KID-002-6-7Y-LAVENDER"},{"id":"8-9y-pink","size":"8-9Y","color":"Pink","price":1890,"stock":3,"sku":"BDM-KID-002-8-9Y-PINK"},{"id":"8-9y-peach","size":"8-9Y","color":"Peach","price":1890,"stock":3,"sku":"BDM-KID-002-8-9Y-PEACH"},{"id":"8-9y-lavender","size":"8-9Y","color":"Lavender","price":1890,"stock":3,"sku":"BDM-KID-002-8-9Y-LAVENDER"}]',0,0,0,'published',4.6,61,189,1331,'Satin & Net','Party, Birthday',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Girls Party Frock — Buy Online in Bangladesh | BD Market','Layered satin-net frock with bow detail — party ready.','kids,frock,girls,party','https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.435','2026-09-15 08:32:59.597'),
('cmtzd3ms4002p670t85hnc4kt','Handcrafted Leather Handbag','হাতে তৈরি লেদার হ্যান্ডব্যাগ','handcrafted-leather-handbag','BDM-BAG-001',NULL,'variable','Hand-stitched from vegetable-tanned cowhide leather by artisans in Bhairab. Features a lined interior, zip pocket and adjustable shoulder strap. Develops a rich patina over time.','Vegetable-tanned leather handbag made by Bangladeshi artisans.',3890,5200,2200,'BDT',22,5,1,'instock',NULL,NULL,'cmtzd3jyu000u670t6s7kw5jj','cmtzd3kw10018670th1z6k1sj','["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80"]','bag,leather,handbag,handcrafted','[{"name":"Fabric","values":["Genuine Leather"]},{"name":"Occasion","values":["Daily, Office"]},{"name":"Color","values":["Tan","Black","Brown"]}]',NULL,1,0,0,'published',4.7,73,156,1096,'Genuine Leather','Daily, Office',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Handcrafted Leather Handbag — Buy Online in Bangladesh | BD Market','Vegetable-tanned leather handbag made by Bangladeshi artisans.','bag,leather,handbag,handcrafted','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.516','2026-09-14 10:41:39.185'),
('cmtzd3muc002r670t37u2ars5','Jute Tote Bag with Print','পাটের টোট ব্যাগ','jute-tote-bag-with-print','BDM-BAG-002',NULL,'variable','Made from 100% natural Bangladeshi jute with reinforced handles and a laminated inner lining. A sustainable alternative to plastic bags.','Eco-friendly Bangladeshi jute tote — sturdy, reusable, sustainable.',890,1250,450,'BDT',165,5,1,'instock',NULL,NULL,'cmtzd3jyu000u670t6s7kw5jj','cmtzd3kof0015670twr14gt7s','["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80"]','jute,bag,eco,handmade,bangladesh','[{"name":"Fabric","values":["100% Jute"]},{"name":"Occasion","values":["Daily, Eco"]},{"name":"Color","values":["Natural","Printed"]}]',NULL,0,0,0,'published',4.5,118,542,3798,'100% Jute','Daily, Eco',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Jute Tote Bag with Print — Buy Online in Bangladesh | BD Market','Eco-friendly Bangladeshi jute tote — sturdy, reusable, sustainable.','jute,bag,eco,handmade,bangladesh','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.596','2026-09-14 11:01:41.896'),
('cmtzd3mwl002t670tp2repw85','Traditional Gold Plated Jewellery Set','ঐতিহ্যবাহী গোল্ড প্লেটেড গহনা সেট','traditional-gold-plated-jewellery-set','BDM-JWL-001',NULL,'variable','Traditional bridal-inspired jewellery set including choker necklace, matching jhumar earrings, tikka and a pair of bangles. Anti-tarnish gold plating over brass.','Complete gold-plated set — necklace, earrings, tikka and bangles.',3450,4800,1900,'BDT',38,5,1,'instock',NULL,NULL,'cmtzd3k0z000v670t9rfjy8wr','cmtzd3kr40016670t1ibypigr','["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80"]','jewellery,set,goldplated,bridal','[{"name":"Fabric","values":["Brass with Gold Plating"]},{"name":"Occasion","values":["Wedding, Festive"]},{"name":"Color","values":["Gold","Rose Gold"]}]',NULL,1,1,0,'published',4.8,164,428,3008,'Brass with Gold Plating','Wedding, Festive',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Traditional Gold Plated Jewellery Set — Buy Online in Bangladesh | BD Market','Complete gold-plated set — necklace, earrings, tikka and bangles.','jewellery,set,goldplated,bridal','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.677','2026-09-14 11:01:41.888'),
('cmtzd3myw002v670tsowutewt','Kundan Choker Necklace','কুন্দন চোকার নেকলেস','kundan-choker-necklace','BDM-JWL-002',NULL,'variable','A statement kundan choker featuring uncut stones, pearl drops and detailed meenakari enamel work on the reverse side.','Kundan choker with pearl drops and meenakari work on the reverse.',2250,3100,1250,'BDT',44,5,1,'instock',NULL,NULL,'cmtzd3k0z000v670t9rfjy8wr','cmtzd3klx0014670tq7karsgc','["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80"]','kundan,choker,necklace','[{"name":"Occasion","values":["Party, Wedding"]},{"name":"Color","values":["Gold-White","Gold-Green","Gold-Red"]}]',NULL,0,0,0,'published',4.6,87,231,1624,NULL,'Party, Wedding',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Kundan Choker Necklace — Buy Online in Bangladesh | BD Market','Kundan choker with pearl drops and meenakari work on the reverse.','kundan,choker,necklace','https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.760','2026-09-15 08:26:17.981'),
('cmtzd3n1k002x670t8nfv2vsu','Analog Leather Strap Watch','অ্যানালগ লেদার স্ট্র্যাপ ঘড়ি','analog-leather-strap-watch','BDM-WCH-001',NULL,'variable','Slim 40mm stainless steel case with a mineral crystal, Japanese quartz movement and a genuine leather strap. 3ATM water resistant.','Minimal analog watch with a genuine leather strap — 3ATM water resistant.',4290,6200,2600,'BDT',26,5,1,'instock',NULL,NULL,'cmtzd3k3n000w670t97gv7klr','cmtzd3klx0014670tq7karsgc','["https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80"]','watch,leather,analog,men','[{"name":"Occasion","values":["Formal, Daily"]},{"name":"Color","values":["Brown","Black"]}]',NULL,1,0,0,'published',4.6,94,187,1314,NULL,'Formal, Daily',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Analog Leather Strap Watch — Buy Online in Bangladesh | BD Market','Minimal analog watch with a genuine leather strap — 3ATM water resistant.','watch,leather,analog,men','https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.856','2026-09-14 11:01:41.763'),
('cmtzd3n3s002z670t90on4rf3','Smart Fitness Band','স্মার্ট ফিটনেস ব্যান্ড','smart-fitness-band','BDM-WCH-002',NULL,'variable','1.47" colour display fitness band tracking heart rate, SpO2, sleep and 60+ sport modes. IP68 water resistant with 10-day battery life.','Colour display fitness band with heart rate and SpO2 tracking.',2890,4500,1700,'BDT',71,5,1,'instock',NULL,NULL,'cmtzd3k3n000w670t97gv7klr','cmtzd3kyl0019670t33570m2l','["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80"]','smartwatch,band,fitness','[{"name":"Occasion","values":["Sports, Daily"]},{"name":"Color","values":["Black","Blue","Pink"]}]',NULL,0,1,0,'published',4.3,142,492,3461,NULL,'Sports, Daily',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Smart Fitness Band — Buy Online in Bangladesh | BD Market','Colour display fitness band with heart rate and SpO2 tracking.','smartwatch,band,fitness','https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:58.936','2026-09-14 11:01:42.037'),
('cmtzd3n620031670tzj80ttqg','Leather Formal Oxford Shoes','লেদার ফরমাল অক্সফোর্ড জুতা','leather-formal-oxford-shoes','BDM-SHO-001',NULL,'variable','Classic leather oxford with a stitched leather sole, cushioned memory-foam insole and a burnished toe. Locally crafted by Bangladeshi shoemakers.','Genuine leather oxford with cushioned insole — made in Bangladesh.',3990,5400,2300,'BDT',34,5,1,'instock',NULL,NULL,'cmtzd3k6g000x670tryp1mpct','cmtzd3ktc0017670tpi3cbnry','["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80"]','shoes,leather,formal,oxford','[{"name":"Occasion","values":["Formal, Office"]},{"name":"Size","values":["39","40","41","42","43","44"]},{"name":"Color","values":["Black","Brown"]}]','[{"id":"39-black","size":"39","color":"Black","price":3990,"stock":2,"sku":"BDM-SHO-001-39-BLACK"},{"id":"39-brown","size":"39","color":"Brown","price":3990,"stock":2,"sku":"BDM-SHO-001-39-BROWN"},{"id":"40-black","size":"40","color":"Black","price":3990,"stock":2,"sku":"BDM-SHO-001-40-BLACK"},{"id":"40-brown","size":"40","color":"Brown","price":3990,"stock":2,"sku":"BDM-SHO-001-40-BROWN"},{"id":"41-black","size":"41","color":"Black","price":3990,"stock":2,"sku":"BDM-SHO-001-41-BLACK"},{"id":"41-brown","size":"41","color":"Brown","price":3990,"stock":2,"sku":"BDM-SHO-001-41-BROWN"},{"id":"42-black","size":"42","color":"Black","price":3990,"stock":2,"sku":"BDM-SHO-001-42-BLACK"},{"id":"42-brown","size":"42","color":"Brown","price":3990,"stock":2,"sku":"BDM-SHO-001-42-BROWN"},{"id":"43-black","size":"43","color":"Black","price":3990,"stock":2,"sku":"BDM-SHO-001-43-BLACK"},{"id":"43-brown","size":"43","color":"Brown","price":3990,"stock":2,"sku":"BDM-SHO-001-43-BROWN"},{"id":"44-black","size":"44","color":"Black","price":3990,"stock":2,"sku":"BDM-SHO-001-44-BLACK"},{"id":"44-brown","size":"44","color":"Brown","price":3990,"stock":2,"sku":"BDM-SHO-001-44-BROWN"}]',1,0,0,'published',4.7,106,243,1711,NULL,'Formal, Office',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Leather Formal Oxford Shoes — Buy Online in Bangladesh | BD Market','Genuine leather oxford with cushioned insole — made in Bangladesh.','shoes,leather,formal,oxford','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:59.019','2026-09-15 08:26:20.204'),
('cmtzd3n9c0033670tkxsevxh3','Running Sports Sneakers','রানিং স্পোর্টস স্নিকার্স','running-sports-sneakers','BDM-SHO-002',NULL,'variable','Breathable knit-mesh upper with a moulded EVA midsole for impact absorption. Non-slip rubber outsole and padded ankle collar.','Lightweight mesh sneakers with a shock-absorbing sole.',2650,3800,1500,'BDT',88,5,1,'instock',NULL,NULL,'cmtzd3k6g000x670tryp1mpct','cmtzd3kyl0019670t33570m2l','["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80"]','shoes,sneakers,running,sports','[{"name":"Occasion","values":["Sports, Casual"]},{"name":"Size","values":["38","39","40","41","42","43","44"]},{"name":"Color","values":["Black","White","Grey"]}]','[{"id":"38-black","size":"38","color":"Black","price":2650,"stock":4,"sku":"BDM-SHO-002-38-BLACK"},{"id":"38-white","size":"38","color":"White","price":2650,"stock":4,"sku":"BDM-SHO-002-38-WHITE"},{"id":"38-grey","size":"38","color":"Grey","price":2650,"stock":4,"sku":"BDM-SHO-002-38-GREY"},{"id":"39-black","size":"39","color":"Black","price":2650,"stock":4,"sku":"BDM-SHO-002-39-BLACK"},{"id":"39-white","size":"39","color":"White","price":2650,"stock":4,"sku":"BDM-SHO-002-39-WHITE"},{"id":"39-grey","size":"39","color":"Grey","price":2650,"stock":4,"sku":"BDM-SHO-002-39-GREY"},{"id":"40-black","size":"40","color":"Black","price":2650,"stock":4,"sku":"BDM-SHO-002-40-BLACK"},{"id":"40-white","size":"40","color":"White","price":2650,"stock":4,"sku":"BDM-SHO-002-40-WHITE"},{"id":"40-grey","size":"40","color":"Grey","price":2650,"stock":4,"sku":"BDM-SHO-002-40-GREY"},{"id":"41-black","size":"41","color":"Black","price":2650,"stock":4,"sku":"BDM-SHO-002-41-BLACK"},{"id":"41-white","size":"41","color":"White","price":2650,"stock":4,"sku":"BDM-SHO-002-41-WHITE"},{"id":"41-grey","size":"41","color":"Grey","price":2650,"stock":4,"sku":"BDM-SHO-002-41-GREY"},{"id":"42-black","size":"42","color":"Black","price":2650,"stock":4,"sku":"BDM-SHO-002-42-BLACK"},{"id":"42-white","size":"42","color":"White","price":2650,"stock":4,"sku":"BDM-SHO-002-42-WHITE"},{"id":"42-grey","size":"42","color":"Grey","price":2650,"stock":4,"sku":"BDM-SHO-002-42-GREY"},{"id":"43-black","size":"43","color":"Black","price":2650,"stock":4,"sku":"BDM-SHO-002-43-BLACK"},{"id":"43-white","size":"43","color":"White","price":2650,"stock":4,"sku":"BDM-SHO-002-43-WHITE"},{"id":"43-grey","size":"43","color":"Grey","price":2650,"stock":4,"sku":"BDM-SHO-002-43-GREY"},{"id":"44-black","size":"44","color":"Black","price":2650,"stock":4,"sku":"BDM-SHO-002-44-BLACK"},{"id":"44-white","size":"44","color":"White","price":2650,"stock":4,"sku":"BDM-SHO-002-44-WHITE"},{"id":"44-grey","size":"44","color":"Grey","price":2650,"stock":4,"sku":"BDM-SHO-002-44-GREY"}]',0,1,0,'published',4.5,178,541,3796,NULL,'Sports, Casual',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Running Sports Sneakers — Buy Online in Bangladesh | BD Market','Lightweight mesh sneakers with a shock-absorbing sole.','shoes,sneakers,running,sports','https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:59.136','2026-09-15 08:33:00.338'),
('cmtzd3nc00035670tnwbyj7xo','Attar Oil Perfume — 12ml','আতর পারফিউম ১২ মিলি','attar-oil-perfume-12ml','BDM-PRF-001',NULL,'variable','Traditional alcohol-free attar oil in a 12ml roll-on bottle. Concentrated formula gives 8–10 hours of wear. Available in Oud, Musk and Rose.','Alcohol-free concentrated attar oil — long-lasting, halal friendly.',1250,1800,680,'BDT',132,5,1,'instock',NULL,NULL,'cmtzd3k8w000y670toz3wgaka','cmtzd3kof0015670twr14gt7s','["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80"]','attar,perfume,fragrance,alcoholfree','[{"name":"Occasion","values":["Daily, Gift"]},{"name":"Color","values":["Oud","Musk","Rose"]}]',NULL,1,0,0,'published',4.7,187,612,4298,NULL,'Daily, Gift',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Attar Oil Perfume — 12ml — Buy Online in Bangladesh | BD Market','Alcohol-free concentrated attar oil — long-lasting, halal friendly.','attar,perfume,fragrance,alcoholfree','https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:59.232','2026-09-14 10:41:39.450'),
('cmtzd3nej0037670tlwzfpv64','Herbal Skincare Gift Set','হারবাল স্কিনকেয়ার গিফট সেট','herbal-skincare-gift-set','BDM-BTY-001',NULL,'simple','A four-piece herbal skincare set: neem face wash, turmeric brightening mask, aloe moisturiser and rose water toner. Paraben and sulphate free.','Neem, turmeric and aloe-based skincare set — 100% herbal.',1890,2600,1000,'BDT',64,5,1,'instock',NULL,NULL,'cmtzd3k8w000y670toz3wgaka','cmtzd3kd90010670tvq03ubqt','["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80"]','skincare,herbal,giftset,organic','[{"name":"Occasion","values":["Gift, Daily"]}]',NULL,0,0,0,'published',4.6,92,218,1532,NULL,'Gift, Daily',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Herbal Skincare Gift Set — Buy Online in Bangladesh | BD Market','Neem, turmeric and aloe-based skincare set — 100% herbal.','skincare,herbal,giftset,organic','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:59.323','2026-09-15 08:33:00.151'),
('cmtzd3ngp0039670tmmf0ehk7','Handloom Cotton Bed Cover Set','হ্যান্ডলুম কটন বেড কভার সেট','handloom-cotton-bed-cover-set','BDM-HOM-001',NULL,'variable','Handwoven on traditional Bangladeshi looms. Includes one double bed cover (220x240cm) and two pillow covers. Colour-fast and machine washable.','Handwoven cotton bed cover with 2 pillow covers — breathable and durable.',3290,4500,1850,'BDT',41,5,1,'instock',NULL,NULL,'cmtzd3kb5000z670ttg6zrnff','cmtzd3kof0015670twr14gt7s','["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80"]','bedcover,home,handloom,cotton','[{"name":"Fabric","values":["Handloom Cotton"]},{"name":"Occasion","values":["Home"]},{"name":"Size","values":["Single","Double","King"]},{"name":"Color","values":["Teal","Grey","Rust"]}]','[{"id":"single-teal","size":"Single","color":"Teal","price":3290,"stock":4,"sku":"BDM-HOM-001-SINGLE-TEAL"},{"id":"single-grey","size":"Single","color":"Grey","price":3290,"stock":4,"sku":"BDM-HOM-001-SINGLE-GREY"},{"id":"single-rust","size":"Single","color":"Rust","price":3290,"stock":4,"sku":"BDM-HOM-001-SINGLE-RUST"},{"id":"double-teal","size":"Double","color":"Teal","price":3290,"stock":4,"sku":"BDM-HOM-001-DOUBLE-TEAL"},{"id":"double-grey","size":"Double","color":"Grey","price":3290,"stock":4,"sku":"BDM-HOM-001-DOUBLE-GREY"},{"id":"double-rust","size":"Double","color":"Rust","price":3290,"stock":4,"sku":"BDM-HOM-001-DOUBLE-RUST"},{"id":"king-teal","size":"King","color":"Teal","price":3290,"stock":4,"sku":"BDM-HOM-001-KING-TEAL"},{"id":"king-grey","size":"King","color":"Grey","price":3290,"stock":4,"sku":"BDM-HOM-001-KING-GREY"},{"id":"king-rust","size":"King","color":"Rust","price":3290,"stock":4,"sku":"BDM-HOM-001-KING-RUST"}]',1,0,0,'published',4.6,78,194,1363,'Handloom Cotton','Home',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Handloom Cotton Bed Cover Set — Buy Online in Bangladesh | BD Market','Handwoven cotton bed cover with 2 pillow covers — breathable and durable.','bedcover,home,handloom,cotton','https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:59.401','2026-09-14 11:01:41.887'),
('cmtzd3nj0003b670tim99eopc','Nakshi Kantha Cushion Cover Set','নকশি কাঁথা কুশন কভার','nakshi-kantha-cushion-cover-set','BDM-HOM-002',NULL,'variable','Set of four cushion covers featuring authentic Nakshi Kantha running stitch embroidery, hand-stitched by women artisans in Jamalpur. 45x45cm.','Set of 4 Nakshi Kantha cushion covers — traditional Bangladeshi craft.',1490,2100,800,'BDT',73,5,1,'instock',NULL,NULL,'cmtzd3kb5000z670ttg6zrnff','cmtzd3kd90010670tvq03ubqt','["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80"]','nakshikantha,cushion,handmade,home','[{"name":"Fabric","values":["Cotton with Kantha Stitch"]},{"name":"Occasion","values":["Home, Gift"]},{"name":"Color","values":["Multi","Red","Blue"]}]',NULL,0,0,0,'published',4.8,94,287,2021,'Cotton with Kantha Stitch','Home, Gift',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Nakshi Kantha Cushion Cover Set — Buy Online in Bangladesh | BD Market','Set of 4 Nakshi Kantha cushion covers — traditional Bangladeshi craft.','nakshikantha,cushion,handmade,home','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:59.484','2026-09-15 08:32:59.813'),
('cmtzd3nla003d670tga0dmkyi','Terracotta Tea Set','টেরাকোটা চা সেট','terracotta-tea-set','BDM-HOM-003',NULL,'variable','Traditional Bangladeshi terracotta tea set, wheel-thrown and kiln-fired by artisans. Includes 6 cups, 6 saucers and a teapot. Food-safe natural finish.','Handmade terracotta tea set — 6 cups with saucers and a teapot.',990,1400,520,'BDT',96,5,1,'instock',NULL,NULL,'cmtzd3kb5000z670ttg6zrnff','cmtzd3kof0015670twr14gt7s','["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80"]','terracotta,teaset,clay,craft','[{"name":"Fabric","values":["Terracotta Clay"]},{"name":"Occasion","values":["Home, Gift"]},{"name":"Color","values":["Natural Terracotta"]}]',NULL,0,0,0,'published',4.5,64,231,1623,'Terracotta Clay','Home, Gift',NULL,'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.','Bangladesh','Terracotta Tea Set — Buy Online in Bangladesh | BD Market','Handmade terracotta tea set — 6 cups with saucers and a teapot.','terracotta,teaset,clay,craft','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',NULL,'2026-09-13 05:16:59.566','2026-09-14 11:01:41.882');

-- Review: 113 rows
INSERT INTO `Review` (`id`, `productId`, `customerId`, `authorName`, `authorEmail`, `rating`, `title`, `body`, `status`, `verified`, `helpful`, `createdAt`) VALUES
('cmtzd3pbp007s670tenva442e','cmtzd3l1g001b670tz87dxc3t','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer00@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','pending',1,0,'2026-09-13 05:17:01.811'),
('cmtzd3pep007u670tqg7n45vt','cmtzd3l1g001b670tz87dxc3t','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer01@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,7,'2026-09-11 05:17:01.921'),
('cmtzd3ph5007w670tqrdripdm','cmtzd3l3z001d670txrzkac9g','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer10@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,3,'2026-09-07 05:17:02.009'),
('cmtzd3pjm007y670t9lfmbno9','cmtzd3l3z001d670txrzkac9g','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer11@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,10,'2026-09-05 05:17:02.097'),
('cmtzd3pmd0080670th6e6cuo5','cmtzd3l3z001d670txrzkac9g','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer12@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,17,'2026-09-03 05:17:02.196'),
('cmtzd3pp70082670texw65zz8','cmtzd3l6d001f670tp6nhorg9','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer20@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,6,'2026-09-01 05:17:02.297'),
('cmtzd3prj0084670tcuf1r5gw','cmtzd3l6d001f670tp6nhorg9','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer21@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,13,'2026-08-30 05:17:02.382'),
('cmtzd3pto0086670tgk3dp5ff','cmtzd3l6d001f670tp6nhorg9','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer22@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,20,'2026-08-28 05:17:02.459'),
('cmtzd3pvw0088670tjuh9wkaa','cmtzd3l6d001f670tp6nhorg9','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer23@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,3,'2026-08-26 05:17:02.539'),
('cmtzd3py3008a670tkd66gorh','cmtzd3l8o001h670tcbernipe','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer30@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,9,'2026-08-26 05:17:02.618'),
('cmtzd3q09008c670t5ohxolb8','cmtzd3l8o001h670tcbernipe','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer31@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,16,'2026-08-24 05:17:02.697'),
('cmtzd3q2f008e670tg9mk3q8j','cmtzd3law001j670tort68duj','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer40@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,12,'2026-08-20 05:17:02.775'),
('cmtzd3q4o008g670thiiog0g3','cmtzd3law001j670tort68duj','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer41@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,19,'2026-08-18 05:17:02.855'),
('cmtzd3q7c008i670tnjighlfq','cmtzd3law001j670tort68duj','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer42@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,2,'2026-08-16 05:17:02.951'),
('cmtzd3q9l008k670t2laefxft','cmtzd3ld7001l670t815akf7k','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer50@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,15,'2026-08-14 05:17:03.032'),
('cmtzd3qbt008m670te4mlu07y','cmtzd3ld7001l670t815akf7k','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer51@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,22,'2026-08-12 05:17:03.112'),
('cmtzd3qex008o670tl497wbs9','cmtzd3ld7001l670t815akf7k','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer52@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','pending',1,5,'2026-08-10 05:17:03.225'),
('cmtzd3qho008q670tczv5aq4u','cmtzd3ld7001l670t815akf7k','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer53@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,12,'2026-08-08 05:17:03.323'),
('cmtzd3qjx008s670ty0tx4bkx','cmtzd3lg1001n670tsc5hxdzo','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer60@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,18,'2026-08-08 05:17:03.404'),
('cmtzd3qlz008u670t0syssp4s','cmtzd3lg1001n670tsc5hxdzo','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer61@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','pending',1,1,'2026-08-06 05:17:03.479'),
('cmtzd3qo2008w670t86uh1nc5','cmtzd3lit001p670t8r6n0vor','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer70@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','pending',1,21,'2026-08-02 05:17:03.553'),
('cmtzd3qq1008y670thag0wph0','cmtzd3lit001p670t8r6n0vor','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer71@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,4,'2026-07-31 05:17:03.624'),
('cmtzd3qs60090670tlg6lunni','cmtzd3lit001p670t8r6n0vor','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer72@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,11,'2026-07-29 05:17:03.701'),
('cmtzd3qu80092670tqo85dp3m','cmtzd3llj001r670tyjc45d40','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer80@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,0,'2026-07-27 05:17:03.776'),
('cmtzd3qw80094670tombj0c1v','cmtzd3llj001r670tyjc45d40','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer81@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,7,'2026-07-25 05:17:03.847'),
('cmtzd3qyo0096670tpba2eo2g','cmtzd3llj001r670tyjc45d40','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer82@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,14,'2026-07-23 05:17:03.935'),
('cmtzd3r0t0098670tfp7z3ufu','cmtzd3llj001r670tyjc45d40','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer83@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,21,'2026-07-21 05:17:04.012'),
('cmtzd3r2u009a670to4opyr7l','cmtzd3lou001t670tfgbw1t72','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer90@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,3,'2026-07-21 05:17:04.085'),
('cmtzd3r5e009c670t2yxwqeq3','cmtzd3lou001t670tfgbw1t72','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer91@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,10,'2026-07-19 05:17:04.177'),
('cmtzd3r83009e670tilry254m','cmtzd3lrm001v670tsxghi3dg','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer100@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,6,'2026-07-15 05:17:04.274'),
('cmtzd3rae009g670tdc0qt8ek','cmtzd3lrm001v670tsxghi3dg','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer101@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,13,'2026-07-13 05:17:04.357'),
('cmtzd3rce009i670tv6nbb1fa','cmtzd3lrm001v670tsxghi3dg','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer102@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,20,'2026-07-11 05:17:04.429'),
('cmtzd3red009k670tf3gl31ed','cmtzd3lu3001x670ts52nh51k','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer110@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,9,'2026-07-09 05:17:04.500'),
('cmtzd3rhf009m670tkybueafv','cmtzd3lu3001x670ts52nh51k','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer111@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,16,'2026-07-07 05:17:04.610'),
('cmtzd3rjc009o670t3cmojymy','cmtzd3lu3001x670ts52nh51k','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer112@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,23,'2026-07-05 05:17:04.679'),
('cmtzd3rlc009q670tdbppb2it','cmtzd3lu3001x670ts52nh51k','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer113@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','pending',1,6,'2026-07-03 05:17:04.750'),
('cmtzd3rna009s670tez38qt75','cmtzd3lwg001z670trh0kuxwa','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer120@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,12,'2026-07-03 05:17:04.821'),
('cmtzd3rpe009u670tbol8hytv','cmtzd3lwg001z670trh0kuxwa','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer121@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,19,'2026-07-01 05:17:04.897'),
('cmtzd3rrf009w670tu1wygyj2','cmtzd3lyq0021670ta1u7gq2q','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer130@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,15,'2026-06-27 05:17:04.970'),
('cmtzd3rti009y670tcc5519dh','cmtzd3lyq0021670ta1u7gq2q','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer131@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','pending',1,22,'2026-06-25 05:17:05.046'),
('cmtzd3rvl00a0670t4rirx73k','cmtzd3lyq0021670ta1u7gq2q','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer132@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,5,'2026-06-23 05:17:05.121'),
('cmtzd3rxm00a2670twestxtu0','cmtzd3m0v0023670ttak6l1t1','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer140@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','pending',1,18,'2026-06-21 05:17:05.193'),
('cmtzd3rzq00a4670ts8k3rk2c','cmtzd3m0v0023670ttak6l1t1','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer141@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,1,'2026-06-19 05:17:05.269'),
('cmtzd3s1s00a6670t2qwm6mkw','cmtzd3m0v0023670ttak6l1t1','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer142@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,8,'2026-06-17 05:17:05.344'),
('cmtzd3s3x00a8670t7p0tahzb','cmtzd3m0v0023670ttak6l1t1','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer143@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,15,'2026-06-15 05:17:05.421'),
('cmtzd3s6100aa670tgyk1j9br','cmtzd3m340025670t7na9u0fl','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer150@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,21,'2026-06-15 05:17:05.497'),
('cmtzd3s8600ac670thmrdklsz','cmtzd3m340025670t7na9u0fl','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer151@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,4,'2026-06-13 05:17:05.573'),
('cmtzd3sa800ae670tmousguba','cmtzd3m5g0027670teeybs10z','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer160@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,0,'2026-06-09 05:17:05.647'),
('cmtzd3sc900ag670tmsuz2wod','cmtzd3m5g0027670teeybs10z','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer161@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,7,'2026-06-07 05:17:05.720'),
('cmtzd3sef00ai670t69dwpc41','cmtzd3m5g0027670teeybs10z','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer162@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,14,'2026-06-05 05:17:05.798'),
('cmtzd3sgf00ak670tl2u7eysl','cmtzd3m800029670tdizomf8j','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer170@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,3,'2026-06-03 05:17:05.871'),
('cmtzd3sij00am670tjet816a3','cmtzd3m800029670tdizomf8j','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer171@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,10,'2026-06-01 05:17:05.946'),
('cmtzd3skj00ao670t7hv1hvrn','cmtzd3m800029670tdizomf8j','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer172@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,17,'2026-05-30 05:17:06.018'),
('cmtzd3smn00aq670tz4pn37kn','cmtzd3m800029670tdizomf8j','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer173@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,0,'2026-05-28 05:17:06.094'),
('cmtzd3som00as670tgncx6gpa','cmtzd3mad002b670ttfgxw74m','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer180@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,6,'2026-05-28 05:17:06.166'),
('cmtzd3sqp00au670tmi0dpadb','cmtzd3mad002b670ttfgxw74m','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer181@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,13,'2026-05-26 05:17:06.240'),
('cmtzd3ssz00aw670tae832xgb','cmtzd3mcp002d670tnx7jb2z5','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer190@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,9,'2026-05-22 05:17:06.322'),
('cmtzd3sv200ay670thwnc1k5g','cmtzd3mcp002d670tnx7jb2z5','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer191@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,16,'2026-05-20 05:17:06.397'),
('cmtzd3sxm00b0670tjsatf0q0','cmtzd3mcp002d670tnx7jb2z5','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer192@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','pending',1,23,'2026-05-18 05:17:06.489'),
('cmtzd3szs00b2670t2gp4340t','cmtzd3mfx002f670t9k8mkw28','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer200@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,12,'2026-05-16 05:17:06.568'),
('cmtzd3t2100b4670tm6mz6gur','cmtzd3mfx002f670t9k8mkw28','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer201@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','pending',1,19,'2026-05-14 05:17:06.648'),
('cmtzd3t5y00b6670tg4s8raxo','cmtzd3mfx002f670t9k8mkw28','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer202@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,2,'2026-05-12 05:17:06.788'),
('cmtzd3t9100b8670ti8opgh5u','cmtzd3mfx002f670t9k8mkw28','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer203@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,9,'2026-05-10 05:17:06.900'),
('cmtzd3tbr00ba670tmln4e03h','cmtzd3mij002h670tsmdd3kjw','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer210@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','pending',1,15,'2026-05-10 05:17:06.999'),
('cmtzd3tdz00bc670tah03q9n7','cmtzd3mij002h670tsmdd3kjw','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer211@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,22,'2026-05-08 05:17:07.079'),
('cmtzd3tg900be670t8ntnkgqp','cmtzd3mlg002j670t2tc85xfz','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer220@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,18,'2026-05-04 05:17:07.160'),
('cmtzd3tih00bg670tc610ubd2','cmtzd3mlg002j670t2tc85xfz','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer221@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,1,'2026-05-02 05:17:07.240'),
('cmtzd3tko00bi670t2fvos8os','cmtzd3mlg002j670t2tc85xfz','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer222@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,8,'2026-04-30 05:17:07.319'),
('cmtzd3tmt00bk670tnuv88eii','cmtzd3mno002l670t52bsxzo0','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer230@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,21,'2026-04-28 05:17:07.396'),
('cmtzd3tp700bm670t5ns1s2v8','cmtzd3mno002l670t52bsxzo0','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer231@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,4,'2026-04-26 05:17:07.482'),
('cmtzd3trj00bo670te6irac1y','cmtzd3mno002l670t52bsxzo0','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer232@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,11,'2026-04-24 05:17:07.567'),
('cmtzd3tts00bq670tnoc19gfp','cmtzd3mno002l670t52bsxzo0','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer233@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,18,'2026-04-22 05:17:07.647'),
('cmtzd3tvy00bs670tyif2l84t','cmtzd3mpv002n670t7mkr3c5h','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer240@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,0,'2026-04-22 05:17:07.725'),
('cmtzd3tzh00bu670t2ib6se1j','cmtzd3mpv002n670t7mkr3c5h','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer241@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,7,'2026-04-20 05:17:07.852'),
('cmtzd3u2700bw670t2d51r7v7','cmtzd3ms4002p670t85hnc4kt','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer250@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,3,'2026-04-16 05:17:07.950'),
('cmtzd3u4i00by670tf02k46aa','cmtzd3ms4002p670t85hnc4kt','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer251@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,10,'2026-04-14 05:17:08.033'),
('cmtzd3u6k00c0670tcohfbxqn','cmtzd3ms4002p670t85hnc4kt','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer252@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,17,'2026-04-12 05:17:08.108'),
('cmtzd3u8q00c2670t4ks718cj','cmtzd3muc002r670t37u2ars5','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer260@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,6,'2026-04-10 05:17:08.186'),
('cmtzd3uaz00c4670t880epvxy','cmtzd3muc002r670t37u2ars5','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer261@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,13,'2026-04-08 05:17:08.267'),
('cmtzd3ud900c6670t895s1jph','cmtzd3muc002r670t37u2ars5','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer262@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','pending',1,20,'2026-04-06 05:17:08.348'),
('cmtzd3ufe00c8670tuzj53bde','cmtzd3muc002r670t37u2ars5','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer263@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,3,'2026-04-04 05:17:08.425'),
('cmtzd3uhz00ca670thjkk4uhs','cmtzd3mwl002t670tp2repw85','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer270@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','approved',1,9,'2026-04-04 05:17:08.519'),
('cmtzd3uk900cc670tq46640wn','cmtzd3mwl002t670tp2repw85','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer271@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','pending',1,16,'2026-04-02 05:17:08.600'),
('cmtzd3umh00ce670tupksm5yr','cmtzd3myw002v670tsowutewt','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer280@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','pending',1,12,'2026-03-29 05:17:08.680'),
('cmtzd3uoy00cg670tosbci23r','cmtzd3myw002v670tsowutewt','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer281@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,19,'2026-03-27 05:17:08.769'),
('cmtzd3urr00ci670tdie8zopi','cmtzd3myw002v670tsowutewt','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer282@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,2,'2026-03-25 05:17:08.870'),
('cmtzd3uud00ck670ts30vj68y','cmtzd3n1k002x670t8nfv2vsu','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer290@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,15,'2026-03-23 05:17:08.964'),
('cmtzd3uws00cm670tflwvgrvf','cmtzd3n1k002x670t8nfv2vsu','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer291@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,22,'2026-03-21 05:17:09.051'),
('cmtzd3uyw00co670tv2dtbwrm','cmtzd3n1k002x670t8nfv2vsu','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer292@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,5,'2026-03-19 05:17:09.127'),
('cmtzd3v1400cq670tir6chyaj','cmtzd3n1k002x670t8nfv2vsu','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer293@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,12,'2026-03-17 05:17:09.207'),
('cmtzd3v3e00cs670ts75s9pok','cmtzd3n3s002z670t90on4rf3','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer300@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,18,'2026-03-17 05:17:09.289'),
('cmtzd3v5m00cu670tf8qmhk7e','cmtzd3n3s002z670t90on4rf3','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer301@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,1,'2026-03-15 05:17:09.369'),
('cmtzd3v7u00cw670tyskdgodj','cmtzd3n620031670tzj80ttqg','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer310@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,21,'2026-03-11 05:17:09.449'),
('cmtzd3va500cy670tvxmy9dhd','cmtzd3n620031670tzj80ttqg','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer311@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,4,'2026-03-09 05:17:09.532'),
('cmtzd3vcm00d0670tszk7p2ls','cmtzd3n620031670tzj80ttqg','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer312@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,11,'2026-03-07 05:17:09.621'),
('cmtzd3veu00d2670tir0qgpav','cmtzd3n9c0033670tkxsevxh3','cmtzd3npr003g670tlz8dxy4n','Rahim A.','reviewer320@example.com',5,'Exactly as described','The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!','approved',1,0,'2026-03-05 05:17:09.701'),
('cmtzd3vh200d4670tpyio66v2','cmtzd3n9c0033670tkxsevxh3','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer321@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,7,'2026-03-03 05:17:09.781'),
('cmtzd3vkh00d6670t4zuaiprr','cmtzd3n9c0033670tkxsevxh3','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer322@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,14,'2026-03-01 05:17:09.904'),
('cmtzd3vn400d8670trlw5on6j','cmtzd3n9c0033670tkxsevxh3','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer323@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','pending',1,21,'2026-02-27 05:17:09.999'),
('cmtzd3vpf00da670t1ert9ulp','cmtzd3nc00035670tnwbyj7xo','cmtzd3nul003k670tomx48gvy','Fatema B.','reviewer330@example.com',4,'Good quality, slightly expensive','Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.','approved',1,3,'2026-02-27 05:17:10.082'),
('cmtzd3vrp00dc670t7vpudea8','cmtzd3nc00035670tnwbyj7xo','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer331@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,10,'2026-02-25 05:17:10.164'),
('cmtzd3vtw00de670tmg44s7u7','cmtzd3nej0037670tlwzfpv64','cmtzd3o0e003o670t147xaz7v','Karim H.','reviewer340@example.com',5,'Best purchase this Eid','Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.','approved',1,6,'2026-02-21 05:17:10.243'),
('cmtzd3vw900dg670t7iylpirs','cmtzd3nej0037670tlwzfpv64','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer341@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','pending',1,13,'2026-02-19 05:17:10.328'),
('cmtzd3vyd00di670thjkdvogz','cmtzd3nej0037670tlwzfpv64','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer342@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,20,'2026-02-17 05:17:10.404'),
('cmtzd3w0n00dk670t68i4o7iq','cmtzd3ngp0039670tmmf0ehk7','cmtzd3o5g003s670tie78vrx6','Nusrat J.','reviewer350@example.com',3,'Average','Product is okay but the colour is slightly different from the photo. Delivery was on time though.','pending',1,9,'2026-02-15 05:17:10.486'),
('cmtzd3w3b00dm670tpjd5omn7','cmtzd3ngp0039670tmmf0ehk7','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer351@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,16,'2026-02-13 05:17:10.583'),
('cmtzd3w5l00do670t6xuikwxz','cmtzd3ngp0039670tmmf0ehk7','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer352@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,23,'2026-02-11 05:17:10.664'),
('cmtzd3w7q00dq670t26d9qary','cmtzd3ngp0039670tmmf0ehk7','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer353@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,6,'2026-02-09 05:17:10.741'),
('cmtzd3wa700ds670thub2etnf','cmtzd3nj0003b670tim99eopc','cmtzd3o9v003w670tn84f2p4c','Tanvir I.','reviewer360@example.com',5,'Worth every taka','Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.','approved',1,12,'2026-02-09 05:17:10.830'),
('cmtzd3wd700du670t7xrzffef','cmtzd3nj0003b670tim99eopc','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer361@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,19,'2026-02-07 05:17:10.938'),
('cmtzd3wfr00dw670tnsxahtqi','cmtzd3nla003d670tga0dmkyi','cmtzd3oea0040670t7iw1tivt','Sadia R.','reviewer370@example.com',4,'Fast delivery','Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.','approved',1,15,'2026-02-03 05:17:11.030'),
('cmtzd3wi400dy670t0aegexjc','cmtzd3nla003d670tga0dmkyi','cmtzd3oj30044670twbzlk59a','Imran K.','reviewer371@example.com',5,'Great customer service','Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.','approved',1,22,'2026-02-01 05:17:11.115'),
('cmtzd3wkj00e0670tl1s8src8','cmtzd3nla003d670tga0dmkyi','cmtzd3onk0048670tlg249haq','Ayesha S.','reviewer372@example.com',4,'Nice product','Happy with the purchase overall. Packaging was neat and the product was exactly as shown.','approved',1,5,'2026-01-30 05:17:11.203');

-- Setting: 117 rows
INSERT INTO `Setting` (`id`, `group`, `key`, `value`, `type`, `label`, `updatedAt`) VALUES
('cmtzd3p9a005j670t2e9y6any','general','site_name','','text','Site Name','2026-09-14 08:31:17.894'),
('cmtzd3p9a005k670t7xqjbik5','general','site_name_bn','','text','Site Name (Bangla)','2026-09-14 08:31:17.894'),
('cmtzd3p9a005l670tx0n3ycgv','general','site_tagline','Bangladesh''s Fashion & Lifestyle Store','text','Tagline','2026-09-14 08:31:17.894'),
('cmtzd3p9a005m670trc2wr4d4','general','site_logo','/uploads/1789374102590-bdmarket-logo.png','image','Logo URL','2026-09-14 08:31:17.894'),
('cmtzd3p9a005n670towrp8849','general','site_favicon','/uploads/1789374652696-bdmarket-favicon.png','image','Favicon URL','2026-09-14 08:31:17.894'),
('cmtzd3p9a005o670teje71ywm','general','site_url','http://localhost:3000','text','Site URL','2026-09-14 08:31:17.894'),
('cmtzd3p9a005p670tdr7snx0j','general','store_email','support@bdmarket.com.bd','text','Support Email','2026-09-14 08:31:17.894'),
('cmtzd3p9a005q670t9h7qi2oq','general','store_phone','01700-000000','text','Hotline','2026-09-14 08:31:17.894'),
('cmtzd3p9a005r670tvt2u0g4b','general','store_whatsapp','+8801700000000','text','WhatsApp','2026-09-14 08:31:17.894'),
('cmtzd3p9a005s670trm1w76qh','general','store_address','House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh','textarea','Store Address','2026-09-14 08:31:17.894'),
('cmtzd3p9a005t670t8n0iat0l','general','store_country','Bangladesh','text','Country','2026-09-14 08:31:17.894'),
('cmtzd3p9a005u670t9a2i9anl','general','maintenance_mode','false','boolean','Maintenance Mode','2026-09-14 08:31:17.894'),
('cmtzd3p9a005v670t6qsxihjc','store','store_currency','BDT','select','Currency','2026-09-13 05:17:01.726'),
('cmtzd3p9a005w670t0d93lxut','store','store_currency_symbol','৳','text','Currency Symbol','2026-09-13 05:17:01.726'),
('cmtzd3p9a005x670tbm94wdyc','store','store_timezone','Asia/Dhaka','text','Timezone','2026-09-13 05:17:01.726'),
('cmtzd3p9a005y670t5ita46ae','store','store_language','en','select','Default Language','2026-09-13 05:17:01.726'),
('cmtzd3p9a005z670tmuvimj7b','store','enable_bangla','true','boolean','Enable Bangla Content','2026-09-13 05:17:01.726'),
('cmtzd3p9a0060670t4mqb92fw','store','products_per_page','12','number','Products Per Page','2026-09-13 05:17:01.726'),
('cmtzd3p9a0061670t2p01c7i9','store','low_stock_threshold','5','number','Low Stock Threshold','2026-09-13 05:17:01.726'),
('cmtzd3p9a0062670tjm6zs6ly','store','tax_rate','0','number','Default VAT Rate (%)','2026-09-13 05:17:01.726'),
('cmtzd3p9a0063670tvn8yegou','store','tax_inclusive','true','boolean','Prices Include VAT','2026-09-13 05:17:01.726'),
('cmtzd3p9a0064670t3w8nwtxf','checkout','checkout_guest','true','boolean','Allow Guest Checkout','2026-09-13 05:17:01.726'),
('cmtzd3p9a0065670tj93qy57s','checkout','checkout_terms_url','/pages/terms','text','Terms Page URL','2026-09-13 05:17:01.726'),
('cmtzd3p9a0066670tw53b6b81','checkout','checkout_min_order','0','number','Minimum Order Value','2026-09-13 05:17:01.726'),
('cmtzd3p9a0067670t9kk85r40','checkout','checkout_max_qty','10','number','Max Quantity Per Item','2026-09-13 05:17:01.726'),
('cmtzd3p9a0068670tjpteihiw','checkout','checkout_require_phone','true','boolean','Require Phone Number','2026-09-13 05:17:01.726'),
('cmtzd3p9a0069670t69tcx6a3','checkout','checkout_order_note','true','boolean','Enable Order Note','2026-09-13 05:17:01.726'),
('cmtzd3p9a006a670tp8irmxul','shipping','shipping_enabled','true','boolean','Enable Shipping','2026-09-13 05:17:01.726'),
('cmtzd3p9a006b670t1ko6xofp','shipping','shipping_default_rate','100','number','Default Shipping Rate (৳)','2026-09-13 05:17:01.726'),
('cmtzd3p9a006c670thh8no3kp','shipping','shipping_free_over','2000','number','Free Shipping Over (৳)','2026-09-13 05:17:01.726'),
('cmtzd3p9a006d670t8vro57jy','shipping','shipping_min_days','1','number','Min Delivery Days','2026-09-13 05:17:01.726'),
('cmtzd3p9a006e670tne88m03o','shipping','shipping_max_days','7','number','Max Delivery Days','2026-09-13 05:17:01.726'),
('cmtzd3p9a006f670t3un3p1xj','shipping','shipping_cod_enabled','true','boolean','Enable Cash on Delivery','2026-09-13 05:17:01.726'),
('cmtzd3p9a006g670tj3idw6ma','payment','payment_cod_enabled','true','boolean','COD Enabled','2026-09-13 05:17:01.726'),
('cmtzd3p9a006h670t23e2v600','payment','payment_bkash_enabled','true','boolean','bKash Enabled','2026-09-13 05:17:01.726'),
('cmtzd3p9a006i670t95ig37gl','payment','payment_nagad_enabled','true','boolean','Nagad Enabled','2026-09-13 05:17:01.726'),
('cmtzd3p9a006j670tdzww4xkm','payment','payment_rocket_enabled','true','boolean','Rocket Enabled','2026-09-13 05:17:01.726'),
('cmtzd3p9a006k670tfhajtssd','payment','payment_sslcommerz_enabled','true','boolean','SSLCommerz Enabled','2026-09-13 05:17:01.726'),
('cmtzd3p9a006l670tgph86gv3','payment','payment_cod_fee','0','number','COD Fee (৳)','2026-09-13 05:17:01.726'),
('cmtzd3p9a006m670tkonwg1ji','seo','seo_default_title','BD Market — Bangladesh Fashion & Lifestyle Online Store','text','Default Meta Title','2026-09-13 05:17:01.726'),
('cmtzd3p9a006n670t8dcsnut1','seo','seo_title_template','%s | BD Market','text','Title Template','2026-09-13 05:17:01.726'),
('cmtzd3p9a006o670thi6nlef2','seo','seo_default_description','Shop authentic Bangladeshi fashion — panjabi, saree, kurti and lifestyle products. Cash on delivery nationwide, bKash & Nagad accepted.','textarea','Default Meta Description','2026-09-13 05:17:01.726'),
('cmtzd3p9a006p670ty2hc90xh','seo','seo_keywords','bangladesh online shop, panjabi, saree, kurti, bd market, dhaka fashion, online shopping bangladesh','textarea','Default Keywords','2026-09-13 05:17:01.726'),
('cmtzd3p9a006q670tnbmi2rvt','seo','seo_og_image','','image','Default OG Image','2026-09-13 05:17:01.726'),
('cmtzd3p9a006r670tpwpzn1f6','seo','seo_twitter_handle','@bdmarket','text','Twitter Handle','2026-09-13 05:17:01.726'),
('cmtzd3p9a006s670t2j57q2wk','seo','seo_verification','','text','Google Verification Code','2026-09-13 05:17:01.726'),
('cmtzd3p9a006t670t82gw3q49','seo','seo_sitemap_enabled','true','boolean','Enable XML Sitemap','2026-09-13 05:17:01.726'),
('cmtzd3p9a006u670tnk654sux','seo','seo_robots_txt','User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: http://localhost:3000/sitemap.xml','textarea','robots.txt Content','2026-09-13 05:17:01.726'),
('cmtzd3p9a006v670t9w06zstb','seo','seo_schema_org','true','boolean','Enable Schema.org Structured Data','2026-09-13 05:17:01.726'),
('cmtzd3p9a006w670tlsyyxbwx','seo','seo_breadcrumbs','true','boolean','Enable Breadcrumbs','2026-09-13 05:17:01.726'),
('cmtzd3p9a006x670tvx3walzb','analytics','analytics_ga_id','','text','Google Analytics ID','2026-09-13 05:17:01.726'),
('cmtzd3p9a006y670toactcwlx','analytics','analytics_gtm_id','','text','Google Tag Manager ID','2026-09-13 05:17:01.726'),
('cmtzd3p9a006z670txu8zbbwc','analytics','analytics_fb_pixel','','text','Facebook Pixel ID','2026-09-13 05:17:01.726'),
('cmtzd3p9a0070670tp1iezpof','analytics','analytics_enabled','false','boolean','Enable Analytics','2026-09-13 05:17:01.726'),
('cmtzd3p9a0071670thbck600i','appearance','theme_primary','#ff6600','text','Primary Color','2026-09-14 06:07:14.593'),
('cmtzd3p9a0072670tl1nnjt38','appearance','theme_accent','#ff6600','text','Accent Color','2026-09-14 06:07:14.593'),
('cmtzd3p9a0073670tvcu0awv8','appearance','show_announcement','true','boolean','Show Announcement Bar','2026-09-14 06:07:14.593'),
('cmtzd3p9a0074670tbonxfeyg','appearance','announcement_text','ফ্রি ডেলিভারি ৳২০০০+ অর্ডারে • সারা বাংলাদেশে ক্যাশ অন ডেলিভারি • হটলাইন ০১৭০০-০০০০০০','text','Announcement Text','2026-09-14 06:07:14.593'),
('cmtzd3p9a0075670thn2h20kb','appearance','show_whatsapp_float','true','boolean','Show WhatsApp Float Button','2026-09-14 06:07:14.593'),
('cmtzd3p9a0076670tyospq45l','reviews','reviews_enabled','true','boolean','Enable Product Reviews','2026-09-13 05:17:01.726'),
('cmtzd3p9a0077670tzc0skx8q','reviews','reviews_auto_approve','false','boolean','Auto-approve Reviews','2026-09-13 05:17:01.726'),
('cmtzd3p9a0078670tc70516j1','reviews','reviews_guest','true','boolean','Allow Guest Reviews','2026-09-13 05:17:01.726'),
('cmtzd3p9b0079670t1yxn1e9b','email','email_from_name','BD Market','text','From Name','2026-09-13 05:17:01.726'),
('cmtzd3p9b007a670ti27olxfd','email','email_from_address','no-reply@bdmarket.com.bd','text','From Email','2026-09-13 05:17:01.726'),
('cmtzd3p9b007b670t9hehawmi','email','email_order_confirm','true','boolean','Send Order Confirmation','2026-09-13 05:17:01.726'),
('cmtzd3p9b007c670t6lsojyrs','email','email_order_shipped','true','boolean','Send Shipping Notification','2026-09-13 05:17:01.726'),
('cmtzd3p9b007d670tsiwy5c78','email','email_footer_text','BD Market — House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh','textarea','Email Footer','2026-09-13 05:17:01.726'),
('cmtzd3p9b007e670tgxy45rkd','sms','sms_enabled','false','boolean','Enable SMS','2026-09-13 05:17:01.726'),
('cmtzd3p9b007f670t6pew8l53','sms','sms_sender_id','BDMARKET','text','SMS Sender ID','2026-09-13 05:17:01.726'),
('cmtzd3p9b007g670tarakjcbz','sms','sms_order_confirm','true','boolean','SMS on Order Confirm','2026-09-13 05:17:01.726'),
('cmtzd3p9b007h670tzs3gqef6','sms','sms_order_shipped','true','boolean','SMS on Shipment','2026-09-13 05:17:01.726'),
('cmtzd3p9b007i670t1cgsh6ss','social','social_facebook','https://facebook.com/bdmarket','text','Facebook','2026-09-13 05:17:01.726'),
('cmtzd3p9b007j670tsigmbrli','social','social_instagram','https://instagram.com/bdmarket','text','Instagram','2026-09-13 05:17:01.726'),
('cmtzd3p9b007k670tntpb9iaa','social','social_youtube','https://youtube.com/@bdmarket','text','YouTube','2026-09-13 05:17:01.726'),
('cmtzd3p9b007l670to6r2ur49','social','social_tiktok','','text','TikTok','2026-09-13 05:17:01.726'),
('cmtzd3p9b007m670tbo9qseyl','social','social_twitter','','text','X (Twitter)','2026-09-13 05:17:01.726'),
('cmtzd3p9b007n670t405bqown','social','social_linkedin','','text','LinkedIn','2026-09-13 05:17:01.726'),
('cmtzd3p9b007o670tye2bvlls','advanced','advanced_api_key','bdm-api-dev-key','text','REST API Key','2026-09-17 12:01:20.340'),
('cmtzd3p9b007p670tcm05as16','advanced','advanced_cache','true','boolean','Enable Page Cache','2026-09-17 12:01:20.340'),
('cmtzd3p9b007q670tubqcgjzy','advanced','advanced_debug','false','boolean','Debug Mode','2026-09-17 12:01:20.340'),
('cmu0zp76k001vi90mkhfs06e4','payment_logos','payment_logos','[{"id":"bkash","label":"Bkash","logo":"/uploads/1789374804569-bkash-payments.png","color":"#e2136e","mark":""},{"id":"nagad","label":"Nagad","logo":"/uploads/1789374816763-nagad-payments.png","color":"#f58220","mark":""},{"id":"rocket","label":"Rocket","logo":"/uploads/1789374821198-rocket-payments.png","color":"#8c3494","mark":""},{"id":"visa","label":"VISA","logo":"/uploads/1789374844242-visa-payments.png","color":"#1a1f71","mark":""},{"id":"mastercard","label":"Mastercard","logo":"/uploads/1789374849720-mastercard-payments.png","color":"#eb001b","mark":""},{"id":"cod","label":"Cash On Delivery","logo":"/uploads/1789374994363-cod-payments.png","color":"#334155","mark":""}]','json','Accepted Payment Logos','2026-09-16 12:04:34.766'),
('cmu2nzbeb0emyj9he','general','footer_logo','','image','Footer Logo URL','2026-09-15 12:44:51.445'),
('cmu2op4xg3zdjqhvy','email','email_enabled','true','boolean','Enable Transactional Email','2026-09-15 13:04:56.116'),
('cmu2op535zqqmi6so','email','smtp_host','','text','SMTP Host','2026-09-15 13:04:56.321'),
('cmu2op552cfcnuoef','email','smtp_port','587','number','SMTP Port','2026-09-15 13:04:56.390'),
('cmu2op56x93bdtsrf','email','smtp_encryption','tls','select','Encryption','2026-09-15 13:04:56.457'),
('cmu2op58wsuxfsr9a','email','smtp_username','','text','SMTP Username','2026-09-15 13:04:56.528'),
('cmu2op5arxq9n08bu','email','smtp_password','','text','SMTP Password','2026-09-15 13:04:56.595'),
('cmu2op5colpy1xq34','sms','sms_provider','greenweb','select','SMS Gateway','2026-09-15 13:04:56.664'),
('cmu2op5ek3ut0dsct','sms','sms_api_key','','text','API Key','2026-09-15 13:04:56.732'),
('cmu2op5gg7rerkb2a','sms','sms_api_url','','text','Custom API Endpoint','2026-09-15 13:04:56.800'),
('cmu2op5i9utlj4h62','sms','sms_order_delivered','true','boolean','SMS on Delivery','2026-09-15 13:04:56.865'),
('cmu2op5k3flcdu1x6','courier','courier_default','manual','select','Default Courier','2026-09-15 13:04:56.931'),
('cmu2op5m1dqd771o5','courier','courier_cod_enabled','true','boolean','Send COD Amount to Courier','2026-09-15 13:04:57.001'),
('cmu2op5nx3fdw6aib','courier','courier_pickup_address','','textarea','Pickup Address','2026-09-15 13:04:57.069'),
('cmu2op5przwyxh5lb','courier','courier_return_address','','textarea','Return Address','2026-09-15 13:04:57.135'),
('cmu2op5rqptj1dqp3','courier','pathao_client_id','','text','Pathao Client ID','2026-09-15 13:04:57.206'),
('cmu2op5tm6cxnipy0','courier','pathao_client_secret','','text','Pathao Client Secret','2026-09-15 13:04:57.274'),
('cmu2op5vgz1sr31uz','courier','pathao_username','','text','Pathao Username','2026-09-15 13:04:57.340'),
('cmu2op5x9qgue2wqt','courier','pathao_password','','text','Pathao Password','2026-09-15 13:04:57.405'),
('cmu2op5z2a8ly0n4y','courier','steadfast_api_key','','text','Steadfast API Key','2026-09-15 13:04:57.470'),
('cmu2op60x6tkcawk2','courier','steadfast_secret_key','','text','Steadfast Secret Key','2026-09-15 13:04:57.537'),
('cmu2op62r7t6u32vm','courier','redx_api_key','','text','RedX API Key','2026-09-15 13:04:57.604'),
('cmu2op64ldas2wzlm','courier','redx_pickup_store_id','','text','RedX Pickup Store ID','2026-09-15 13:04:57.669'),
('cmu3nqlhv2e3tnumm','homepage','hero_heading','Authentic Bangladeshi Fashion, Delivered Nationwide','text','Hero Headline','2026-09-16 05:25:50.803'),
('cmu3nqlo6mogpc31v','homepage','hero_stat_1_value','64','text','Stat 1 — Figure','2026-09-16 05:25:51.030'),
('cmu3nqlqoi3r7j0l9','homepage','hero_stat_1_label','Districts Delivered','text','Stat 1 — Caption','2026-09-16 05:25:51.120'),
('cmu3nqlt3fbnj87mp','homepage','hero_stat_2_value','24K+','text','Stat 2 — Figure','2026-09-16 05:25:51.207'),
('cmu3nqlvcdxa2g2wb','homepage','hero_stat_2_label','Happy Customers','text','Stat 2 — Caption','2026-09-16 05:25:51.288'),
('cmu3nqlxmi3wgexpf','homepage','hero_stat_3_value','4.8★','text','Stat 3 — Figure','2026-09-16 05:25:51.370'),
('cmu3nqlzuvzn3sdeb','homepage','hero_stat_3_label','Average Rating','text','Stat 3 — Caption','2026-09-16 05:25:51.450'),
('cmu42jj1t4gtavip0','email','email_notify_customer','true','boolean','Email the Customer','2026-09-16 12:20:15.281'),
('cmu42jj21jtkh32l2','email','email_notify_admin','true','boolean','Email the Store','2026-09-16 12:20:15.289'),
('cmu42jj27eieoepv8','sms','sms_notify_customer','true','boolean','SMS the Customer','2026-09-16 12:20:15.295'),
('cmu42jj2cteqj8cpc','sms','sms_notify_admin','true','boolean','SMS the Store','2026-09-16 12:20:15.300'),
('set-cart-redirect-1789634466699','checkout','cart_redirect_checkout','false','boolean','Go to Checkout After Adding to Cart','2026-09-17 08:41:06.699'),
('set-admin-path-1789638582091','advanced','admin_path','admin','text','Admin Panel URL Path','2026-09-17 12:01:20.340');

-- ShippingZone: 7 rows
INSERT INTO `ShippingZone` (`id`, `name`, `districts`, `method`, `rate`, `freeOver`, `minDays`, `maxDays`, `codEnabled`, `status`, `position`, `createdAt`) VALUES
('cmtzd3ot8004g670t4vqkgz7p','Inside Dhaka City','Dhaka','flat',60,2000,1,2,1,'active',0,'2026-09-13 05:17:01.149'),
('cmtzd3ot8004h670tdm6out45','Dhaka Suburbs (Gazipur, Narayanganj, Savar)','Gazipur,Narayanganj,Manikganj,Munshiganj,Narsingdi','flat',100,2500,2,3,1,'active',1,'2026-09-13 05:17:01.149'),
('cmtzd3ot8004i670tp72bic1h','Chattogram Division','Chattogram,Cox''s Bazar,Cumilla,Feni,Noakhali,Lakshmipur,Chandpur,Brahmanbaria','flat',130,3000,3,5,1,'active',2,'2026-09-13 05:17:01.149'),
('cmtzd3ot8004j670tqwl45u3y','Sylhet Division','Sylhet,Moulvibazar, Habiganj,Sunamganj','flat',140,3000,3,5,1,'active',3,'2026-09-13 05:17:01.149'),
('cmtzd3ot8004k670t2lci9p1i','Khulna & Barishal Division','Khulna,Jashore,Kushtia,Satkhira,Barishal,Patuakhali,Bhola,Pirojpur','flat',150,3500,3,6,1,'active',4,'2026-09-13 05:17:01.149'),
('cmtzd3ot8004l670tqqk18hqa','Rajshahi, Rangpur & Mymensingh','Rajshahi,Bogura,Pabna,Rangpur,Dinajpur,Mymensingh,Jamalpur,Netrokona','flat',150,3500,4,7,1,'active',5,'2026-09-13 05:17:01.149'),
('cmtzd3ot8004m670tsdsm7qgc','Free Shipping (Orders ৳5000+)','ALL','freeship_over',0,5000,2,7,1,'active',6,'2026-09-13 05:17:01.149');

-- TaxRate: 3 rows
INSERT INTO `TaxRate` (`id`, `name`, `country`, `rate`, `inclusive`, `status`) VALUES
('cmtzd3oy4004t670tkubgtdy3','Standard VAT (Bangladesh)','BD',15,1,'active'),
('cmtzd3oy4004u670tot538t6v','Reduced Rate (Essential Goods)','BD',7.5,1,'active'),
('cmtzd3oy4004v670ttyeyjheh','Zero Rated','BD',0,1,'active');

-- User: 11 rows
INSERT INTO `User` (`id`, `email`, `passwordHash`, `name`, `phone`, `role`, `avatar`, `status`, `lastLoginAt`, `createdAt`, `updatedAt`) VALUES
('cmtzd3ioe0000670thvmue476','admin@bdmarket.com.bd','$2a$10$cYco5z.yAlvxX75QDEaHmOQ2tvqCSt8rHeW23UkOiXvDIWH3ntwOm','Super Admin','+8801700000001','ADMIN',NULL,'active','2026-09-17 12:02:30.781','2026-09-13 05:16:53.199','2026-09-17 12:02:30.783'),
('cmtzd3itz0001670t7aq4m1y7','manager@bdmarket.com.bd','$2a$10$5YGgyJt6icuv/wtVDySmi.ap60xeOsI7FJdLlrxdx79yOO17Ll6NO','Store Manager','+8801700000002','MANAGER',NULL,'active',NULL,'2026-09-13 05:16:53.400','2026-09-13 05:16:53.400'),
('cmtzd3iwt0002670tzcju4d4d','editor@bdmarket.com.bd','$2a$10$5YGgyJt6icuv/wtVDySmi.ap60xeOsI7FJdLlrxdx79yOO17Ll6NO','Content Editor',NULL,'EDITOR',NULL,'active',NULL,'2026-09-13 05:16:53.501','2026-09-13 05:16:53.501'),
('cmtzd3nnk003e670t3jmaj1w1','rahim@example.com','$2a$10$aH29OSWJSP7lXgRL4Q7EOelB4FHg43g1gk4mAcJEqfZAy2TeQSrUu','Rahim Ahmed','+8801711000001','CUSTOMER',NULL,'active','2026-09-13 08:19:17.280','2026-09-13 05:16:59.649','2026-09-13 08:19:17.281'),
('cmtzd3nsd003i670ttrn4oghk','fatema@example.com','$2a$10$aH29OSWJSP7lXgRL4Q7EOelB4FHg43g1gk4mAcJEqfZAy2TeQSrUu','Fatema Begum','+8801711000002','CUSTOMER',NULL,'active',NULL,'2026-09-13 05:16:59.821','2026-09-13 05:16:59.821'),
('cmtzd3nwv003m670ti5e79up0','karim@example.com','$2a$10$aH29OSWJSP7lXgRL4Q7EOelB4FHg43g1gk4mAcJEqfZAy2TeQSrUu','Karim Hossain','+8801711000003','CUSTOMER',NULL,'active',NULL,'2026-09-13 05:16:59.983','2026-09-13 05:16:59.983'),
('cmtzd3o32003q670tmr7orvra','nusrat@example.com','$2a$10$aH29OSWJSP7lXgRL4Q7EOelB4FHg43g1gk4mAcJEqfZAy2TeQSrUu','Nusrat Jahan','+8801711000004','CUSTOMER',NULL,'active',NULL,'2026-09-13 05:17:00.207','2026-09-13 05:17:00.207'),
('cmtzd3o7n003u670tzvnyxoam','tanvir@example.com','$2a$10$aH29OSWJSP7lXgRL4Q7EOelB4FHg43g1gk4mAcJEqfZAy2TeQSrUu','Tanvir Islam','+8801711000005','CUSTOMER',NULL,'active',NULL,'2026-09-13 05:17:00.372','2026-09-13 05:17:00.372'),
('cmtzd3oc4003y670tfwvdv0ub','sadia@example.com','$2a$10$aH29OSWJSP7lXgRL4Q7EOelB4FHg43g1gk4mAcJEqfZAy2TeQSrUu','Sadia Rahman','+8801711000006','CUSTOMER',NULL,'active',NULL,'2026-09-13 05:17:00.532','2026-09-13 05:17:00.532'),
('cmtzd3ogh0042670t8iu1ceu6','imran@example.com','$2a$10$aH29OSWJSP7lXgRL4Q7EOelB4FHg43g1gk4mAcJEqfZAy2TeQSrUu','Imran Khan','+8801711000007','CUSTOMER',NULL,'active',NULL,'2026-09-13 05:17:00.689','2026-09-13 05:17:00.689'),
('cmtzd3olf0046670td1ygf3q1','ayesha@example.com','$2a$10$aH29OSWJSP7lXgRL4Q7EOelB4FHg43g1gk4mAcJEqfZAy2TeQSrUu','Ayesha Siddika','+8801711000008','CUSTOMER',NULL,'active','2026-09-17 09:58:24.654','2026-09-13 05:17:00.867','2026-09-17 09:58:24.655');

SET FOREIGN_KEY_CHECKS = 1;
