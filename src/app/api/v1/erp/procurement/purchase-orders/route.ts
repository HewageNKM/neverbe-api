import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  getPendingPurchaseOrders,
} from "@/services/PurchaseOrderService";
import { PurchaseOrderStatus } from "@/model/PurchaseOrder";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_purchase_orders");

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
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "create_purchase_orders");

    const formData = await req.formData();
    const data = formData.get("data");

    if (!data) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const body = JSON.parse(data as string);
    const po = await createPurchaseOrder(body);
    return NextResponse.json(po, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
