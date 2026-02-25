import { adminFirestore } from "@/firebase/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Product } from "@/model/Product";
import { POSOrder } from "@/model/POSTypes";
import { Order } from "@/model/Order";
import { addOrder } from "./OrderService";
import { searchStockInventory } from "./AlgoliaService";
import { AppError } from "@/utils/apiResponse";

// ================================
// 🔹 DATA TYPES
// ================================

export interface POSCartItem {
  itemId: string;
  variantId: string;
  name: string;
  variantName: string;
  thumbnail: string;
  size: string;
  discount: number;
  type: string;
  quantity: number;
  price: number;
  bPrice: number;
  stockId: string;
  createdAt?: FirebaseFirestore.Timestamp;
}

export interface InventoryItem {
  productId: string;
  variantId: string;
  size: string;
  stockId: string;
  quantity: number;
}

export interface StockInventoryItem {
  productId: string;
  variantId: string;
  size: string;
  stockId: string;
  quantity: number;
}

// ================================
// 🔹 POS CART OPERATIONS
// ================================

// ✅ Get all items in POS cart
// ✅ Get all items in POS cart (scoped to user mandatory)
export const getPosCart = async (
  stockId: string,
  userId: string,
): Promise<POSCartItem[]> => {
  let query = adminFirestore
    .collection("pos_cart")
    .orderBy("createdAt", "desc");

  if (stockId) {
    query = query.where("stockId", "==", stockId);
  }
  if (userId) {
    query = query.where("userId", "==", userId);
  }

  const snap = await query.get();
  return snap.docs.map((d) => d.data() as POSCartItem);
};

