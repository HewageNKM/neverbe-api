import { NextResponse } from "next/server";
import {
  getBrandById,
  updateBrand,
  deleteBrand,
} from "@/services/BrandService";
import { authorizeRequest } from "@/services/AuthService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ brandId: string }> }
) => {
  try {
    const { brandId } = await params;
    const user = await authorizeRequest(_req);
    if (!user) return errorResponse("Unauthorized", 401);

    const result = await getBrandById(brandId);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ brandId: string }> }
) => {
  try {
    const { brandId } = await params;
    const user = await authorizeRequest(req, "view_master_data");
    if (!user) return errorResponse("Unauthorized", 401);

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") === "true";
    const logo = formData.get("logo") as File | null;

    const result = await updateBrand(
      brandId,
      { name, description, status },
      logo || undefined
    );
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ brandId: string }> }
) => {
  try {
    const { brandId } = await params;
    const user = await authorizeRequest(req, "view_master_data");
    if (!user) return errorResponse("Unauthorized", 401);

    const result = await deleteBrand(brandId);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
};
