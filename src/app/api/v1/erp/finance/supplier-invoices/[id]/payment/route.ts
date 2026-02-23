import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { recordInvoicePayment } from "@/services/SupplierInvoiceService";
import { errorResponse } from "@/utils/apiResponse";

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const response = await authorizeRequest(req, "view_supplier_invoices");
    if (!response) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const { amount, bankAccountId, notes } = body;

    if (!amount || amount <= 0) {
      return errorResponse("Invalid amount", 400);
    }

    const updatedInvoice = await recordInvoicePayment(
      id,
      amount,
      bankAccountId,
      notes
    );

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    return errorResponse(error);
  }
};
