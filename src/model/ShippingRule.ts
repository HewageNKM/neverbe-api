import { Timestamp } from "firebase-admin/firestore";

export interface ShippingRule {
  id: string;
  name: string;
  minWeight: number; // in kg (inclusive)
  maxWeight: number; // in kg (exclusive or inclusive depending on logic, let's say < maxWeight)
  rate: number; // Cost in LKR (Base Rate if incremental)
  isActive: boolean;
  // Incremental Logic Fields
  isIncremental?: boolean; // If true, apply formula: rate + ((weight - baseWeight) * perKgRate)
  baseWeight?: number; // The weight limit covered by the base rate (e.g. 1kg)
  perKgRate?: number; // The cost added per extra kg (e.g. 80)
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}
