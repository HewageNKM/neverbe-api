import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getSuppliers,
  createSupplier,
  getSuppliersDropdown,
} from "@/services/SupplierService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_suppliers");

    const url = new URL(req.url);
    const dropdown = url.searchParams.get("dropdown");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    if (dropdown === "true") {
      const data = await getSuppliersDropdown();
      return NextResponse.json(data);
    }

    const data = await getSuppliers(
      (status as "active" | "inactive") || undefined,
      search || undefined,
    );
    return NextResponse.json(data);
  } catch (error: unknown) {
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "create_suppliers");

    const formData = await req.formData();
    const data = formData.get("data");

    if (!data) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const body = JSON.parse(data as string);
    const supplier = await createSupplier(body);
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: unknown) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
