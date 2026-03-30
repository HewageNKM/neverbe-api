import { NextResponse } from "next/server";
import { adminFirestore } from "@/firebase/firebaseAdmin";
import { authorizeRequest } from "@/services/AuthService";
import { errorResponse, successResponse } from "@/utils/apiResponse";

/**
 * GET: Fetch recent notifications for ERP
 */
export async function GET(req: Request) {
  try {
    const isAuthorized = await authorizeRequest(req);
    if (!isAuthorized) return errorResponse("Unauthorized", 401);

    const snapshot = await adminFirestore
      .collection("erp_notifications")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(notifications);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PATCH: Mark all as read or a specific one
 */
export async function PATCH(req: Request) {
  try {
    const isAuthorized = await authorizeRequest(req);
    if (!isAuthorized) return errorResponse("Unauthorized", 401);

    const { id, all } = await req.json();

    if (all) {
      const unread = await adminFirestore
        .collection("erp_notifications")
        .where("read", "==", false)
        .get();
      
      const batch = adminFirestore.batch();
      unread.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
      return successResponse(null, "All notifications marked as read");
    }

    if (id) {
      await adminFirestore.collection("erp_notifications").doc(id).update({ read: true });
      return successResponse(null, "Notification marked as read");
    }

    return errorResponse("Missing ID or 'all' flag", 400);
  } catch (error) {
    return errorResponse(error);
  }
}
