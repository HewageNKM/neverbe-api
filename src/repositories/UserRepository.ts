import { BaseRepository } from "./BaseRepository";
import { User } from "@/model/User";
import admin from "firebase-admin";

/**
 * User Repository - handles user metadata in Firestore
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super("users");
  }

  /**
   * Get users with filters
   */
  async findUsers(filters: {
    status?: string;
    role?: string;
    limit: number;
    offset: number;
  }): Promise<User[]> {
    let query: admin.firestore.Query = this.collection;

    if (filters.status && filters.status !== "all") {
      query = query.where("status", "==", filters.status === "active");
    }

    if (filters.role && filters.role !== "all") {
      query = query.where("role", "==", filters.role.toUpperCase());
    }

    const snapshot = await query.limit(filters.limit).offset(filters.offset).get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toLocaleString() || "",
        updatedAt: data.updatedAt?.toDate?.()?.toLocaleString() || "",
      } as User;
    });
  }

  /**
   * Get total count of users in Firestore
   */
  async countUsers(): Promise<number> {
    return await this.countDocuments(this.collection);
  }

  /**
   * Get user addresses
   */
  async getUserAddresses(
    uid: string,
    decryptFn: (data: string, key: string) => string
  ): Promise<any[]> {
    const snapshot = await this.collection.doc(uid).collection("addresses").get();

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
    const docRef = this.collection.doc(uid).collection("addresses").doc(type);

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

export const userRepository = new UserRepository();
