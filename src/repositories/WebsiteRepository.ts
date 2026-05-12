import { BaseRepository } from "./BaseRepository";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Website Repository - handles sliders, navigation, and site-wide configs
 */
export class WebsiteRepository extends BaseRepository<any> {
  constructor() {
    super("site_config");
  }

  /**
   * Get website sliders
   */
  async getSliders(): Promise<any[]> {
    // Try document first
    const doc = await this.collection.doc("sliders").get();
    if (doc.exists && doc.data()?.items?.length > 0) {
      return doc.data()?.items || [];
    }

    // Fallback to collection
    const snapshot = await this.collection.firestore.collection("sliders").get();
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    return [];
  }

  /**
   * Get navigation configuration
   */
  async getNavigationConfig(): Promise<{
    mainNav: any[];
    footerNav: any[];
    socialLinks?: any[];
  }> {
    const doc = await this.collection.doc("navigation").get();
    if (!doc.exists) {
      return { mainNav: [], footerNav: [] };
    }
    return doc.data() as any;
  }

  /**
   * Save navigation configuration
   */
  async saveNavigation(config: any): Promise<void> {
    await this.collection.doc("navigation").set({
      ...config,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Add a banner
   */
  async addBanner(data: any): Promise<any> {
    const docRef = this.collection.doc("sliders");
    const doc = await docRef.get();
    const items = doc.exists ? (doc.data()?.items || []) : [];
    
    const newItem = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    };
    
    await docRef.set({
      items: [...items, newItem],
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    
    return newItem;
  }

  /**
   * Delete a banner
   */
  async deleteBanner(id: string): Promise<any | null> {
    const docRef = this.collection.doc("sliders");
    const doc = await docRef.get();
    if (!doc.exists) return null;
    
    const items = doc.data()?.items || [];
    const itemToDelete = items.find((i: any) => i.id === id);
    const newItems = items.filter((i: any) => i.id !== id);
    
    await docRef.update({
      items: newItems,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    return itemToDelete;
  }
}

export const websiteRepository = new WebsiteRepository();
