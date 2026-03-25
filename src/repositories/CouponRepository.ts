import { BaseRepository } from "./BaseRepository";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Coupon, CouponUsage, ProductVariantTarget } from "@/interfaces";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

interface CartItem {
  itemId: string;
  variantId: string;
  quantity: number;
  price: number;
}

/**
 * Coupon Repository - handles coupon data access and validation
 */
export class CouponRepository extends BaseRepository<Coupon> {
  private usageCollection = "coupon_usage";

  constructor() {
    super("coupons");
  }

  /**
   * Serialize coupon for client
   */
  private serializeCoupon(doc: FirebaseFirestore.DocumentSnapshot): Coupon {
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: this.serializeTimestamp(data.createdAt),
      updatedAt: this.serializeTimestamp(data.updatedAt),
      startDate: this.serializeTimestamp(data.startDate),
      endDate: this.serializeTimestamp(data.endDate),
    } as Coupon;
  }

  /**
   * Check if coupon is within active date range
   */
  private isWithinDateRange(coupon: Coupon): boolean {
    const now = dayjs();
    const parseDate = (d: any) => {
      if (!d) return null;
      if (d instanceof Timestamp) return dayjs(d.toDate());
      if (typeof d === "string") {
        const formats = [
          "DD/MM/YYYY, hh:mm:ss a",
          "DD/MM/YYYY, h:mm:ss a",
          "DD/MM/YYYY",
          "YYYY-MM-DD",
        ];
        for (const f of formats) {
          const p = dayjs(d, f, true);
          if (p.isValid()) return p;
        }
      }
      return dayjs(d);
    };

    const startDate = parseDate(coupon.startDate);
    const endDate = parseDate(coupon.endDate);

    if (startDate && now.isBefore(startDate)) return false;
    if (endDate && now.isAfter(endDate)) return false;
    return true;
  }

  /**
   * Find coupon by code
   */
  async findByCode(code: string): Promise<Coupon | null> {
    const snapshot = await this.collection
      .where("code", "==", code)
      .where("isDeleted", "==", false)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.serializeCoupon(snapshot.docs[0]);
  }

  /**
   * Find all active public coupons (for display on offers page)
   */
  async findActivePublic(): Promise<Coupon[]> {
    const snapshot = await this.collection
      .where("isActive", "==", true)
      .where("isDeleted", "==", false)
      .get();

    return snapshot.docs
      .map((doc) => this.serializeCoupon(doc))
      .filter((coupon) => {
        // Filter out private coupons
        if (coupon.restrictedToUsers && coupon.restrictedToUsers.length > 0) {
          return false;
        }
        return this.isWithinDateRange(coupon);
      });
  }

  /**
   * Get user's usage count for a specific coupon
   */
  async getUserUsageCount(couponId: string, userId: string): Promise<number> {
    const snapshot = await this.collection.firestore
      .collection(this.usageCollection)
      .where("couponId", "==", couponId)
      .where("userId", "==", userId)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Check if user has placed any orders (for first-order-only coupons)
   */
  async isFirstOrder(userId: string): Promise<boolean> {
    const snapshot = await this.collection.firestore
      .collection("orders")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    return snapshot.empty;
  }

  /**
   * Record coupon usage
   */
  async recordUsage(
    couponId: string,
    userId: string,
    orderId: string,
    discountApplied: number
  ): Promise<void> {
    await this.collection.firestore.collection(this.usageCollection).add({
      couponId,
      userId,
      orderId,
      discountApplied,
      usedAt: FieldValue.serverTimestamp(),
    });

    // Increment global usage count
    await this.collection.doc(couponId).update({
      usageCount: FieldValue.increment(1),
    });
  }

  /**
   * Check variant eligibility for coupon
   */
  checkVariantEligibility(
    cartItems: CartItem[],
    targets: ProductVariantTarget[]
  ): boolean {
    if (!targets || targets.length === 0) return true;

    for (const target of targets) {
      const matchingItems = cartItems.filter(
        (item) => item.itemId === target.productId
      );

      if (matchingItems.length === 0) continue;

      if (target.variantMode === "ALL_VARIANTS") return true;

      if (target.variantMode === "SPECIFIC_VARIANTS" && target.variantIds) {
        const hasMatch = matchingItems.some(
          (item) =>
            item.variantId && target.variantIds!.includes(item.variantId)
        );
        if (hasMatch) return true;
      }
    }

    return false;
  }

  /**
   * Get eligible cart items for discount calculation
   */
  getEligibleCartItems(
    cartItems: CartItem[],
    targets: ProductVariantTarget[]
  ): CartItem[] {
    if (!targets || targets.length === 0) return cartItems;

    return cartItems.filter((item) => {
      for (const target of targets) {
        if (item.itemId !== target.productId) continue;

        if (target.variantMode === "ALL_VARIANTS") return true;

        if (target.variantMode === "SPECIFIC_VARIANTS" && target.variantIds) {
          return item.variantId && target.variantIds.includes(item.variantId);
        }
      }
      return false;
    });
  }
}

// Singleton instance
export const couponRepository = new CouponRepository();
