import { orderRepository } from "@/repositories/OrderRepository";
import {
  sendOrderConfirmedEmail,
  sendOrderConfirmedSMS,
} from "./NotificationService";
import { updateOrAddOrderHash } from "./IntegrityService";

/**
 * OrderService - Thin wrapper over OrderRepository
 * Delegates data access to repository layer
 */

/**
 * Fetch an order by ID for invoice purposes
 */
export const getOrderByIdForInvoice = async (orderId: string) => {
  const order = await orderRepository.findByOrderId(orderId);
  if (!order) throw new Error(`Order ${orderId} not found.`);
  return order;
};

/**
 * Update payment status and handle post-payment actions
 */
export const updatePayment = async (
  orderId: string,
  paymentId: string,
  status: string
) => {
  // Find document ID by orderId
  const docId = await orderRepository.findDocIdByOrderId(orderId);
  if (!docId) throw new Error(`Order ${orderId} not found.`);

  // Update payment status
  const orderData = await orderRepository.updatePaymentStatus(
    docId,
    paymentId,
    status
  );

  // Post-payment actions
  if (status.toLowerCase() === "paid") {
    await sendOrderConfirmedSMS(orderId);
    await sendOrderConfirmedEmail(orderId);
  }

  await updateOrAddOrderHash(orderData);
};
