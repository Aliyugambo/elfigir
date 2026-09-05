-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_restaurantId_fkey";

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