// ✅ Add item to POS cart using InventoryItem info
export const addItemToPosCart = async (item: POSCartItem, userId: string) => {
  const posCart = adminFirestore.collection("pos_cart");

  await adminFirestore.runTransaction(async (tx) => {
    // 1️⃣ Fetch inventory item using productId, variantId, size, stockId
    const inventoryQuery = await adminFirestore
      .collection("stock_inventory")
      .where("productId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (inventoryQuery.empty)
      throw new AppError("Item not found in inventory", 404);

    const inventoryRef = inventoryQuery.docs[0].ref;
    const inventoryData = inventoryQuery.docs[0].data() as InventoryItem;

    // 2️⃣ Check if requested quantity is bigger than available
    if (item.quantity > inventoryData.quantity) {
      console.warn(
        `Warning: Requested quantity (${item.quantity}) is greater than available stock (${inventoryData.quantity}) for productId: ${item.itemId}, size: ${item.size}, stockId: ${item.stockId}`,
      );
    }

    // 3️⃣ Deduct stock (allow negative)
    tx.update(inventoryRef, {
      quantity: inventoryData.quantity - item.quantity,
    });

    // 4️⃣ Add to POS cart
    tx.set(posCart.doc(), {
      ...item,
      userId: userId || "anonymous",
      createdAt: FieldValue.serverTimestamp(),
    });
  });
};

// ✅ Remove item from POS cart and restock
export const removeFromPosCart = async (item: POSCartItem, userId: string) => {
  const posCart = adminFirestore.collection("pos_cart");

  await adminFirestore.runTransaction(async (tx) => {
    // 1️⃣ Fetch inventory item
    const inventoryQuery = await adminFirestore
      .collection("stock_inventory")
      .where("productId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (inventoryQuery.empty)
      throw new AppError("Item not found in inventory", 404);

    const inventoryRef = inventoryQuery.docs[0].ref;
    const inventoryData = inventoryQuery.docs[0].data() as InventoryItem;

    // 2️⃣ Restore stock
    tx.update(inventoryRef, {
      quantity: inventoryData.quantity + item.quantity,
    });

    // 3️⃣ Delete item from POS cart
    let cartQuery = posCart
      .where("itemId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId);

    if (userId) {
      cartQuery = cartQuery.where("userId", "==", userId);
    }

    const cartSnapshot = await cartQuery.limit(1).get();

    if (!cartSnapshot.empty) {
      tx.delete(cartSnapshot.docs[0].ref);
    }
  });
};

// ✅ Clear entire POS cart (scoped to user/stock mandatory)
export const clearPosCart = async (stockId: string, userId: string) => {
  try {
    let query = adminFirestore.collection("pos_cart").limit(500); // Batch limit

    if (stockId) {
      query = query.where("stockId", "==", stockId);
    }
    if (userId) {
      query = query.where("userId", "==", userId);
    }

    const snap = await query.get();
    if (snap.empty) return;

    const batch = adminFirestore.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log("POS cart cleared for user:", userId, "stock:", stockId);
  } catch (error) {
    console.error("clearPosCart failed:", error);
    throw error;
  }
};

// ✅ Update cart item quantity
export const updatePosCartItemQuantity = async (
  item: POSCartItem,
  newQuantity: number,
) => {
  const posCart = adminFirestore.collection("pos_cart");

  await adminFirestore.runTransaction(async (tx) => {
    // 1️⃣ Find the cart item
    const cartQuery = await posCart
      .where("itemId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (cartQuery.empty) throw new AppError("Cart item not found", 404);

    const cartDoc = cartQuery.docs[0];
    const currentItem = cartDoc.data() as POSCartItem;
    const quantityDiff = newQuantity - currentItem.quantity;

    // 2️⃣ Fetch inventory item
    const inventoryQuery = await adminFirestore
      .collection("stock_inventory")
      .where("productId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (inventoryQuery.empty)
      throw new AppError("Item not found in inventory", 404);

    const inventoryRef = inventoryQuery.docs[0].ref;
    const inventoryData = inventoryQuery.docs[0].data() as InventoryItem;

    // 3️⃣ Update inventory (deduct if increasing, restore if decreasing)
    tx.update(inventoryRef, {
      quantity: inventoryData.quantity - quantityDiff,
    });

    // 4️⃣ Update cart item quantity
    tx.update(cartDoc.ref, { quantity: newQuantity });
  });
};

// ================================
// 🔹 POS PRODUCT OPERATIONS
// ================================

// ✅ Get products available at a specific stock location
export const getProductsByStock = async (
  stockId: string,
  page: number = 1,
  size: number = 20,
): Promise<Product[]> => {
  console.log(`Fetching products for stockId: ${stockId}`);

  try {
    if (!stockId) return [];

    // 1️⃣ Fetch stock inventory items for the given stockId
    const stockSnapshot = await adminFirestore
      .collection("stock_inventory")
      .where("stockId", "==", stockId)
      .get();

    if (stockSnapshot.empty) {
      console.log("No inventory found for stockId:", stockId);
      return [];
    }

    // 2️⃣ Extract unique productIds
    const productIdsSet = new Set<string>();
    stockSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.productId) {
        productIdsSet.add(data.productId);
      }
    });

    const productIds = Array.from(productIdsSet);
    if (productIds.length === 0) return [];

    // 3️⃣ Pagination
    const offset = (page - 1) * size;
    const paginatedProductIds = productIds.slice(offset, offset + size);

    if (paginatedProductIds.length === 0) return [];

    // 4️⃣ Fetch products from `products` collection
    const productsCollection = adminFirestore.collection("products");
    const productsSnapshot = await productsCollection
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .where("id", "in", paginatedProductIds)
      .get();

    const products: Product[] = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Product),
    }));

    console.log("Products retrieved:", products.length);
    return products;
  } catch (error) {
    console.error("Error retrieving inventory products:", error);
    throw error;
  }
};

// ✅ Search products by name with stock filtering
export const searchProductsByStock = async (
  stockId: string,
  query: string,
): Promise<Product[]> => {
  try {
    if (!stockId || !query) return [];

    // 1️⃣ Fetch stock inventory items for the given stockId
    const stockSnapshot = await adminFirestore
      .collection("stock_inventory")
      .where("stockId", "==", stockId)
      .get();

    if (stockSnapshot.empty) return [];

    // 2️⃣ Extract unique productIds
    const productIdsSet = new Set<string>();
    stockSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.productId) {
        productIdsSet.add(data.productId);
      }
    });

    const productIds = Array.from(productIdsSet);
    if (productIds.length === 0) return [];

    // 3️⃣ Fetch all matching products
    // Note: Firestore doesn't support full-text search, so we fetch all and filter
    const productsSnapshot = await adminFirestore
      .collection("products")
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .get();

    const lowerQuery = query.toLowerCase();
    const products: Product[] = productsSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return (
          productIds.includes(doc.id) &&
          (data.name?.toLowerCase().includes(lowerQuery) ||
            data.sku?.toLowerCase().includes(lowerQuery) ||
            data.brand?.toLowerCase().includes(lowerQuery))
        );
      })
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Product),
      }));

    return products;
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};

