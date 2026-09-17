-- CreateTable
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
CREATE TABLE `Wishlist` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Wishlist_customerId_productId_key`(`customerId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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
CREATE TABLE `SearchQuery` (
    `id` VARCHAR(191) NOT NULL,
    `query` VARCHAR(191) NOT NULL,
    `results` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SearchQuery_query_idx`(`query`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Newsletter` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'subscribed',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Newsletter_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LandingPage` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `parentSlug` VARCHAR(191) NOT NULL DEFAULT 'collection',
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `blocks` VARCHAR(191) NOT NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDesc` VARCHAR(191) NULL,
    `metaKeywords` VARCHAR(191) NULL,
    `ogImage` VARCHAR(191) NULL,
    `canonical` VARCHAR(191) NULL,
    `noIndex` BOOLEAN NOT NULL DEFAULT false,
    `gaId` VARCHAR(191) NULL,
    `fbPixelId` VARCHAR(191) NULL,
    `customHead` VARCHAR(191) NULL,
    `customBody` VARCHAR(191) NULL,
    `bgColor` VARCHAR(191) NULL,
    `textColor` VARCHAR(191) NULL,
    `fontFamily` VARCHAR(191) NULL,
    `maxWidth` INTEGER NOT NULL DEFAULT 1100,
    `checkoutEnabled` BOOLEAN NOT NULL DEFAULT true,
    `checkoutHeading` VARCHAR(191) NULL,
    `checkoutFields` VARCHAR(191) NULL,
    `checkoutButton` VARCHAR(191) NULL,
    `thankYouNote` VARCHAR(191) NULL,
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

