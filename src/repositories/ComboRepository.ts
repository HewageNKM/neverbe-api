import { BaseRepository } from "./BaseRepository";
import type { ComboProduct } from "@/interfaces";

/**
 * Combo Repository - handles combo/bundle product data access
 */
export class ComboRepository extends BaseRepository<ComboProduct> {
  constructor() {
    super("combo_products");
  }

  /**
   * Serialize combo for client
   */
  private serializeCombo(data: any): ComboProduct {
    return {
      ...data,
      startDate: this.serializeTimestamp(data.startDate),
      endDate: this.serializeTimestamp(data.endDate),
      createdAt: this.serializeTimestamp(data.createdAt),
      updatedAt: this.serializeTimestamp(data.updatedAt),
    } as ComboProduct;
  }

  /**
   * Find all active combos
   */
  async findActive(): Promise<ComboProduct[]> {
    const snapshot = await this.collection
      .where("isActive", "==", true)
      .where("isDeleted", "!=", true)
      .get();

    return snapshot.docs.map((doc) =>
      this.serializeCombo({ id: doc.id, ...doc.data() })
    );
  }

  /**
   * Find combo by ID with populated product details
   */
  async findById(id: string): Promise<ComboProduct | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) return null;

    const combo = { id: doc.id, ...doc.data() } as any;
    if (combo.isDeleted) return null;

    // Populate product details for each combo item
    const populatedItems = await Promise.all(
      (combo.items || []).map(async (item: any) => {
        try {
          const productDoc = await this.collection.firestore
            .collection("products")
            .doc(item.productId)
            .get();

          if (!productDoc.exists) {
            return { ...item, product: null };
          }

          const productData = productDoc.data();

          // Find specific variant if variantId is provided
          let variant = null;
          if (item.variantId && productData?.variants) {
            variant = productData.variants.find(
              (v: any) => v.variantId === item.variantId
            );
          }

          return {
            ...item,
            product: {
              id: productDoc.id,
              name: productData?.name,
              thumbnail: productData?.thumbnail,
              sellingPrice: productData?.sellingPrice,
              marketPrice: productData?.marketPrice,
              discount: productData?.discount || 0,
              variants: productData?.variants || [],
            },
            variant,
          };
        } catch (err) {
          console.error(
            `[ComboRepository] Error fetching product ${item.productId}:`,
            err
          );
          return { ...item, product: null };
        }
      })
    );

    return this.serializeCombo({
      ...combo,
      items: populatedItems,
    });
  }

  /**
   * Find all active combos with preview thumbnails
   */
  async findActiveWithThumbnails(): Promise<ComboProduct[]> {
    const combos = await this.findActive();

    return Promise.all(
      combos.map(async (combo: any) => {
        const firstItem = combo.items?.[0];
        if (!firstItem) return combo;

        try {
          const productDoc = await this.collection.firestore
            .collection("products")
            .doc(firstItem.productId)
            .get();

          if (!productDoc.exists) return combo;

          const productData = productDoc.data();
          return {
            ...combo,
            previewThumbnail:
              combo.thumbnail?.url || productData?.thumbnail?.url,
          };
        } catch {
          return combo;
        }
      })
    );
  }

  /**
   * Find paginated active combos with thumbnails
   */
  async findPaginated(
    page: number = 1,
    pageSize: number = 6
  ): Promise<{ combos: ComboProduct[]; total: number; totalPages: number }> {
    // Get all active combos first (for accurate count)
    const allSnapshot = await this.collection
      .where("status", "==", "ACTIVE")
      .where("isDeleted", "!=", true)
      .get();

    const total = allSnapshot.size;
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated slice
    const offset = (page - 1) * pageSize;
    const paginatedDocs = allSnapshot.docs.slice(offset, offset + pageSize);

    const combos = paginatedDocs.map((doc) =>
      this.serializeCombo({ id: doc.id, ...doc.data() })
    );

    // Populate with product thumbnails
    const populatedCombos = await Promise.all(
      combos.map(async (combo: any) => {
        const firstItem = combo.items?.[0];
        if (!firstItem) return combo;

        try {
          const productDoc = await this.collection.firestore
            .collection("products")
            .doc(firstItem.productId)
            .get();

          if (!productDoc.exists) return combo;

          const productData = productDoc.data();
          return {
            ...combo,
            previewThumbnail:
              combo.thumbnail?.url || productData?.thumbnail?.url,
          };
        } catch {
          return combo;
        }
      })
    );

    return { combos: populatedCombos, total, totalPages };
  }

  /**
   * Validate combo item selections for add to cart
   */
  validateSelection(
    combo: ComboProduct,
    selections: { productId: string; variantId: string; size: string }[]
  ): { valid: boolean; message?: string } {
    const requiredItems =
      (combo as any).items?.filter((item: any) => item.required) || [];

    // Check all required items have a selection
    for (const required of requiredItems) {
      const hasSelection = selections.some(
        (s) => s.productId === required.productId
      );
      if (!hasSelection) {
        return {
          valid: false,
          message: "Please select options for all required items",
        };
      }
    }

    // Check all selections have size
    for (const selection of selections) {
      if (!selection.size) {
        return {
          valid: false,
          message: "Please select a size for all items",
        };
      }
    }

    return { valid: true };
  }
}

// Singleton instance
export const comboRepository = new ComboRepository();