// ✅ Get stock inventory for specific product/variant/size
export const getStockInventory = async (
  stockId: string,
  productId: string,
  variantId: string,
  size: string,
): Promise<StockInventoryItem | null> => {
  try {
    const filters = `stockId:"${stockId}" AND productId:"${productId}" AND variantId:"${variantId}" AND size:"${size}"`;
    const { hits } = await searchStockInventory("", {
      filters,
      hitsPerPage: 1,
    });

    if (hits.length === 0) {
      throw new AppError("Inventory item not found", 404);
    }

    return hits[0] as unknown as StockInventoryItem;
  } catch (error) {
    console.error("Error fetching stock inventory:", error);
    throw error;
  }
};

// ✅ Get all inventory for a product at a stock location
export const getProductInventoryByStock = async (
  stockId: string,
  productId: string,
): Promise<StockInventoryItem[]> => {
  try {
    const filters = `stockId:"${stockId}" AND productId:"${productId}"`;
    const { hits } = await searchStockInventory("", {
      filters,
      hitsPerPage: 100, // Reasonable limit for variants/sizes of a single product
    });

    return hits as unknown as StockInventoryItem[];
  } catch (error) {
    console.error("Error fetching product inventory:", error);
    throw error;
  }
};

// ✅ Get available stocks list
export const getAvailableStocks = async (): Promise<
  { id: string; name: string; label: string }[]
> => {
  try {
    const stocksSnapshot = await adminFirestore
      .collection("stocks")
      .where("status", "==", true)
      .get();

    return stocksSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || doc.id,
      label: doc.data().label || doc.data().name || doc.id,
    }));
  } catch (error) {
    console.error("Error fetching stocks:", error);
    throw error;
  }
};

// ================================
// 🔹 POS ORDER OPERATIONS
// ================================

// ✅ Create a new POS Order and Update Stock
export const createPOSOrder = async (
  orderData: Partial<Order>,
  userId: string,
) => {
  try {
    await addOrder(orderData);
    await clearPosCart(orderData.stockId!, userId);
    // Return the order data with createdAt for PDF generation
    return {
      ...orderData,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error creating POS order:", error);
    throw error;
  }
};

// ================================
// 🔹 PETTY CASH OPERATIONS
// ================================

// ✅ Get Petty Cash Transactions
export const getPettyCash = async (limit: number = 10) => {
  try {
    const snapshot = await adminFirestore
      .collection("petty_cash")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching petty cash:", error);
    throw error;
  }
};

// ✅ Add Petty Cash Transaction
export const addPettyCashTransaction = async (data: any) => {
  try {
    const ref = adminFirestore.collection("petty_cash").doc();
    const transaction = {
      ...data,
      id: ref.id,
      createdAt: Timestamp.now(),
    };
    await ref.set(transaction);
    return transaction;
  } catch (error) {
    console.error("Error adding petty cash transaction:", error);
    throw error;
  }
};

// ================================
// 🔹 PAYMENT METHOD OPERATIONS
// ================================

// ✅ Get Payment Methods
export const getPaymentMethods = async () => {
  try {
    const snapshot = await adminFirestore
      .collection("payment_methods")
      .where("isDeleted", "!=", true)
      .where("status", "==", true)
      .where("available", "array-contains", "Store")
      .get();

    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => ({
      paymentId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw error;
  }
};

export const getOrderByOrderId = async (orderId: string) => {
  try {
    const snapshot = await adminFirestore
      .collection("orders")
      .where("orderId", "==", orderId)
      .where("from", "==", "Store")
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new AppError(`Order with Order ID ${orderId} not found`, 404);
    }

    return {
      orderId: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
      createdAt: snapshot.docs[0].data().createdAt?.toDate().toISOString(),
      updatedAt: snapshot.docs[0].data().updatedAt?.toDate().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching order by order ID:", error);
    throw error;
  }
};
