import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getSuppliers,
  createSupplier,
  getSuppliersDropdown,
} from "@/services/SupplierService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_suppliers");
    if (!response) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const dropdown = url.searchParams.get("dropdown");
    const status = url.searchParams.get("status") as
      | "active"
      | "inactive"
      | null;

    if (dropdown === "true") {
      const data = await getSuppliersDropdown();
      return NextResponse.json(data);
    }

    const data = await getSuppliers(status || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "create_suppliers");
    if (!response) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const supplier = await createSupplier(body);
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
