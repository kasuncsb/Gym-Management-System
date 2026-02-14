// Inventory Service — Phase 3
import { eq, and, desc, sql, lte } from 'drizzle-orm';
import { db } from '../config/database';
import { inventoryItems, inventoryTransactions, members, users } from '../db/schema';
import { randomUUID } from 'crypto';
import { NotFoundError, ValidationError } from '../utils/error-types';

export class InventoryService {
  /** Add a new inventory item */
  static async addItem(data: {
    branchId: string;
    name: string;
    category: string;
    sku?: string;
    quantityInStock?: number;
    reorderThreshold?: number;
    unitCost?: number;
    sellingPrice?: number;
    supplier?: string;
  }) {
    const id = randomUUID();
    await db.insert(inventoryItems).values({
      id,
      branchId: data.branchId,
      name: data.name,
      category: data.category,
      sku: data.sku ?? null,
      quantityInStock: data.quantityInStock ?? 0,
      reorderThreshold: data.reorderThreshold ?? 5,
      unitCost: data.unitCost?.toString() ?? null,
      sellingPrice: data.sellingPrice?.toString() ?? null,
      supplier: data.supplier ?? null,
    });
    return { id };
  }

  /** List all items for a branch */
  static async listItems(branchId: string, category?: string) {
    const conditions = [eq(inventoryItems.branchId, branchId), eq(inventoryItems.isActive, true)];
    if (category) conditions.push(eq(inventoryItems.category, category));
    return db
      .select()
      .from(inventoryItems)
      .where(and(...conditions))
      .orderBy(inventoryItems.name);
  }

  /** Get item by ID */
  static async getItemById(itemId: string) {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);
    if (!item) throw new NotFoundError('Inventory item');
    return item;
  }

  /** Update an item */
  static async updateItem(itemId: string, data: Partial<{
    name: string;
    category: string;
    sku: string;
    reorderThreshold: number;
    unitCost: number;
    sellingPrice: number;
    supplier: string;
  }>) {
    const [existing] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId)).limit(1);
    if (!existing) throw new NotFoundError('Inventory item');

    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.category !== undefined) updates.category = data.category;
    if (data.sku !== undefined) updates.sku = data.sku;
    if (data.reorderThreshold !== undefined) updates.reorderThreshold = data.reorderThreshold;
    if (data.unitCost !== undefined) updates.unitCost = data.unitCost.toString();
    if (data.sellingPrice !== undefined) updates.sellingPrice = data.sellingPrice.toString();
    if (data.supplier !== undefined) updates.supplier = data.supplier;

    if (Object.keys(updates).length > 0) {
      await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, itemId));
    }
    return { updated: true };
  }

  /** Soft-delete item */
  static async deactivateItem(itemId: string) {
    await db.update(inventoryItems).set({ isActive: false }).where(eq(inventoryItems.id, itemId));
    return { deactivated: true };
  }

  /** Record a stock transaction (restock, sale, damage, adjustment, expired) */
  static async recordTransaction(data: {
    itemId: string;
    changeAmount: number;
    reason: 'sale' | 'restock' | 'damage' | 'adjustment' | 'expired';
    memberId?: string;
    recordedBy: string;
    notes?: string;
  }) {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, data.itemId))
      .limit(1);
    if (!item) throw new NotFoundError('Inventory item');

    const newQty = item.quantityInStock + data.changeAmount;
    if (newQty < 0) throw new ValidationError('Insufficient stock. Current: ' + item.quantityInStock);

    const txId = randomUUID();
    await db.insert(inventoryTransactions).values({
      id: txId,
      itemId: data.itemId,
      changeAmount: data.changeAmount,
      reason: data.reason,
      memberId: data.memberId ?? null,
      recordedBy: data.recordedBy,
      notes: data.notes ?? null,
    });

    // Update stock level
    const updates: Record<string, any> = { quantityInStock: newQty };
    if (data.reason === 'restock') updates.lastRestockedAt = new Date();
    await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, data.itemId));

    return { transactionId: txId, newQuantity: newQty };
  }

  /** Record a sale (convenience wrapper) */
  static async recordSale(data: {
    itemId: string;
    quantity: number;
    memberId?: string;
    recordedBy: string;
    notes?: string;
  }) {
    return this.recordTransaction({
      itemId: data.itemId,
      changeAmount: -Math.abs(data.quantity),
      reason: 'sale',
      memberId: data.memberId,
      recordedBy: data.recordedBy,
      notes: data.notes,
    });
  }

  /** Restock an item */
  static async restock(data: {
    itemId: string;
    quantity: number;
    recordedBy: string;
    notes?: string;
  }) {
    return this.recordTransaction({
      itemId: data.itemId,
      changeAmount: Math.abs(data.quantity),
      reason: 'restock',
      recordedBy: data.recordedBy,
      notes: data.notes,
    });
  }

  /** Get transaction history for an item */
  static async getTransactionHistory(itemId: string, limit = 50) {
    return db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.itemId, itemId))
      .orderBy(desc(inventoryTransactions.createdAt))
      .limit(limit);
  }

  /** Get low-stock items (below reorder threshold) */
  static async getLowStockItems(branchId: string) {
    return db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.branchId, branchId),
          eq(inventoryItems.isActive, true),
          sql`${inventoryItems.quantityInStock} <= ${inventoryItems.reorderThreshold}`,
        ),
      )
      .orderBy(inventoryItems.quantityInStock);
  }

  /** Get inventory categories for a branch */
  static async getCategories(branchId: string) {
    const rows = await db
      .select({ category: inventoryItems.category, count: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.branchId, branchId), eq(inventoryItems.isActive, true)))
      .groupBy(inventoryItems.category);
    return rows;
  }

  /** Get total inventory value */
  static async getInventoryValue(branchId: string) {
    const [result] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${inventoryItems.quantityInStock} * ${inventoryItems.unitCost}), 0)`,
        totalRetail: sql<number>`COALESCE(SUM(${inventoryItems.quantityInStock} * ${inventoryItems.sellingPrice}), 0)`,
        totalItems: sql<number>`COALESCE(SUM(${inventoryItems.quantityInStock}), 0)`,
      })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.branchId, branchId), eq(inventoryItems.isActive, true)));

    return {
      totalCostValue: parseFloat(String(result.totalCost)) || 0,
      totalRetailValue: parseFloat(String(result.totalRetail)) || 0,
      totalItems: Number(result.totalItems),
    };
  }
}
