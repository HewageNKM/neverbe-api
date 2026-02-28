import { Timestamp } from "@firebase/firestore";
import { Customer } from "./Customer";
import { OrderItem } from "./BaseItem";

export interface Order {
  orderId: string | null;
  paymentId: string;
  items: OrderItem[];
  paymentStatus: string;
  paymentMethod: string;
  paymentMethodId?: string;
  customer: Customer;
  status: string;
  discount: number;
  fee?: number;
  shippingFee?: number;
  transactionFeeCharge?: number;
  total?: number;
  from: string;
  userId?: string;

  couponCode?: string;
  couponDiscount?: number;
  promotionDiscount?: number;
  appliedPromotionId?: string;
  appliedPromotionIds?: string[]; // All stacked promotion IDs

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
