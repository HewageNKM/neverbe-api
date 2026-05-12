import { BaseRepository } from "./BaseRepository";
import { Brand } from "@/model/Brand";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Brand Repository - handles brand data access
 */
export class BrandRepository extends BaseRepository<Brand> {
  constructor() {
    super("brands");
  }

  /**
   * Find paginated brands with filters
   */
  async findPaginated(options: {
    page?: number;
    size?: number;
    search?: string;
    status?: "active" | "inactive" | null;
  }): Promise<{ dataList: Brand[]; total: number }> {
    const { page = 1, size = 10, search = "", status } = options;
    
    let query = this.getActiveQuery();

    if (status === "active") query = query.where("status", "==", true);
    if (status === "inactive") query = query.where("status", "==", false);

    if (search.trim()) {
      const s = search.trim();
      query = query.where("name", ">=", s).where("name", "<=", s + "\uf8ff");
    }

    const total = await this.countDocuments(query);
    const snapshot = await query
      .offset((page - 1) * size)
      .limit(size)
      .get();

    const dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
    return { dataList, total };
  }

  /**
   * Get brands for dropdown
   */
  async findForDropdown(): Promise<{ id: string; label: string; name: string; logoUrl: string }[]> {
    const snapshot = await this.getActiveQuery()
      .where("status", "==", true)
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      label: doc.data().displayName || doc.data().name,
      name: doc.data().name,
      logoUrl: doc.data().logoUrl,
    }));
  }

  /**
   * Get brands for sitemap
   */
  async findForSitemap(baseUrl: string): Promise<{ url: string; lastModified: Date; priority: number }[]> {
    const snapshot = await this.collection
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .where("listing", "==", true)
      .get();

    return snapshot.docs.map(doc => ({
      url: `${baseUrl}/collections/products?brand=${encodeURIComponent(doc.data().name)}`,
      lastModified: new Date(),
      priority: 0.8,
    }));
  }

  /**
   * Get all active brands
   */
  async findAllActive(): Promise<Brand[]> {
    const snapshot = await this.collection
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
  }

  /**
   * Create brand
   */
  async create(id: string, data: Brand): Promise<Brand> {
    await this.collection.doc(id).set({
      ...data,
      id,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await this.collection.doc(id).get();
    return doc.data() as Brand;
  }

  /**
   * Update brand
   */
  async update(id: string, data: Partial<Brand>): Promise<Brand> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await this.collection.doc(id).get();
    return doc.data() as Brand;
  }
}

export const brandRepository = new BrandRepository();
