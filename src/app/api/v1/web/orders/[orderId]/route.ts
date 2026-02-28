import { verifyToken } from "@/services/WebAuthService";
import { getOrderByIdForInvoice } from "@/services/WebOrderService";

export const GET = async (req: Request, context: { params: Promise<{ orderId: string }> }) => {
  try {
    console.log("[Invoice API] Incoming request");

    const { orderId } = await context.params;
    console.log("[Invoice API] Order ID from params:", orderId);

    // Verify user token
    const tokenData = await verifyToken(req);
    console.log("[Invoice API] Token verified:", tokenData?.uid);

    // Fetch order for invoice
    const order = await getOrderByIdForInvoice(orderId);
    console.log("[Invoice API] Fetched order for invoice:", order?.id || "No order found");

    return new Response(JSON.stringify(order), { status: 200 });
  } catch (e: any) {
    console.error("[Invoice API] Error:", e.message, e.stack);
    return new Response(`Unauthorized ${e.message}`, { status: 401 });
  }
};
