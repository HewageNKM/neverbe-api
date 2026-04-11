import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getAllNotificationLogs } from "@/services/NotificationService";
import { errorResponse } from "@/utils/apiResponse";

/**
 * GET: Fetch all customer communication logs
 */
export async function GET(req: Request) {
  try {
    const isAuthorized = await authorizeRequest(req);
    if (!isAuthorized) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const logs = await getAllNotificationLogs(limit);

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("[Communications API] GET Error:", error);
    return errorResponse(error);
  }
}

export const dynamic = "force-dynamic";
