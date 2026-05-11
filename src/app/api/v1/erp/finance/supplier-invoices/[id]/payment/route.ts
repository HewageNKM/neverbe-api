import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { recordInvoicePayment } from "@/services/SupplierInvoiceService";

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "create_supplier_invoices");

    const { id } = await params;
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const { amount, bankAccountId, notes } = JSON.parse(dataString);

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid amount" }, { status: 400 });
    }

    const updatedInvoice = await recordInvoicePayment(
      id,
      amount,
      bankAccountId,
      notes
    );

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
