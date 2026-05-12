import { productRepository } from "@/repositories/ProductRepository";
import { orderRepository } from "@/repositories/OrderRepository";
import { purchaseOrderRepository } from "@/repositories/PurchaseOrderRepository";
import { settingsRepository } from "@/repositories/SettingsRepository";
import { brandRepository } from "@/repositories/BrandRepository";
import { categoryRepository } from "@/repositories/CategoryRepository";
// paymentMethodRepository import removed as it's now part of settingsRepository
import { Product } from "@/model/Product";
import { ProductVariant } from "@/model/ProductVariant";
import { nanoid } from "nanoid";
import { adminStorageBucket } from "@/firebase/firebaseAdmin";
import { AppError } from "@/utils/apiResponse";
import { uploadCompressedImage } from "./StorageService";
import { Order } from "@/model/Order";
import { PopularItem } from "@/model/PopularItem";

const BUCKET = adminStorageBucket;

// ====================== Helpers ======================

const uploadThumbnail = async (
  file: File,
  id: string,
): Promise<Product["thumbnail"]> => {
  const filePath = `products/${id}/thumbnail/thumb_${Date.now()}.webp`;
  const url = await uploadCompressedImage(file, filePath);

  return {
    url: url,
    file: filePath,
    order: 0,
  } as any;
};

const getApprovedPOProductIds = async (): Promise<Set<string>> => {
  return await purchaseOrderRepository.findProductIdsFromApprovedPOs();
};

const enrichProductsWithLabels = async (
  products: Product[],
): Promise<Product[]> => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const approvedPOProductIds = await getApprovedPOProductIds();

  return products.map((product) => {
    let createdAtDate: Date | null = null;
    if (product.createdAt) {
        if (typeof (product.createdAt as any).toDate === 'function') {
            createdAtDate = (product.createdAt as any).toDate();
        } else {
            createdAtDate = new Date(product.createdAt);
        }
    }

    const isNewArrival = createdAtDate && createdAtDate >= ninetyDaysAgo;
    const isRestockingSoon = !product.inStock && approvedPOProductIds.has(product.id || product.productId);

    return {
      ...product,
      isNewArrival: !!isNewArrival,
      isRestockingSoon: !!isRestockingSoon,
    };
  });
};

// ====================== Core Operations ======================

export const addProducts = async (product: Partial<Product>, file: File) => {
  const id = `p-${nanoid(8)}`.toLowerCase();
  const thumbnail = await uploadThumbnail(file, id);

  const tags: string[] = [];
  if (product.brand) tags.push(product.brand.toLowerCase());
  if (product.category) tags.push(product.category.toLowerCase());
  
  const genderData = (product as any).gender;
  if (genderData) {
    const genders = Array.isArray(genderData) ? genderData : [genderData];
    genders.forEach((g: string) => g && tags.push(g.toLowerCase()));
  }

  const allSizes = new Set<string>();
  (product.variants || []).forEach((v) => v.sizes?.forEach((s) => allSizes.add(s)));

  return await productRepository.create(id, {
    ...product,
    thumbnail,
    nameLower: product.name?.toLowerCase(),
    tags,
    availableSizes: Array.from(allSizes),
  });
};

export const updateProduct = async (
  id: string,
  product: Partial<Product>,
  file?: File | null,
) => {
  const tags: string[] = [];
  if (product.brand) tags.push(product.brand.toLowerCase());
  if (product.category) tags.push(product.category.toLowerCase());

  const genderData = (product as any).gender;
  if (genderData) {
    const genders = Array.isArray(genderData) ? genderData : [genderData];
    genders.forEach((g: string) => g && tags.push(g.toLowerCase()));
  }

  const allSizes = new Set<string>();
  (product.variants || []).forEach((v) => v.sizes?.forEach((s) => allSizes.add(s)));

  let thumbnail = product.thumbnail;
  if (file) {
    const oldProduct = await productRepository.findById(id);
    const oldPath = oldProduct?.thumbnail?.file;
    if (oldPath) {
      try { await BUCKET.file(oldPath).delete(); } catch (delError) { console.warn(`Failed to delete old thumbnail`, delError); }
    }
    thumbnail = await uploadThumbnail(file, id);
  }

  return await productRepository.update(id, {
    ...product,
    thumbnail,
    nameLower: product.name?.toLowerCase(),
    tags,
    availableSizes: Array.from(allSizes),
  });
};

// ====================== Retrieval ======================

export const getProducts = async (
  pageNumber = 1,
  size = 20,
  search?: string,
  brand?: string,
  category?: string,
  status?: boolean,
  listing?: boolean,
) => {
  const { dataList, total } = await productRepository.findAllPaginated({
    page: pageNumber, size, search, brand, category, status, listing,
  });

  const processed = dataList.map((p) => ({
    ...p,
    variants: p.variants.filter((v) => !v.isDeleted),
  }));

  return { dataList: processed, rowCount: total };
};

