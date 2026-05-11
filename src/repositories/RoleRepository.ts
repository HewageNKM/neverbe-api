import { BaseRepository } from "./BaseRepository";
import { Role } from "@/model/Role";
import admin from "firebase-admin";

/**
 * Role Repository - handles role data access
 */
export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super("roles");
  }

  /**
   * Get all roles
   */
  async findAllRoles(): Promise<Role[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => doc.data() as Role);
  }

  /**
   * Create role
   */
  async create(id: string, data: Omit<Role, "createdAt" | "updatedAt">): Promise<string> {
    const newRole: Role = {
      ...data,
      id,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };
    await this.collection.doc(id).set(newRole);
    return id;
  }

  /**
   * Update role
   */
  async update(id: string, updates: Partial<Role>): Promise<void> {
    await this.collection.doc(id).update({
      ...updates,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  /**
   * Delete role
   */
  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}

export const roleRepository = new RoleRepository();
