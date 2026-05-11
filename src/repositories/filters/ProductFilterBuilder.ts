import { FirestoreQueryBuilder } from "../utils/FirestoreQueryBuilder";
import type { ProductFilterOptions } from "../ProductRepository";

/**
 * ProductFilterBuilder
 * Encapsulates the specific "Smart Filtering" logic for Products.
 * Decides whether to filter in DB or memory based on current filter combinations.
 */
export class ProductFilterBuilder {
  private builder: FirestoreQueryBuilder;
  private options: ProductFilterOptions;

  constructor(builder: FirestoreQueryBuilder, options: ProductFilterOptions) {
    this.builder = builder;
    this.options = options;
  }

  /**
   * Apply all optimized DB filters
   */
  applyOptimizedFilters(): ProductFilterBuilder {
    const { tags = [], gender, inStock, category, brand, orderBy, orderDirection } =
      this.options;

    // 1. Unified Search Tags (Case-Insensitive)
    // Merge category, brand and gender into tags for broader discovery
    const searchTags = [...tags];
    if (category) searchTags.push(category.toLowerCase());
    if (brand) searchTags.push(brand.toLowerCase());
    if (gender) searchTags.push(gender.toLowerCase());

    // Firestore allows only ONE array-contains/any clause.
    if (searchTags.length > 0) {
      // Use array-contains if single, array-contains-any if multiple
      if (searchTags.length === 1) {
        this.builder.where("tags", "array-contains", searchTags[0]);
      } else {
        // Limit to 10 for Firestore constraints
        this.builder.where("tags", "array-contains-any", searchTags.slice(0, 10));
      }
    }

    // 2. Stock Logic
    if (typeof inStock === "boolean") {
      this.builder.where("inStock", "==", inStock);
    }

    // 3. Sorting
    if (orderBy) {
      this.builder.orderBy(orderBy, orderDirection || "asc");
    }

    return this;
  }

  /**
   * Apply Discount filter (Special case)
   */
  applyDiscountFilter(): ProductFilterBuilder {
    this.builder.where("discount", ">", 0);
    return this;
  }

  /**
   * Check if post-fetching filtering is required for Gender
   */
  needsGenderPostFilter(): boolean {
    const { tags, gender, category, brand } = this.options;
    // If we have gender AND any other tag-based filter, we need post-filtering
    // because Firestore only allows one array-contains-any and we merged them (OR logic).
    const hasOtherTags = (tags && tags.length > 0) || !!category || !!brand;
    return !!(gender && hasOtherTags);
  }

  /**
   * Check if post-fetching filtering is required for Sizes
   */
  needsSizePostFilter(): boolean {
    const { sizes } = this.options;
    return !!(sizes && sizes.length > 0);
  }
}
