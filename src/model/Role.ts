import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface Role {
  id: string; // e.g., 'manager', 'editor' (document ID)
  name: string; // e.g., 'Manager', 'Content Editor'
  permissions: string[]; // List of permission keys, e.g., 'manage_users'

  description?: string;
  isSystem?: boolean; // If true, cannot be deleted (e.g. ADMIN if we store it)

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface Permission {
  key: string;
  label: string;
  group: string; // e.g., 'User Management', 'Finance'
}
