/**
 * Central barrel export for all interfaces
 * Import from "@/interfaces" to access any interface
 */

// Core entities
export * from "./Product";
export * from "./ProductVariant";
export * from "./Img";
export * from "./InventoryItem";

// Legacy entities (for backwards compatibility)
export * from "./Item";
export * from "./Variant";
export * from "./Size";

// Promotions & Campaigns
export * from "./Promotion";
export * from "./Coupon";
export * from "./ComboProduct";

// Orders & Commerce
export * from "./Order";
export * from "./Customer";
export * from "./BagItem";
export * from "./BaseItem";
export * from "./PaymentMethod";

// User & Auth
export * from "./SerializableUser";
export * from "./Message";
export * from "./Review";

// Navigation & UI
export * from "./Type";
export * from "./Slide";
export * from "./FooterLink";
