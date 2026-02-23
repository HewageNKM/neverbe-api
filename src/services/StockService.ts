import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Stock } from "@/model/Stock"; // Adjust path if needed
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";
import { FieldValue } from "firebase-admin/firestore";

const STOCKS_COLLECTION = "stocks"; // Collection name

/**
 * Fetches paginated and filtered stock locations.
 */
export const getStocks = async (
  pageNumber: number = 1,
  size: number = 20,
  search?: string,
  status?: boolean
): Promise<{ dataList: Stock[]; rowCount: number }> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(STOCKS_COLLECTION)
      .where("isDeleted", "==", false); // Always filter soft-deleted

    let countQuery: FirebaseFirestore.Query = adminFirestore
      .collection(STOCKS_COLLECTION)
      .where("isDeleted", "==", false);

    // Apply status filter
    if (typeof status === "boolean") {
      query = query.where("status", "==", status);
      countQuery = countQuery.where("status", "==", status);
    }

    // Get total count
    const totalSnapshot = await countQuery.get();
    const rowCount = totalSnapshot.size;

    // Apply pagination and default ordering (if not searching)
    const offset = (pageNumber - 1) * size;

    const stocksSnapshot = await query.offset(offset).limit(size).get();

    // Map documents to StockLocation objects
    const stocks = stocksSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        address: data.address,
        status: data.status,
        // Convert Timestamps, handle potential undefined
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : undefined,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : undefined,
      } as Stock; // Cast, assuming isDeleted is not part of the client model
    });

    return { dataList: stocks, rowCount: rowCount };
  } catch (error) {
    console.error("Get Stocks Error:", error);
    if ((error as any).code === 5) {
      // Firestore index error code
      console.error(
        "Firestore Index Error: A composite index might be needed if search and orderBy are combined."
      );
    }
    throw error;
  }
};

/**
 * Adds a new stock location document.
 */
export const addStock = async (
  data: Omit<Stock, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<Stock> => {
  try {
    const id = `stock-${nanoid(8)}`;

    const newStock: Omit<Stock, "id"> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
      tags: string[];
      isDeleted: boolean;
    } = {
      ...data,
      isDeleted: false,
      tags: data.tags || [],
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    await adminFirestore.collection(STOCKS_COLLECTION).doc(id).set(newStock);

    // We don't have the exact server timestamps here, return what we have + ID
    return { ...data, id } as Stock;
  } catch (error) {
    console.error("Add Stock Error:", error);
    throw error; // Re-throw for API route handler
  }
};

/**
 * Updates an existing stock location document.
 */
export const updateStock = async (
  id: string,
  data: Partial<Omit<Stock, "id" | "createdAt" | "updatedAt" | "isDeleted">>
): Promise<void> => {
  try {
    const stockRef = adminFirestore.collection(STOCKS_COLLECTION).doc(id);
    const stockSnap = await stockRef.get();

    if (!stockSnap.exists) {
      throw new AppError(`Stock location with ID ${id} not found.`, 404);
    }

    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await stockRef.update(updateData);
  } catch (error) {
    console.error("Update Stock Error:", error);
    throw error;
  }
};

/**
 * Soft-deletes a stock location document.
 */
export const deleteStock = async (id: string): Promise<void> => {
  try {
    const stockRef = adminFirestore.collection(STOCKS_COLLECTION).doc(id);
    const stockSnap = await stockRef.get();

    if (!stockSnap.exists) {
      throw new AppError(`Stock location with ID ${id} not found.`, 404);
    }

    await stockRef.update({
      isDeleted: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Delete Stock Error:", error);
    throw error;
  }
};

export const getStockForDropdown = async () => {
  try {
    const snapshot = await adminFirestore
      .collection(STOCKS_COLLECTION)
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .get();

    const stocks = snapshot.docs.map((doc) => ({
      id: doc.id,
      label: doc.data().name,
    }));
    return stocks;
  } catch (error) {
    console.error("Get Stock Dropdown Error:", error);
    return [];
  }
};
