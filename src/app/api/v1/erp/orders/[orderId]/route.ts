import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getOrder, updateOrder } from "@/services/OrderService";
import { NextResponse } from "next/server";

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) => {
  try {
    await requirePermission(req, "update_orders");

    const { orderId } = await params;
    const formData = await req.formData();
    const data = formData.get("data");

    if (!data) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const body = JSON.parse(data as string);

    if (!body.paymentStatus || !body.status) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }
    const id = orderId;
    await updateOrder(body, id);

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error: any) {
    return handleAuthError(error);
  }
};
export const GET = async (
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) => {
  try {
    await requirePermission(req, "view_orders");

    const { orderId } = await params;
    const order = await getOrder(orderId);

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};
