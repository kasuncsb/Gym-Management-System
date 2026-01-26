import { eq, like, and, isNull, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { products, productCategories, inventoryLogs } from '../db/schema';
import { NotFoundError, ConflictError } from '../utils/error-types';
import { randomUUID } from 'crypto';

export class InventoryService {

    // Create Product
    static async createProduct(data: {
        name: string;
        sku?: string;
        price: number;
        categoryId?: string;
        stockQuantity?: number;
    }) {
        const id = randomUUID();

        await db.insert(products).values({
            id,
            name: data.name,
            sku: data.sku,
            price: data.price.toString(), // Decimal as string for precision
            categoryId: data.categoryId,
            stockQuantity: data.stockQuantity || 0,
            isActive: true
        });

        if (data.stockQuantity && data.stockQuantity > 0) {
            await this.logInventoryChange(id, data.stockQuantity, 'initial_stock');
        }

        return this.getProductById(id);
    }

    // Get Product
    static async getProductById(id: string) {
        const [product] = await db.select()
            .from(products)
            .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
            .where(eq(products.id, id))
            .limit(1);

        if (!product) throw new NotFoundError('Product');
        return { ...product.products, categoryName: product.product_categories?.name };
    }

    // List Products (POS)
    static async listProducts(query?: string) {
        let condition = eq(products.isActive, true);
        if (query) {
            condition = and(condition, like(products.name, `%${query}%`)) as any;
        }

        return db.select()
            .from(products)
            .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
            .where(condition)
            .limit(50);
    }

    // Adjust Stock
    static async adjustStock(productId: string, change: number, reason: string, staffId: string) {
        const product = await this.getProductById(productId);
        const currentStock = product.stockQuantity || 0;
        const newStock = currentStock + change;

        if (newStock < 0) throw new ConflictError('Insufficient stock');

        await db.update(products)
            .set({ stockQuantity: newStock })
            .where(eq(products.id, productId));

        await this.logInventoryChange(productId, change, reason, staffId);

        return { productId, newStock };
    }

    private static async logInventoryChange(productId: string, change: number, reason: string, staffId?: string) {
        await db.insert(inventoryLogs).values({
            id: randomUUID(),
            productId,
            changeAmount: change,
            reason,
            staffId
        });
    }
}
