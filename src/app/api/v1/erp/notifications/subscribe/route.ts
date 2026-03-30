import { NextResponse } from "next/server";
import { subscribeToAdminAlerts } from "@/services/NotificationService";
import { authorizeRequest } from "@/services/AuthService";
import { errorResponse, successResponse } from "@/utils/apiResponse";

/**
 * POST: Subscribe a device token to admin alerts topic
 */
export async function POST(req: Request) {
  try {
    const isAuthorized = await authorizeRequest(req);
    if (!isAuthorized) return errorResponse("Unauthorized", 401);

    const { token } = await req.json();
    if (!token) return errorResponse("Missing FCM token", 400);

    const result = await subscribeToAdminAlerts(token);
    if (result) {
      return successResponse(null, "Subscribed to admin alerts successfully");
    } else {
      return errorResponse("Failed to subscribe token", 500);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
