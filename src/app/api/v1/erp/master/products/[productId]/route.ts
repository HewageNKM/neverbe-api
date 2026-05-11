import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getProductById, updateProduct, deleteProduct } from "@/services/ProductService";

interface RouteParams {
  params: Promise<{
    productId: string;
  }>;
}

export const GET = async (req: NextRequest, { params }: RouteParams) => {
  try {
    await requirePermission(req, "view_master_data");

    const { productId } = await params;
    const product = await getProductById(productId);

    return NextResponse.json(product);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

/**
 * PUT: Update an existing product
 */
export const PUT = async (req: NextRequest, { params }: RouteParams) => {
  try {
    await requirePermission(req, "view_master_data");

    const { productId } = await params;
    const formData = await req.formData();
    
    const file = formData.get("thumbnail") as File | null;
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const productData = JSON.parse(rawData);

    const result = await updateProduct(productId, productData, file);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

/**
 * DELETE: Soft-delete a product
 */
export const DELETE = async (req: NextRequest, { params }: RouteParams) => {
  try {
    await requirePermission(req, "view_master_data");

    const { productId } = await params;

    await deleteProduct(productId);

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    return handleAuthError(error);
  }
};
