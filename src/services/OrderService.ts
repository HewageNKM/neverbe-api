import { orderRepository } from "@/repositories/OrderRepository";
import { Order } from "@/model/Order";
import {
  updateOrAddOrderHash,
  validateDocumentIntegrity,
} from "./IntegrityService";
import { AppError } from "@/utils/apiResponse";
import { 
  sendOrderStatusUpdateSMS, 
  sendOrderStatusUpdateEmail 
} from "./NotificationService";
import { toSafeLocaleString } from "./UtilService";

/**
 * OrderService - Business logic for orders
 * Delegates data access to orderRepository
 */

export const getOrders = async (
  page: number = 1,
  size: number = 20,
  startDateStr?: string,
  endDateStr?: string,
  status?: string,
  payment?: string,
  orderId?: string,
  from?: string,
  stockId?: string,
  paymentMethod?: string,
) => {
  try {
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
    }

    const { dataList, total } = await orderRepository.findPaginated({
      page,
      size: (!orderId && !startDateStr && !endDateStr) ? 1000 : size,
      startDate,
      endDate,
      status,
      paymentStatus: payment,
      orderId,
      from,
      stockId,
      paymentMethod
    });

    const ordersWithIntegrity: Order[] = await Promise.all(dataList.map(async (data) => {
      const integrityResult = await validateDocumentIntegrity("orders", (data as any).id);
      return {
        ...data,
        userId: data.userId || null, 
        orderId: (data as any).id,
        integrity: integrityResult,
        customer: data.customer ? { ...data.customer } : null,
      } as unknown as Order;
    }));

    return { dataList: ordersWithIntegrity, total };
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<Order> => {
  const data = await orderRepository.findById(orderId);
  if (!data) throw new AppError(`Order with ID ${orderId} not found`, 404);

  const integrity = await validateDocumentIntegrity("orders", orderId);

  return {
    ...data,
    orderId: orderId,
    integrity: integrity,
    customer: data.customer
      ? {
          ...data.customer,
          updatedAt: data.customer.updatedAt ? toSafeLocaleString(data.customer.updatedAt) : null,
        }
      : null,
    createdAt: toSafeLocaleString(data.createdAt),
    updatedAt: toSafeLocaleString(data.updatedAt),
    restockedAt: data.restockedAt ? toSafeLocaleString(data.restockedAt) : null,
  };
};

export const updateOrder = async (order: Order & { sendNotification?: boolean }, orderId: string) => {
  const existingOrder = await orderRepository.findById(orderId);
  if (!existingOrder) throw new AppError(`Order with ID ${orderId} not found`, 404);

  if (existingOrder.paymentStatus?.toLowerCase() === "refunded") {
    throw new AppError(`Order with ID ${orderId} is already refunded can't proceed with update`, 400);
  }

  const orderUpdate: Partial<Order> = {
    paymentStatus: order.paymentStatus,
    status: order.status,
    ...(order.customer && {
      customer: {
        ...order.customer,
        updatedAt: new Date() as any, // Repository will handle FieldValue if passed, or just use new Date()
      },
    }),
  };

  if (order.trackingNumber !== undefined) orderUpdate.trackingNumber = order.trackingNumber;
  if (order.courier !== undefined) orderUpdate.courier = order.courier;

  await orderRepository.update(orderId, orderUpdate);

  const updatedOrder = await orderRepository.findById(orderId);
  if (!updatedOrder) throw new AppError(`Order with ID ${orderId} not found after update`, 404);

  await updateOrAddOrderHash(updatedOrder);

  // 🔔 Notifications Logic
  const oldStatus = existingOrder.status?.toUpperCase();
  const newStatus = order.status?.toUpperCase();
  if (order.sendNotification === true && newStatus && oldStatus !== newStatus) {
    const triggerStatuses = ["PROCESSING", "COMPLETED", "CANCELLED"];
    if (triggerStatuses.includes(newStatus)) {
      Promise.all([
        sendOrderStatusUpdateSMS(orderId, newStatus),
        sendOrderStatusUpdateEmail(orderId, newStatus)
      ]).catch(err => console.error(`[Order Service] Unified notification failure for ${orderId}:`, err));
    }
  }
};

export const addOrder = async (order: Partial<Order>) => {
  if (!order.from) throw new AppError("Order source (from) is required", 400);
  const fromSource = order.from.toLowerCase();

  if (fromSource === "store") {
    const { createPOSOrder } = await import("./POSService");
    return await createPOSOrder(order, order.userId || "anonymous");
  }

  if (fromSource === "website") {
    const { addWebOrder } = await import("./WebOrderService");
    return await addWebOrder(order);
  }

  if (!order.orderId) throw new AppError("Order ID is required", 400);
  await orderRepository.saveWithRetry(order.orderId, order as Order);
  await updateOrAddOrderHash(order);
};
