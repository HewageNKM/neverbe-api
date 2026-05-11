import { NextResponse } from "next/server";
import { getSizes, createSize } from "@/services/SizeService";
import { requirePermission, handleAuthError } from "@/services/AuthService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_master_data");

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const size = Number(searchParams.get("size") || 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as "active" | "inactive" | null;

    const data = await getSizes({ page, size, search, status });
    return NextResponse.json(data);
  } catch (err: any) {
    return handleAuthError(err);
  }
};

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "view_master_data");

    const formData = await req.formData();
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const sizeData = JSON.parse(rawData);
    if (!sizeData.name || !sizeData.status)
      return NextResponse.json({ success: false, message: "Name and status are required" }, { status: 400 });

    const result = await createSize(sizeData);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return handleAuthError(err);
  }
};
