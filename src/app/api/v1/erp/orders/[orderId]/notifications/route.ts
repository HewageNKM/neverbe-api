import { NextRequest, NextResponse } from "next/server";
import { getNotificationLogs, sendManualNotification } from "@/services/NotificationService";
import { requirePermission, handleAuthError } from "@/services/AuthService";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) => {
  try {
    await requirePermission(req, "view_communications");

    const orderId = (await context.params).orderId;
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    const logs = await getNotificationLogs(orderId);
    return NextResponse.json({ success: true, data: logs, message: "Notification logs retrieved successfully" });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) => {
  try {
    await requirePermission(req, "send_custom_notifications");

    const orderId = (await context.params).orderId;
    const body = await req.json();
    const { type, content, subject } = body;

    if (!orderId || !type || !content) {
      return NextResponse.json({ success: false, message: "Missing required fields (orderId, type, content)" }, { status: 400 });
    }

    if (type !== "sms" && type !== "email") {
      return NextResponse.json({ success: false, message: "Invalid notification type. Must be 'sms' or 'email'" }, { status: 400 });
    }

    const result = await sendManualNotification(orderId, type, content, subject);

    if (result) {
      return NextResponse.json({ success: true, message: "Notification sent successfully" });
    } else {
      return NextResponse.json({ success: false, message: "Failed to send notification. Check logs for details." }, { status: 500 });
    }
  } catch (error: any) {
    return handleAuthError(error);
  }
};