export const getProductById = async (id: string): Promise<Product> => {
  const product = await productRepository.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  return {
    ...product,
    variants: product.variants.filter((v) => !v.isDeleted),
  };
};

export const getPopularProducts = async (
  startDate: string,
  endDate: string,
  size: number,
): Promise<PopularItem[]> => {
  const startDay = new Date(startDate);
  const endDay = new Date(endDate);
  startDay.setHours(0, 0, 0, 0);
  endDay.setHours(23, 59, 59, 999);

  const orders = await orderRepository.findPaidOrdersInDateRange(startDay, endDay);
  
  const itemsMap = new Map<string, number>();
  orders.forEach((order) => {
    if (order.items) {
      order.items.forEach((item) => {
        const count = itemsMap.get(item.itemId) || 0;
        itemsMap.set(item.itemId, count + item.quantity);
      });
    }
  });

  const sortedEntries = Array.from(itemsMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, size);
  const productIds = sortedEntries.map(([id]) => id);
  const products = await productRepository.findByIds(productIds);
  const productMap = new Map(products.map(p => [p.id, p]));

  return sortedEntries.map(([itemId, count]) => {
    const product = productMap.get(itemId);
    if (!product) return null;
    return { item: product as any, soldCount: count };
  }).filter(Boolean) as PopularItem[];
};

export const getHotProducts = async () => {
  const itemCount = await orderRepository.countOrdersByItem(100);
  const sortedItemIds = Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([itemId]) => itemId);
  if (sortedItemIds.length === 0) return [];

  const products = await productRepository.findByIds(sortedItemIds);
  const filtered = products.filter((p) => p.listing === true && p.status === true && !p.isDeleted);
  return enrichProductsWithLabels(filtered);
};

export const getDealsProducts = async (
  page: number = 1,
  size: number = 10,
  tags?: string[],
  inStock?: boolean,
  gender?: string,
  sizes?: string[],
) => {
  const result = await productRepository.findDiscounted({ page, size, tags, inStock, gender, sizes });
  const enriched = await enrichProductsWithLabels(result.dataList);
  return { ...result, dataList: enriched };
};

export const getDealsProductsFiltered = async (options: any) => {
  const { tags, inStock, sizes, gender, page = 1, size = 20 } = options;
  return getDealsProducts(page, size, tags, inStock, gender, sizes);
};

export const searchWebProducts = async (query_string: string, options: any = {}) => {
  const { page = 1, size = 20 } = options;
  const { dataList, total } = await productRepository.findAllPaginated({
    page, size, search: query_string, listing: true, status: true
  });
  const enriched = await enrichProductsWithLabels(dataList);
  return { total, dataList: enriched };
};

// ====================== Stock & Sitemap ======================

export const getBatchProductStock = async (
  productId: string,
  variantId: string,
  sizes: string[],
): Promise<Record<string, number>> => {
  const settings = await settingsRepository.getEcommerceSettings();
  if (!settings?.stockId) throw new Error("StockId not found in ERP settings");

  const results = await Promise.all(
    sizes.map(async (size) => ({
      size,
      quantity: await productRepository.getStock(productId, variantId, size, settings.stockId!),
    })),
  );

  const stockMap: Record<string, number> = {};
  results.forEach(({ size, quantity }) => { stockMap[size] = quantity; });
  return stockMap;
};

export const getProductsForSitemap = async () => {
  const products = await productRepository.findAllForSitemap();
  const baseUrl = process.env.WEB_BASE_URL;
  return products.map((p) => ({
    url: `${baseUrl}/collections/products/${p.id}`,
    lastModified: new Date(),
    priority: 0.7,
  }));
};

export const getBrandForSitemap = async () => brandRepository.findForSitemap(process.env.WEB_BASE_URL || "");
export const getCategoriesForSitemap = async () => categoryRepository.findForSitemap(process.env.WEB_BASE_URL || "");
export const getPaymentMethods = async () => settingsRepository.findPaymentMethodsForWebsite();

export const getProductDropdown = async () => {
    const { dataList } = await productRepository.findAllPaginated({ size: 1000, status: true, listing: true });
    return dataList.map(p => ({
        id: p.id, label: p.name, buyingPrice: p.buyingPrice || 0,
        variants: p.variants || [], availableSizes: p.availableSizes || [],
    }));
};

export const getProductStock = async (productId: string, variantId: string, size: string) => {
  const settings = await settingsRepository.getEcommerceSettings();
  if (!settings?.stockId) throw new Error("StockId not found in ERP settings");
  return productRepository.getStock(productId, variantId, size, settings.stockId);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await productRepository.delete(id);
};
