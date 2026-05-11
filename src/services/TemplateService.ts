import { notificationRepository } from "@/repositories/NotificationRepository";
import { AppError } from "@/utils/apiResponse";

/**
 * TemplateService - Business logic for SMS templates
 * Delegates data access to notificationRepository
 */

export const getSMSTemplates = async () => {
  const templates = await notificationRepository.findAllTemplates();
  
  if (templates.length === 0) {
    const defaults = [
      {
        id: "ORDER_CONFIRMED",
        name: "Order Confirmation",
        en: "NEVERBE: Got it, {{customerName}}. Order #{{orderId}} is confirmed.",
        si: "NEVERBE: ස්තූතියි, {{customerName}}. ඔබගේ ඇණවුම #{{orderId}} තහවුරු කරන ලදී.",
        ta: "NEVERBE: நன்றி, {{customerName}}. உங்கள் ஆர்டர் #{{orderId}} உறுதிப்படுத்தப்பட்டது.",
        variables: ["customerName", "orderId"]
      },
      {
        id: "STATUS_COMPLETED",
        name: "Order Shipped (Completed)",
        en: "NEVERBE: Great news {{name}}! Your order #{{orderId}} is completed & shipped.",
        si: "NEVERBE: සුභ ආරංචියක් {{name}}! ඔබගේ ඇණවුම #{{orderId}} දැන් සම්පූර්ණ කර එවා ඇත.",
        ta: "NEVERBE: நற்செய்தி {{name}}! உங்கள் ஆர்டர் #{{orderId}} முடிக்கப்பட்டு அனுப்பப்பட்டது.",
        common: "{{trackingInfo}}",
        variables: ["name", "orderId", "trackingInfo"]
      },
      {
        id: "STATUS_CANCELLED",
        name: "Order Cancelled",
        en: "NEVERBE: Hi {{name}}, your order #{{orderId}} has been cancelled. Please contact us for details.",
        si: "NEVERBE: ආයුබෝවන් {{name}}, ඔබගේ ඇණවුම #{{orderId}} අවලංගු කර ඇත. විස්තර සඳහා අප අමතන්න.",
        ta: "NEVERBE: வணக்கம் {{name}}, உங்கள் ஆர்டர் #{{orderId}} ரத்து செய்யப்பட்டுள்ளது. விவரங்களுக்கு எங்களைத் தொடர்பு கொள்ளவும்.",
        variables: ["name", "orderId"]
      },
      {
        id: "STATUS_UPDATE",
        name: "General Status Update",
        en: "NEVERBE: Hi {{name}}, your order #{{orderId}} status has been updated to {{status}}.",
        si: "NEVERBE: ආයුබෝවන් {{name}}, ඔබගේ ඇණවුමේ #{{orderId}} තත්වය {{status}} ලෙස යාවත්කාලීන කර ඇත.",
        ta: "NEVERBE: வணக்கம் {{name}}, உங்கள் ஆர்டர் #{{orderId}} நிலை {{status}} என மாற்றப்பட்டுள்ளது.",
        variables: ["name", "orderId", "status"]
      },
      {
        id: "EBILL_SENT",
        name: "POS eBill SMS",
        en: "NEVERBE: Thank you for your purchase!",
        si: "NEVERBE: ඔබගේ මිලදී ගැනීමට ස්තූතියි!",
        ta: "உங்கள் கொள்முதலுக்கு நன்றி!",
        common: "View & download your eBill here: {{ebillUrl}}",
        variables: ["ebillUrl"]
      }
    ];

    await notificationRepository.seedTemplates(defaults);
    return { data: defaults };
  }

  return { data: templates };
};

export const updateSMSTemplate = async (id: string, data: any) => {
  const template = await notificationRepository.getSmsTemplate(id);
  if (!template) throw new AppError("Template not found", 404);
  await notificationRepository.updateTemplate(id, data);
  return { success: true };
};
