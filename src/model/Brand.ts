export interface Brand {
  /** Unique short ID (generated via nanoid) */
  id: string;

  /** Display name of the brand */
  name: string;

  /** Optional description of the brand */
  description?: string;

  /** Whether this brand is currently active */
  status: boolean;

  /** Public image URL of the brand logo (from Firebase Storage) */
  logoUrl?: string;

  /** Soft delete flag */
  isDeleted: boolean;

  /** Date/time when the brand was created */
  createdAt: Date | string;

  /** Date/time when the brand was last updated */
  updatedAt: Date | string;
}
