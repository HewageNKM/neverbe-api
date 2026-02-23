import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  getPendingPurchaseOrders,
} from "@/services/PurchaseOrderService";
import { PurchaseOrderStatus } from "@/model/PurchaseOrder";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_purchase_orders");
    if (!response) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") as PurchaseOrderStatus | null;
    const supplierId = url.searchParams.get("supplierId");
    const pending = url.searchParams.get("pending");

    if (pending === "true") {
      const data = await getPendingPurchaseOrders();
      return NextResponse.json(data);
    }

    const data = await getPurchaseOrders(
      status || undefined,
      supplierId || undefined
    );
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "create_purchase_orders");
    if (!response) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const po = await createPurchaseOrder(body);
    return NextResponse.json(po, { status: 201 });
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
