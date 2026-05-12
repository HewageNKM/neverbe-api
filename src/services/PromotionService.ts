import { promotionRepository } from "@/repositories/PromotionRepository";
import { couponRepository } from "@/repositories/CouponRepository";
import { productRepository } from "@/repositories/ProductRepository";
import { Promotion, ProductVariantTarget } from "@/model/Promotion";
import { Coupon } from "@/model/Coupon";
import { nanoid } from "nanoid";
import { formatEntityDates, formatListDates } from "./UtilService";
import { AppError } from "@/utils/apiResponse";
import { uploadCompressedImage } from "./StorageService";

/**
 * PromotionService - Business logic for promotions and coupons
 * Delegates data access to repositories
 */

const uploadBanner = async (file: File, id: string): Promise<string> => {
  const filePath = `promotions/${id}/banner/banner_${Date.now()}.webp`;
  const url = await uploadCompressedImage(file, filePath);
  return url;
};

// --- PROMOTIONS CRUD ---

export const getPromotions = async (
  pageNumber: number = 1,
  size: number = 20,
  filterStatus?: string,
  search?: string,
  type?: string,
): Promise<{ dataList: Promotion[]; rowCount: number }> => {
  const { dataList, total } = await promotionRepository.findPaginated({
    page: pageNumber,
    size,
    filterStatus,
    search,
    type
  });

  return { dataList: formatListDates(dataList, ["startDate", "endDate", "createdAt", "updatedAt"]), rowCount: total };
};

export const createPromotion = async (
  data: Omit<Promotion, "id" | "updatedAt" | "createdAt" | "usageCount">,
  file?: File | null,
): Promise<Promotion> => {
  const docId = `promo-${nanoid(10)}`;
  let bannerUrl = data.bannerUrl;
  if (file) bannerUrl = await uploadBanner(file, docId);

  const created = await promotionRepository.create({
    ...data,
    bannerUrl,
    startDate: data.startDate ? new Date(data.startDate as any) : null,
    endDate: data.endDate ? new Date(data.endDate as any) : null,
    usageCount: 0,
  });
  return formatEntityDates(created, ["startDate", "endDate", "createdAt", "updatedAt"]);
};

export const updatePromotion = async (
  id: string,
  data: Partial<Promotion>,
  file?: File | null,
): Promise<Promotion> => {
  const exists = await promotionRepository.findById(id);
  if (!exists) throw new AppError(`Promotion with ID ${id} not found`, 404);

  const payload: any = { ...data };
  if (file) payload.bannerUrl = await uploadBanner(file, id);
  if (data.startDate) payload.startDate = new Date(data.startDate as any);
  if (data.endDate) payload.endDate = new Date(data.endDate as any);

  const updated = await promotionRepository.update(id, payload);
  return formatEntityDates(updated, ["startDate", "endDate", "createdAt", "updatedAt"]);
};

export const deletePromotion = async (id: string) => {
  const exists = await promotionRepository.findById(id);
  if (!exists) throw new AppError(`Promotion with ID ${id} not found`, 404);
  await promotionRepository.delete(id);
  return { id };
};

export const getPromotionById = async (id: string) => {
  const promo = await promotionRepository.findById(id);
  if (!promo) throw new AppError("Promotion not found", 404);
  return formatEntityDates(promo);
};

// --- COUPONS CRUD ---

export const getCoupons = async (
  pageNumber: number = 1,
  size: number = 20,
  filterStatus?: string,
  search?: string,
) => {
  const { dataList, total } = await couponRepository.findPaginated({
    page: pageNumber,
    size,
    filterStatus,
    search
  });

  return { dataList: formatListDates(dataList, ["startDate", "endDate", "createdAt", "updatedAt"]), rowCount: total };
};

export const createCoupon = async (
  data: Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usageCount">,
) => {
  const id = nanoid(10);
  const created = await couponRepository.create(id, {
    ...data,
    usageCount: 0,
    isDeleted: false,
  } as any);
  return formatEntityDates(created, ["startDate", "endDate", "createdAt", "updatedAt"]);
};

export const updateCoupon = async (id: string, data: Partial<Coupon>) => {
  const exists = await couponRepository.findById(id);
  if (!exists) throw new AppError(`Coupon with ID ${id} not found`, 404);

  const payload: any = { ...data };
  if (data.startDate) payload.startDate = new Date(data.startDate as any);
  if (data.endDate) payload.endDate = new Date(data.endDate as any);

  const updated = await couponRepository.update(id, payload);
  return formatEntityDates(updated, ["startDate", "endDate", "createdAt", "updatedAt"]);
};

export const deleteCoupon = async (id: string) => {
  const exists = await couponRepository.findById(id);
  if (!exists) throw new AppError(`Coupon with ID ${id} not found`, 404);
  await couponRepository.softDelete(id);
  return { id };
};

