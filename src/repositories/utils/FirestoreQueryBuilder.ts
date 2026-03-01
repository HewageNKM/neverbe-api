import type { Query } from "firebase-admin/firestore";

/**
 * FirestoreQueryBuilder
 * A fluent interface for building Firestore queries cleanly.
 */
export class FirestoreQueryBuilder {
  private query: Query;

  constructor(initialQuery: Query) {
    this.query = initialQuery;
  }

  /**
   * Add a where clause
   */
  where(
    field: string,
    op: FirebaseFirestore.WhereFilterOp,
    value: any
  ): FirestoreQueryBuilder {
    // Skip if value is undefined/null (optional filter support)
    if (value === undefined || value === null) return this;

    // Also skip empty arrays for 'in' or 'array-contains-any' to prevent Firestore errors
    if (Array.isArray(value) && value.length === 0) {
      // Ideally this should maybe return a "never match" query, but usually we just skip
      // For strict correctness with 'in' queries, empty list = no results.
      // But often UI sends empty list meaning "no filter selected".
      // We'll treat it as "no filter selected" (skip).
      return this;
    }

    this.query = this.query.where(field, op, value);
    return this;
  }

  /**
   * Add sorting
   */
  orderBy(
    field: string,
    direction: "asc" | "desc" = "asc"
  ): FirestoreQueryBuilder {
    this.query = this.query.orderBy(field, direction);
    return this;
  }

  /**
   * Apply standard pagination
   */
  paginate(page: number, size: number): FirestoreQueryBuilder {
    const offset = Math.max(0, (page - 1) * size);
    this.query = this.query.offset(offset).limit(size);
    return this;
  }

  /**
   * Set a raw limit
   */
  limit(limit: number): FirestoreQueryBuilder {
    this.query = this.query.limit(limit);
    return this;
  }

  /**
   * Return the built query
   */
  build(): Query {
    return this.query;
  }
}
