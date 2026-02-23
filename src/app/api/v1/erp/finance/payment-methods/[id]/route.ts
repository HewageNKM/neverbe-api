import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/services/PaymentMethodService";
import { errorResponse } from "@/utils/apiResponse";

// PUT: Update payment method
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = await authorizeRequest(req, "manage_payment_methods");
    if (!authorized) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.fee !== undefined) updateData.fee = Number(body.fee);
    if (body.status !== undefined) updateData.status = body.status === true;
    if (body.available !== undefined) updateData.available = body.available;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.paymentId !== undefined) updateData.paymentId = body.paymentId;

    await updatePaymentMethod(id, updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return errorResponse(error);
  }
}

// DELETE: Soft delete payment method
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = await authorizeRequest(req, "manage_payment_methods");
    if (!authorized) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    await deletePaymentMethod(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return errorResponse(error);
  }
}
