import { requirePermission, handleAuthError } from "@/services/AuthService";
import { ProductVariant } from "@/model/ProductVariant";
import { addVariant } from "@/services/VariantService";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) => {
  try {
    await requirePermission(req, "view_master_data");

    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
    }

    const formData = await req.formData();
    
    // Standardized pattern: JSON string in 'data' and files in 'attachment'
    const dataString = formData.get("data") as string;
    const newImageFiles: File[] = formData.getAll("attachment") as File[];

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const variantData = JSON.parse(dataString) as Partial<ProductVariant>;

    // Basic validation
    if (!variantData.variantName) {
      return NextResponse.json({ success: false, message: "Variant name is required" }, { status: 400 });
    }

    // Call the service to add the variant
    const savedVariant = await addVariant(
      productId,
      variantData,
      newImageFiles
    );

    return NextResponse.json(savedVariant, { status: 201 }); // Return the saved variant
  } catch (error: any) {
    console.error("POST Variant Error:", error);
    return handleAuthError(error);
  }
};
