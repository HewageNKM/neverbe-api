import { NextRequest, NextResponse } from "next/server";
import { authorizeOrderRequest } from "@/services/AuthService";
import { addWebOrder } from "@/services/WebOrderService";
import { Order } from "@/model/Order";
import { errorResponse } from "@/utils/apiResponse";

export const POST = async (req: NextRequest) => {
  try {
    const authorization = await authorizeOrderRequest(req);
    if (!authorization) return errorResponse("Unauthorized", 401);

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return errorResponse("Missing data field", 400);
    }

    const orderData: Partial<Order> = JSON.parse(dataString);
    await addWebOrder(orderData);

    return NextResponse.json("Order Created Successfully");
  } catch (error: any) {
    return errorResponse(error);
  }
};
