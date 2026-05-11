import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getSupplierInvoices,
  createSupplierInvoice,
  getInvoiceAgingSummary,
} from "@/services/SupplierInvoiceService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_supplier_invoices");

    const url = new URL(req.url);
    const summary = url.searchParams.get("summary") === "true";
    if (summary) {
      const data = await getInvoiceAgingSummary();
      return NextResponse.json(data);
    }

    const filters = {
      supplierId: url.searchParams.get("supplierId") || undefined,
      status: url.searchParams.get("status") || undefined,
    };

    const data = await getSupplierInvoices(filters);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    const decodedToken = await requirePermission(req, "create_supplier_invoices");

    const formData = await req.formData();
    const file = formData.get("attachment") as File | null;
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const data = JSON.parse(dataString);
    data.createdBy = decodedToken.uid;

    const invoice = await createSupplierInvoice(data, file || undefined);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
