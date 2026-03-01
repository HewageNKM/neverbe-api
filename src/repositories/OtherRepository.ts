import { BaseRepository } from "./BaseRepository";

/**
 * Other Repository - handles brands, categories, and settings
 */
export class OtherRepository extends BaseRepository<any> {
  constructor() {
    super("brands"); // Default collection, methods use specific collections
  }

  /**
   * Get active brands for dropdown
   */
  async getBrandsForDropdown(): Promise<{ id: string; label: string }[]> {
    const snapshot = await this.collection.firestore
      .collection("brands")
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      label: doc.data().name,
    }));
  }

  /**
   * Get full brand objects
   */
  async getBrands(): Promise<any[]> {
    const snapshot = await this.collection.firestore
      .collection("brands")
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .get();

    return snapshot.docs.map((doc) => this.clearTimestamps({ ...doc.data() }));
  }

  /**
   * Get active categories for dropdown
   */
  async getCategoriesForDropdown(): Promise<{ id: string; label: string }[]> {
    const snapshot = await this.collection.firestore
      .collection("categories")
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      label: doc.data().name,
    }));
  }

  /**
   * Get ERP settings
   */
  async getSettings(): Promise<any | null> {
    const doc = await this.collection.firestore
      .collection("app_settings")
      .doc("erp_settings")
      .get();

    if (!doc.exists) return null;

    const ecommerce = doc.data()?.ecommerce || {};
    return {
      ...ecommerce,
      stockId: doc.data()?.onlineStockId,
    };
  }

  /**
   * Get brands for sitemap
   */
  async getBrandsForSitemap(
    baseUrl: string
  ): Promise<{ url: string; lastModified: Date; priority: number }[]> {
    const snapshot = await this.collection.firestore
      .collection("brands")
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .where("listing", "==", true)
      .get();

    return snapshot.docs.map((doc) => ({
      url: `${baseUrl}/collections/products?brand=${encodeURIComponent(
        doc.data().name
      )}`,
      lastModified: new Date(),
      priority: 0.8,
    }));
  }

  /**
   * Get categories for sitemap
   */
  async getCategoriesForSitemap(
    baseUrl: string
  ): Promise<{ url: string; lastModified: Date; priority: number }[]> {
    const snapshot = await this.collection.firestore
      .collection("categories")
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .get();

    return snapshot.docs.map((doc) => ({
      url: `${baseUrl}/collections/products?category=${encodeURIComponent(
        doc.data().name
      )}`,
      lastModified: new Date(),
      priority: 0.8,
    }));
  }

  /**
   * Get active payment methods
   */
  async getPaymentMethods(): Promise<any[]> {
    const snapshot = await this.collection.firestore
      .collection("payment_methods")
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .where("available", "array-contains", "Website")
      .get();

    return snapshot.docs.map((doc) => this.clearTimestamps({ ...doc.data() }));
  }

  /**
   * Get sliders
   */
  async getSliders(): Promise<any[]> {
    const snapshot = await this.collection.firestore
      .collection("sliders")
      .get();

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      createdAt: null,
      updatedAt: null,
    }));
  }

  /**
   * Get navigation configuration
   */
  async getNavigationConfig(): Promise<{
    mainNav: any[];
    footerNav: any[];
    socialLinks?: any[];
  }> {
    const doc = await this.collection.firestore
      .collection("site_config")
      .doc("navigation")
      .get();

    if (!doc.exists) {
      return { mainNav: [], footerNav: [] };
    }

    return doc.data() as any;
  }

  /**
   * Get user addresses
   */
  async getUserAddresses(
    uid: string,
    decryptFn: (data: string, key: string) => string
  ): Promise<any[]> {
    const snapshot = await this.collection.firestore
      .collection("users")
      .doc(uid)
      .collection("addresses")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: doc.id,
        ...data,
        address: decryptFn(data.address, uid),
        city: decryptFn(data.city, uid),
        phone: decryptFn(data.phone, uid),
      };
    });
  }

  /**
   * Save user address
   */
  async saveUserAddress(
    uid: string,
    type: string,
    data: {
      address: string;
      city: string;
      phone: string;
      isDefault?: boolean;
    },
    encryptFn: (data: string, key: string) => string
  ): Promise<{ success: boolean; message: string }> {
    const docRef = this.collection.firestore
      .collection("users")
      .doc(uid)
      .collection("addresses")
      .doc(type);

    const dataToSave = {
      type,
      address: encryptFn(data.address, uid),
      city: encryptFn(data.city, uid),
      phone: encryptFn(data.phone, uid),
      default: !!data.isDefault,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(dataToSave, { merge: true });
    return { success: true, message: "Address saved." };
  }
}

// Singleton instance
export const otherRepository = new OtherRepository();
