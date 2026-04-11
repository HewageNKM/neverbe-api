import { adminFirestore } from "@/firebase/firebaseAdmin";
import { authorizeRequest } from "@/services/AuthService";
import { sendManualNotification } from "@/services/NotificationService";
import { errorResponse, successResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";

const NOTIFICATION_TRACKER = "notifications_sent";

/**
 * GET: Fetch notification history for a specific order
 */
export const GET = async (
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) => {
  try {
    const isAuthorized = await authorizeRequest(req, "view_orders");
    if (!isAuthorized) return errorResponse("Unauthorized", 401);

    const { orderId } = await params;

    const snapshot = await adminFirestore
      .collection(NOTIFICATION_TRACKER)
      .where("orderId", "==", orderId)
      .orderBy("createdAt", "desc")
      .get();

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(history);
  } catch (error: any) {
    return errorResponse(error);
  }
};

/**
 * POST: Send a manual notification (SMS or Email) to the customer
 */
export const POST = async (
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) => {
  try {
    const isAuthorized = await authorizeRequest(req, "update_orders");
    if (!isAuthorized) return errorResponse("Unauthorized", 401);

    const { orderId } = await params;
    const body = await req.json();
    const { type, content, subject } = body;

    if (!type || !content) {
      return errorResponse("Type (sms/email) and content are required", 400);
    }

    const result = await sendManualNotification(orderId, type as "sms" | "email", content, subject);

    if (result) {
      return successResponse(null, `Manual ${type.toUpperCase()} sent successfully`);
    } else {
      return errorResponse(`Failed to send ${type.toUpperCase()}`, 500);
    }
  } catch (error: any) {
    return errorResponse(error);
  }
};
