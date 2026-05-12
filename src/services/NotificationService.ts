import { Order } from "@/interfaces/Order";
import { OrderItem } from "@/interfaces/BaseItem";
import crypto from "crypto";
import { getOrderByIdForInvoice } from "./WebOrderService";
import { verifyCaptchaToken } from "./CapchaService";
import { notificationRepository } from "@/repositories/NotificationRepository";
import { settingsRepository } from "@/repositories/SettingsRepository";

/**
 * NotificationService - Business logic for multi-channel messaging
 * Delegates data access to notificationRepository
 */

const OTP_EXPIRY_MINUTES = 5;
const OTP_TTL_DAYS = 1;
const COOLDOWN_SECONDS = 60;

const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();
const hashOTP = (otp: string): string => crypto.createHash("sha256").update(otp).digest("hex");
const generateHash = (input: string): string => crypto.createHash("sha256").update(input).digest("hex");

const formatMoney = (amount: number = 0): string => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const calculateTotal = (items: OrderItem[]): number =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

export const sendCODVerificationOTP = async (phone: string, captchaToken: string) => {
  try {
    const TEXT_API_KEY = process.env.TEXT_API_KEY;
    if (!TEXT_API_KEY) throw new Error("Missing TEXT_API_KEY");
    if (!phone || !captchaToken) throw new Error("Missing phone number or CAPTCHA token");

    const captchaResponse = await verifyCaptchaToken(captchaToken);
    if (!captchaResponse) return { success: false, message: "CAPTCHA verification failed." };

    const now = new Date();
    const lastOtp = await notificationRepository.findLatestOTP(phone);

    if (lastOtp) {
      const lastRequestTime = (lastOtp.createdAt as any).toDate?.() || new Date(lastOtp.createdAt);
      const secondsSinceLastRequest = (now.getTime() - lastRequestTime.getTime()) / 1000;

      if (secondsSinceLastRequest < COOLDOWN_SECONDS) {
        return { success: false, message: `Please wait ${Math.ceil(COOLDOWN_SECONDS - secondsSinceLastRequest)} seconds.` };
      }

      const expiresAt = (lastOtp.expiresAt as any).toDate?.() || new Date(lastOtp.expiresAt);
      if (!lastOtp.verified && expiresAt > now) {
        return { success: false, message: "An active OTP already exists." };
      }
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60000);

    await notificationRepository.createOTP({
      phone,
      otpHash,
      createdAt: now,
      expiresAt,
      verified: false,
      attempts: 0,
      ttl: new Date(now.getTime() + OTP_TTL_DAYS * 24 * 60 * 60 * 1000),
    });

    const text = `Your verification code is ${otp}. Valid for 5 minutes.`;
    const response = await fetch("https://api.textit.biz/", {
      method: "POST",
      headers: { Authorization: `Basic ${TEXT_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: phone, text }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return { success: true, message: "OTP sent successfully." };
  } catch (error) {
    console.error(`[OTP Service] Failed to send OTP:`, error);
    return { success: false, message: "Failed to send OTP." };
  }
};

export const verifyCODOTP = async (phone: string, otp: string) => {
  try {
    const lastOtp = await notificationRepository.findLatestOTP(phone);
    if (!lastOtp) return { success: false, message: "No OTP found." };

    const now = new Date();
    const expiresAt = (lastOtp.expiresAt as any).toDate?.() || new Date(lastOtp.expiresAt);
    if (lastOtp.verified) return { success: false, message: "OTP already verified." };
    if (now > expiresAt) return { success: false, message: "OTP expired." };

    if (lastOtp.otpHash !== hashOTP(otp)) {
      const newAttempts = (lastOtp.attempts || 0) + 1;
      await notificationRepository.updateOTP(lastOtp.id, { attempts: newAttempts });
      return { success: false, message: "Invalid OTP." };
    }

    await notificationRepository.updateOTP(lastOtp.id, { verified: true, verifiedAt: now });
    return { success: true, message: "OTP verified successfully." };
  } catch (error) {
    console.error(`[OTP Service] OTP verification failed:`, error);
    return { success: false, message: "OTP verification failed." };
  }
};

export const isOTPVerifiedRecently = async (phone: string): Promise<boolean> => {
  try {
    const cutoffDate = new Date(Date.now() - 15 * 60000);
    const data = await notificationRepository.findRecentVerifiedOTP(phone, cutoffDate);
    return !!data && !data.consumed;
  } catch (error) {
    return false;
  }
};

export const consumeOTPVerification = async (phone: string): Promise<void> => {
  try {
    const lastOtp = await notificationRepository.findLatestOTP(phone);
    if (lastOtp && lastOtp.verified) {
      await notificationRepository.updateOTP(lastOtp.id, { consumed: true, consumedAt: new Date() });
    }
  } catch (error) {
    console.error(`[OTP Service] Error consuming OTP verification:`, error);
  }
};

const processTemplate = (content: string, data: Record<string, any>) => {
  let processed = content;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, data[key] || '');
  });
  return processed;
};

export const renderMultilingualSMS = async (templateId: string, data: Record<string, any>) => {
  try {
    const template = await settingsRepository.getSmsTemplate(templateId);
    if (!template) {
      if (templateId === "ORDER_CONFIRMED") return `NEVERBE: Order #${data.orderId?.toUpperCase()} confirmed.`;
      if (templateId === "STATUS_COMPLETED") return `NEVERBE: Order #${data.orderId?.toUpperCase()} shipped.`;
      return `NEVERBE: Update for order #${data.orderId?.toUpperCase()}.`;
    }

    const parts = [];
    if (template.en) parts.push(processTemplate(template.en, data));
    if (template.si) parts.push(processTemplate(template.si, data));
    if (template.ta) parts.push(processTemplate(template.ta, data));

    let message = parts.join("\n\n");
    if (template.common) {
      const processedCommon = processTemplate(template.common, data);
      if (processedCommon.trim()) message += "\n\n" + processedCommon;
    }
    return message;
  } catch (error) {
    return `NEVERBE: Update for Order #${data.orderId?.toUpperCase()}`;
  }
};

export const sendOrderConfirmedSMS = async (orderId: string) => {
  try {
    const TEXT_API_KEY = process.env.TEXT_API_KEY;
    if (!TEXT_API_KEY) return false;

    const order: Order = await getOrderByIdForInvoice(orderId);
    if (!order?.customer?.phone) return false;

    const phone = order.customer.phone.trim();
    const customerName = order.customer.name.split(" ")[0];
    const text = await renderMultilingualSMS("ORDER_CONFIRMED", { customerName, orderId });
    const hashValue = generateHash(phone + text);

    const exists = await notificationRepository.findSentNotification(orderId, hashValue, "sms");
    if (exists) return false;

    await fetch("https://api.textit.biz/", {
      method: "POST",
      headers: { Authorization: `Basic ${TEXT_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: phone, text }),
    });

    await notificationRepository.logNotification({ orderId, type: "sms", to: phone, hashValue });
    return true;
  } catch (error) {
    return false;
  }
};

export const sendeBillSMS = async (orderId: string, phone: string) => {
  try {
    const TEXT_API_KEY = process.env.TEXT_API_KEY;
    if (!TEXT_API_KEY || !phone || !orderId) return false;

    const cleanPhone = phone.trim();
    const ebillUrl = `https://neverbe.lk/ebill/${orderId}`;
    const text = await renderMultilingualSMS("EBILL_SENT", { ebillUrl, orderId });
    const hashValue = generateHash(cleanPhone + "EBILL" + orderId);

    const exists = await notificationRepository.findSentNotification(orderId, hashValue, "ebill_sms");
    if (exists) return false;

    await fetch("https://api.textit.biz/", {
      method: "POST",
      headers: { Authorization: `Basic ${TEXT_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: cleanPhone, text }),
    });

    await notificationRepository.logNotification({ orderId, type: "ebill_sms", to: cleanPhone, hashValue });
    return true;
  } catch (error) {
    return false;
  }
};

export const sendOrderConfirmedEmail = async (orderId: string) => {
  try {
    if (!orderId) return false;
    const order: Order = await getOrderByIdForInvoice(orderId);
    const email = order?.customer?.email?.trim();
    if (!email) return false;

    const hashValue = generateHash(email + "ORDER_CONFIRMATION" + orderId);
    const exists = await notificationRepository.findSentNotification(orderId, hashValue, "email");
    if (exists) return false;

    const safeItems = Array.isArray(order.items) ? order.items : [];
    const subtotalRaw = safeItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
    const totalRaw = (order as any).total || 0;
    const shippingRaw = order.shippingFee || 0;
    const itemDiscountsRaw = safeItems.reduce((acc, item) => acc + (item.discount || 0), 0);
    const promotionDiscountRaw = (order as any).promotionDiscount || 0;
    const discountRaw = (order.discount || 0) + promotionDiscountRaw + itemDiscountsRaw;

    const emailPayload = {
      to: [email],
      template: {
        name: "order_confirmation",
        data: {
          customerName: order.customer?.name || "Customer",
          orderId: (order.orderId || orderId).toUpperCase(),
          items: safeItems.map((item) => {
            const netPrice = (item.price || 0) - (item.discount || 0);
            return {
              name: item.name || "Unknown Item",
              variantName: item.variantName || "",
              size: item.size || "-",
              quantity: item.quantity || 1,
              thumbnail: item.thumbnail || "https://placehold.co/100x100?text=No+Img",
              formattedPrice: formatMoney(netPrice),
              originalPrice: (item.discount || 0) > 0 ? formatMoney(item.price || 0) : null,
            };
          }),
          customer: {
            address: order.customer?.address || "N/A",
            city: order.customer?.city || "",
            phone: order.customer?.phone || "",
            shippingAddress: { line1: order.customer?.address || "N/A", city: order.customer?.city || "", postalCode: "", country: "Sri Lanka" },
          },
          paymentMethod: order.paymentMethod || "N/A",
          paymentStatus: order.paymentStatus || "Pending",
          subtotal: formatMoney(subtotalRaw),
          shippingFee: formatMoney(shippingRaw),
          discount: discountRaw > 0 ? formatMoney(discountRaw) : null,
          total: formatMoney(totalRaw),
        },
      },
    };

    await notificationRepository.queueEmail(emailPayload);
    await notificationRepository.logNotification({ orderId, type: "email", to: email, hashValue });
    return true;
  } catch (error) {
    return false;
  }
};

export const createAdminNotification = async (
  type: string,
  title: string,
  message: string,
  metadata: Record<string, any> = {}
) => {
  try {
    const docId = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const notification = { type, title, message, metadata, read: false, createdAt: new Date() };
    await notificationRepository.createAdminNotification(docId, notification);
    
    const payload = {
      topic: "admin_alerts",
      notification: { title, body: message },
      data: { ...metadata },
      webpush: { fcmOptions: { link: metadata.orderId ? `/orders/${metadata.orderId}` : "/dashboard" } }
    };

    const { getMessaging } = await import("firebase-admin/messaging");
    await getMessaging().send(payload);
    return true;
  } catch (error) {
    return false;
  }
};

export const subscribeToAdminAlerts = async (token: string) => {
  try {
    const { getMessaging } = await import("firebase-admin/messaging");
    await getMessaging().subscribeToTopic([token], "admin_alerts");
    return true;
  } catch (error) {
    return false;
  }
};

export const sendOrderStatusUpdateSMS = async (orderId: string, status: string) => {
  try {
    const TEXT_API_KEY = process.env.TEXT_API_KEY;
    if (!TEXT_API_KEY) return false;

    const order: Order = await getOrderByIdForInvoice(orderId);
    if (!order?.customer?.phone) return false;

    const phone = order.customer.phone.trim();
    const name = order.customer.name.split(" ")[0];
    let text = "";
    const s = status.toUpperCase();

    if (s === "COMPLETED") {
      const trackingInfo = order.trackingNumber ? ` Track your package: ${order.trackingNumber}${order.courier ? ` via ${order.courier}` : ""}` : "";
      text = await renderMultilingualSMS("STATUS_COMPLETED", { name, orderId, trackingInfo });
    } else if (s === "CANCELLED") {
      text = await renderMultilingualSMS("STATUS_CANCELLED", { name, orderId });
    } else {
      text = await renderMultilingualSMS("STATUS_UPDATE", { name, orderId, status });
    }

    const hashValue = generateHash(phone + text + "STATUS_UPDATE");
    const exists = await notificationRepository.findSentNotification(orderId, hashValue, "sms_status");
    if (exists) return false;

    await fetch("https://api.textit.biz/", {
      method: "POST",
      headers: { Authorization: `Basic ${TEXT_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: phone, text }),
    });

    await notificationRepository.logNotification({ orderId, type: "sms_status", to: phone, content: text, status: s, hashValue });
    return true;
  } catch (error) {
    return false;
  }
};

export const sendOrderStatusUpdateEmail = async (orderId: string, status: string) => {
  try {
    const order: Order = await getOrderByIdForInvoice(orderId);
    const email = order?.customer?.email?.trim();
    if (!email) return false;

    const name = order.customer.name || "Customer";
    const s = status.toUpperCase();
    let subject = `Order Update: #${orderId.toUpperCase()}`;
    let message = `Your order status has been updated.`;

    if (s === "COMPLETED") {
      subject = `Order Completed & Shipped: #${orderId.toUpperCase()}`;
      const tracking = order.trackingNumber ? `<p>Your order has been shipped via <strong>${order.courier || "our courier partner"}</strong>. Tracking Number: <strong>${order.trackingNumber}</strong></p>` : "";
      message = `Great news! Your order is now complete and has been shipped. ${tracking} Thank you for choosing NEVERBE!`;
    } else if (s === "CANCELLED") {
      subject = `Order Cancelled: #${orderId.toUpperCase()}`;
      message = `Your order has been cancelled. If this was a mistake, please reach out to us.`;
    }

    const emailPayload = {
      to: [email],
      message: {
        subject,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #16a34a;">Order Update</h2>
            <p>Hi ${name},</p>
            <p>${message}</p>
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
              <strong>Order ID:</strong> ${orderId.toUpperCase()}<br/>
              <strong>Current Status:</strong> ${s}
            </div>
          </div>
        `,
      },
    };

    await notificationRepository.queueEmail(emailPayload);
    await notificationRepository.logNotification({ orderId, type: "email_status", to: email, status: s });
    return true;
  } catch (error) {
    return false;
  }
};

export const sendManualNotification = async (
  orderId: string | null,
  type: "sms" | "email",
  content: string,
  subject?: string,
  toOverride?: string
) => {
  try {
    let to = toOverride;
    if (orderId && !to) {
      const order: Order = await getOrderByIdForInvoice(orderId);
      if (!order) return false;
      to = type === "sms" ? order.customer?.phone?.trim() : order.customer?.email?.trim();
    }
    if (!to) return false;

    if (type === "sms") {
      const TEXT_API_KEY = process.env.TEXT_API_KEY;
      if (!TEXT_API_KEY) return false;
      await fetch("https://api.textit.biz/", {
        method: "POST",
        headers: { Authorization: `Basic ${TEXT_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to, text: content }),
      });
    } else {
      await notificationRepository.queueEmail({
        to: [to],
        message: {
          subject: subject || `Update regarding your order #${orderId?.toUpperCase() || 'NEVERBE'}`,
          html: `<div style="font-family: sans-serif; padding: 20px;">${content.replace(/\n/g, '<br/>')}</div>`,
        },
      });
    }

    await notificationRepository.logNotification({ orderId: orderId || "CUSTOM", type: `manual_${type}`, to, content });
    return true;
  } catch (error) {
    return false;
  }
};

export const getNotificationLogs = async (orderId: string) => {
  const logs = await notificationRepository.findLogsForOrder(orderId);
  return logs.map(data => {
    let timestamp = data.createdAt;
    if (timestamp?.toDate) timestamp = timestamp.toDate().getTime();
    else if (timestamp?.seconds) timestamp = timestamp.seconds * 1000;
    return { ...data, createdAt: timestamp || 0 };
  }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

export const getAllNotificationLogs = async (page: number = 1, pageSize: number = 20, search?: string) => {
  const { logs, total } = await notificationRepository.findAllLogs({ page, pageSize, search });
  const formattedLogs = logs.map(data => {
    let timestamp = data.createdAt;
    if (timestamp?.toDate) timestamp = timestamp.toDate().getTime();
    else if (timestamp?.seconds) timestamp = timestamp.seconds * 1000;
    return { ...data, createdAt: timestamp };
  });
  return { logs: formattedLogs, total };
};
