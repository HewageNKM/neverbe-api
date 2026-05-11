import { NextResponse } from "next/server";
import { subscribeToAdminAlerts } from "@/services/NotificationService";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { successResponse } from "@/utils/apiResponse";

/**
 * POST: Subscribe a device token to admin alerts topic
 */
export async function POST(req: Request) {
  try {
    await requirePermission(req, "view_communications");

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ success: false, message: "Missing FCM token" }, { status: 400 });
    }

    const result = await subscribeToAdminAlerts(token);
    if (result) {
      return successResponse(null, "Subscribed to admin alerts successfully");
    } else {
      return NextResponse.json({ success: false, message: "Failed to subscribe token" }, { status: 500 });
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