export const getCouponByCode = async (code: string) => couponRepository.findByCode(code);

// --- BUSINESS LOGIC: ELIGIBILITY & CALCULATION ---

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  discount?: number;
  category?: string;
  brand?: string;
}

const checkVariantEligibility = (cartItems: CartItem[], targets: ProductVariantTarget[]): boolean => {
  if (!targets || targets.length === 0) return true;
  for (const target of targets) {
    const matching = cartItems.filter((i) => i.productId === target.productId);
    if (matching.length === 0) continue;
    if (target.variantMode === "ALL_VARIANTS") return true;
    if (target.variantMode === "SPECIFIC_VARIANTS" && target.variantIds) {
      if (matching.some((i) => i.variantId && target.variantIds!.includes(i.variantId))) return true;
    }
  }
  return false;
};

const getEligibleCartItems = (cartItems: CartItem[], targets: ProductVariantTarget[]): CartItem[] => {
  if (!targets || targets.length === 0) return cartItems;
  return cartItems.filter((item) => {
    const target = targets.find((t) => t.productId === item.productId);
    if (!target) return false;
    if (target.variantMode === "ALL_VARIANTS") return true;
    return target.variantMode === "SPECIFIC_VARIANTS" && target.variantIds?.includes(item.variantId);
  });
};

export const validateCoupon = async (
  code: string,
  userId: string | null,
  cartTotal: number,
  cartItems: CartItem[],
) => {
  const coupon = await getCouponByCode(code);
  if (!coupon) return { valid: false, discount: 0, message: "Invalid coupon code" };
  if (!coupon.isActive) return { valid: false, discount: 0, message: "Coupon is not active" };

  const now = new Date();
  const startDate = new Date(coupon.startDate as string);
  const endDate = coupon.endDate ? new Date(coupon.endDate as string) : null;

  if (now < startDate) return { valid: false, discount: 0, message: "Coupon not started" };
  if (endDate && now > endDate) return { valid: false, discount: 0, message: "Coupon expired" };
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { valid: false, discount: 0, message: "Usage limit reached" };

  if (userId && coupon.perUserLimit) {
    const count = await couponRepository.getUserUsageCount(coupon.id, userId);
    if (count >= coupon.perUserLimit) return { valid: false, discount: 0, message: "Per-user limit reached" };
  }

  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) return { valid: false, discount: 0, message: "Min order amount required" };

  // Category validation (Batch fetch from productRepository)
  if (coupon.applicableCategories?.length) {
    const productIds = cartItems.map(i => i.productId);
    const products = await productRepository.findByIds(productIds);
    const hasCat = products.some(p => coupon.applicableCategories!.includes(p.category));
    if (!hasCat) return { valid: false, discount: 0, message: "Categories not eligible" };
  }

  // Discount calculation
  let discountAmount = 0;
  if (coupon.discountType === "FIXED") {
    discountAmount = coupon.discountValue;
  } else if (coupon.discountType === "PERCENTAGE") {
    let eligibleItems = getEligibleCartItems(cartItems, coupon.applicableProductVariants || []);
    let applicableTotal = eligibleItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    discountAmount = (applicableTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;
  }

  return { valid: true, discount: discountAmount, coupon };
};

export const trackCouponUsage = async (couponId: string, userId: string, orderId: string, discount: number) => {
  await couponRepository.trackUsage(couponId, userId, orderId, discount);
};

export const calculateCartDiscount = async (cartItems: CartItem[], cartTotal: number, userId?: string | null) => {
  const promotions = await promotionRepository.findActive();
  promotions.sort((a, b) => b.priority - a.priority);

  const now = new Date();
  const eligible: { promo: Promotion; discount: number }[] = [];

  for (const promo of promotions) {
    if (userId && promo.perUserLimit) {
      const count = await promotionRepository.getUserUsageCount(promo.id, userId);
      if (count >= promo.perUserLimit) continue;
    }

    if (!checkVariantEligibility(cartItems, promo.applicableProductVariants || [])) continue;

    // Calculation logic (simplified for refactor)
    let discount = 0;
    if (promo.type === "PERCENTAGE") {
      const eligibleItems = getEligibleCartItems(cartItems, promo.applicableProductVariants || []);
      const total = eligibleItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      discount = (total * promo.value) / 100;
      if (promo.maxDiscount && discount > promo.maxDiscount) discount = promo.maxDiscount;
    } else if (promo.type === "FIXED") {
      discount = promo.value;
    }

    eligible.push({ promo, discount });
    if (!promo.stackable) break;
  }

  const totalDiscount = eligible.reduce((sum, e) => sum + e.discount, 0);
  return {
    promotions: eligible.map(e => e.promo),
    totalDiscount,
    discount: totalDiscount,
  };
};
