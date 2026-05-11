import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getAllNotificationLogs, sendManualNotification } from "@/services/NotificationService";
import { apiResponse } from "@/utils/apiResponse";

/**
 * GET: Fetch all customer communication logs
 */
export async function GET(req: Request) {
  try {
    await requirePermission(req, "view_communications");

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    // Support both 'pageSize' and 'limit'
    const limitParam = url.searchParams.get("limit");
    const pageSizeParam = url.searchParams.get("pageSize");
    const pageSize = parseInt(pageSizeParam || limitParam || "20", 10);
    const search = url.searchParams.get("search") || "";

    const { logs, total } = await getAllNotificationLogs(page, pageSize, search);

    return NextResponse.json({ success: true, data: logs, total });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST: Send a custom communication (SMS/Email)
 */
export async function POST(req: Request) {
  try {
    await requirePermission(req, "send_custom_notifications");

    const body = await req.json();
    const { type, to, content, subject, orderId } = body;

    if (!type || !to || !content) {
      return NextResponse.json({ success: false, message: "Missing required fields: type, to, content" }, { status: 400 });
    }

    const result = await sendManualNotification(orderId || null, type, content, subject, to);

    if (result) {
      return apiResponse(null, "Notification sent successfully");
    } else {
      return NextResponse.json({ success: false, message: "Failed to send notification. Check logs for details." }, { status: 500 });
    }
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export const dynamic = "force-dynamic";
