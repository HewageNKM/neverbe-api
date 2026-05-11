import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getSupplierInvoiceById,
  updateSupplierInvoice,
  deleteSupplierInvoice,
} from "@/services/SupplierInvoiceService";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "view_supplier_invoices");

    const { id } = await params;
    const invoice = await getSupplierInvoiceById(id);

    if (!invoice) {
      return NextResponse.json({ success: false, message: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "create_supplier_invoices");

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("attachment") as File | null;
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const data = JSON.parse(dataString);

    const invoice = await updateSupplierInvoice(id, data, file || undefined);
    return NextResponse.json(invoice);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "create_supplier_invoices");

    const { id } = await params;
    await deleteSupplierInvoice(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
