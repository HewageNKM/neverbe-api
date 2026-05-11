import { NextResponse } from "next/server";
import { updateSize, deleteSize, getSizes } from "@/services/SizeService";
import { requirePermission, handleAuthError } from "@/services/AuthService";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ sizeId: string }> }
) => {
  try {
    const { sizeId } = await params;
    await requirePermission(_req, "view_master_data");

    const data = await getSizes({ page: 1, size: 1 }); // optionally fetch single
    const size = data.dataList.find((s) => s.id === sizeId);
    if (!size) return NextResponse.json({ success: false, message: "Size not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: size });
  } catch (err: any) {
    return handleAuthError(err);
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ sizeId: string }> }
) => {
  try {
    const { sizeId } = await params;
    await requirePermission(req, "view_master_data");

    const formData = await req.formData();
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const sizeData = JSON.parse(rawData);
    const { name, status } = sizeData;

    if (!name || !status)
      return NextResponse.json({ success: false, message: "Name and status are required" }, { status: 400 });

    const result = await updateSize(sizeId, sizeData);
    return NextResponse.json(result);
  } catch (err: any) {
    return handleAuthError(err);
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ sizeId: string }> }
) => {
  try {
    const { sizeId } = await params;
    await requirePermission(req, "view_master_data");

    const result = await deleteSize(sizeId);
    return NextResponse.json(result);
  } catch (err: any) {
    return handleAuthError(err);
  }
};
