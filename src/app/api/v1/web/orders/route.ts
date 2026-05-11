import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { addWebOrder, getOrdersByUserId } from "@/services/WebOrderService";
import { Order } from "@/model/Order";

export const POST = async (req: NextRequest) => {
  try {
    const user = await requirePermission(req);

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const orderData: Partial<Order> = JSON.parse(dataString);
    await addWebOrder(orderData);

    return NextResponse.json({ success: true, message: "Order Created Successfully" });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const user = await requirePermission(req);

    const orders = await getOrdersByUserId(user.uid);
    return NextResponse.json(orders);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
