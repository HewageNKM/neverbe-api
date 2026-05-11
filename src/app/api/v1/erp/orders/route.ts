import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { addOrder, getOrders } from "@/services/OrderService";
import { Order } from "@/model/Order";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_orders");

    const url = new URL(req.url);
    const pageNumber = parseInt(url.searchParams.get("page") as string) || 1;
    const size = parseInt(url.searchParams.get("size") as string) || 20;
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const status = url.searchParams.get("status");
    const payment = url.searchParams.get("payment");
    const orderId = url.searchParams.get("search");
    const from = url.searchParams.get("from");
    const stockId = url.searchParams.get("stockId");
    const paymentMethod = url.searchParams.get("paymentMethod");

    const { dataList, total } = await getOrders(
      pageNumber,
      size,
      startDate || undefined,
      endDate || undefined,
      status || undefined,
      payment || undefined,
      orderId || undefined,
      from || undefined,
      stockId || undefined,
      paymentMethod || undefined,
    );
    
    return NextResponse.json({ dataList, total });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    await requirePermission(req, "create_orders");

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const orderData: Partial<Order> = JSON.parse(dataString);
    await addOrder(orderData);
    return NextResponse.json("Order Created Successfully");
  } catch (error: any) {
    return handleAuthError(error);
  }
};
