import { authorizeRequest } from "@/services/AuthService";
import { updateVariant, deleteVariant } from "@/services/VariantService";
import { ProductVariant } from "@/model/ProductVariant";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

// Helper to parse FormData (can reuse from POST route)
const parseVariantFormData = (
  formData: FormData
): { variantData: Partial<ProductVariant>; newImageFiles: File[] } => {
  const variantData: Partial<ProductVariant> = {};
  const newImageFiles: File[] = formData.getAll("newImages") as File[];
  const parseJsonArray = (value: string): any[] => {
    try {
      if (value && typeof value === "string" && value.length > 0) {
        return JSON.parse(value);
      }
    } catch (e) {
      console.error("Failed to parse JSON", value, e);
    }
    return [];
  };
  for (const [key, value] of formData.entries()) {
    if (key === "newImages") continue;
    switch (key) {
      case "sizes":
      case "images":
        (variantData as any)[key] = parseJsonArray(value as string);
        break;
      case "status":
        (variantData as any)[key] = value === "true";
        break;
      default:
        (variantData as any)[key] = value as string;
    }
  }
  return { variantData, newImageFiles };
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ productId: string; variantId: string }> }
) => {
  try {
    const user = await authorizeRequest(req, "view_master_data");
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { productId, variantId } = await params;
    if (!productId || !variantId) {
      return errorResponse("Product ID and Variant ID are required", 400);
    }

    const formData = await req.formData();
    const { variantData, newImageFiles } = parseVariantFormData(formData);

    if (!variantData.variantName) {
      return errorResponse("Variant name is required", 400);
    }

    // Call the service to update the variant
    const updatedVariant = await updateVariant(
      productId,
      variantId,
      variantData,
      newImageFiles
    );

    return NextResponse.json(updatedVariant, { status: 200 }); // Return updated variant
  } catch (error: any) {
    console.error("PUT Variant Error:", error);
    return errorResponse(error);
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ productId: string; variantId: string }> }
) => {
  try {
    const user = await authorizeRequest(req, "view_master_data");
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { productId, variantId } = await params;
    if (!productId || !variantId) {
      return errorResponse("Product ID and Variant ID are required", 400);
    }

    // Call the service to delete the variant
    const success = await deleteVariant(productId, variantId);

    if (!success) {
      return errorResponse("Variant not found or already deleted", 404);
    }

    return NextResponse.json(
      { message: "Variant deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE Variant Error:", error);
    return errorResponse(error);
  }
};
