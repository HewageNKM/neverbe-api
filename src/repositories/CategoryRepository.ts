import { BaseRepository } from "./BaseRepository";
import { Category } from "@/model/Category";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Category Repository - handles category data access
 */
export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super("categories");
  }

  /**
   * Find paginated categories with filters
   */
  async findPaginated(options: {
    page?: number;
    size?: number;
    search?: string;
    status?: "active" | "inactive" | null;
  }): Promise<{ dataList: Category[]; total: number }> {
    const { page = 1, size = 10, search = "", status } = options;
    
    let query = this.getActiveQuery();

    if (status === "active") query = query.where("active", "==", true);
    if (status === "inactive") query = query.where("active", "==", false);

    if (search.trim()) {
      const s = search.trim();
      query = query.where("name", ">=", s).where("name", "<=", s + "\uf8ff");
    }

    const total = await this.countDocuments(query);
    const snapshot = await query
      .offset((page - 1) * size)
      .limit(size)
      .get();

    const dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    return { dataList, total };
  }

  /**
   * Get featured categories with random fallback
   */
  async findFeatured(): Promise<Category[]> {
    const featuredSnapshot = await this.getActiveQuery()
      .where("active", "==", true)
      .where("isFeatured", "==", true)
      .get();

    if (!featuredSnapshot.empty) {
      return featuredSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    }

    // Fallback: 8 random active categories
    const allActiveSnapshot = await this.getActiveQuery()
      .where("active", "==", true)
      .get();
      
    const allActive = allActiveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    return allActive.sort(() => Math.random() - 0.5).slice(0, 8);
  }

  /**
   * Get categories for dropdown
   */
  async findForDropdown(): Promise<{ id: string; label: string }[]> {
    const snapshot = await this.getActiveQuery()
      .where("active", "==", true)
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      label: doc.data().name,
    }));
  }

  /**
   * Create category
   */
  async create(id: string, data: Category): Promise<Category> {
    await this.collection.doc(id).set({
      ...data,
      id,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await this.collection.doc(id).get();
    return doc.data() as Category;
  }

  /**
   * Update category
   */
  async update(id: string, data: Partial<Category>, tx?: FirebaseFirestore.Transaction | FirebaseFirestore.WriteBatch): Promise<void> {
    const docRef = this.collection.doc(id);
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (tx) {
      (tx as any).update(docRef, updateData);
    } else {
      await docRef.update(updateData);
    }
  }
  /**
   * Get categories for sitemap
   */
  async findForSitemap(baseUrl: string): Promise<{ url: string; lastModified: Date; priority: number }[]> {
    const snapshot = await this.collection
      .where("active", "==", true)
      .where("isDeleted", "==", false)
      .get();

    return snapshot.docs.map(doc => ({
      url: `${baseUrl}/collections/products?category=${encodeURIComponent(doc.data().name)}`,
      lastModified: new Date(),
      priority: 0.8,
    }));
  }

  /**
   * Get all active categories
   */
  async findAllActive(): Promise<Category[]> {
    const snapshot = await this.collection
      .where("active", "==", true)
      .where("isDeleted", "==", false)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  }
}

export const categoryRepository = new CategoryRepository();
