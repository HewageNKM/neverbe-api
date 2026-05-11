import { NextResponse } from "next/server";
import {
  getBrandById,
  updateBrand,
  deleteBrand,
} from "@/services/BrandService";
import { requirePermission, handleAuthError } from "@/services/AuthService";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ brandId: string }> }
) => {
  try {
    const { brandId } = await params;
    await requirePermission(_req, "view_master_data");

    const result = await getBrandById(brandId);
    return NextResponse.json(result);
  } catch (err) {
    return handleAuthError(err);
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ brandId: string }> }
) => {
  try {
    const { brandId } = await params;
    await requirePermission(req, "view_master_data");

    const formData = await req.formData();
    const logo = formData.get("logo") as File | null;
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const brandData = JSON.parse(rawData);

    const result = await updateBrand(brandId, brandData, logo || undefined);
    return NextResponse.json(result);
  } catch (err) {
    return handleAuthError(err);
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ brandId: string }> }
) => {
  try {
    const { brandId } = await params;
    await requirePermission(req, "view_master_data");

    const result = await deleteBrand(brandId);
    return NextResponse.json(result);
  } catch (err) {
    return handleAuthError(err);
  }
};
