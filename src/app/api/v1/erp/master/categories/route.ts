import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { createCategory, getCategories } from "@/services/CategoryService";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_master_data");

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const size = parseInt(url.searchParams.get("size") || "10");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") as
      | "active"
      | "inactive"
      | null;

    const result = await getCategories({ page, size, search, status });
    return NextResponse.json(result);
  } catch (e) {
    return handleAuthError(e);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_master_data");

    const formData = await req.formData();
    const rawData = formData.get("data") as string;
    
    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }
    
    const category = JSON.parse(rawData);
    if (!category.name) return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });

    const file = formData.get("file") as File;
    if (file) {
      const { uploadCompressedImage } = await import("@/services/StorageService");
      const path = `categories/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      category.imageUrl = await uploadCompressedImage(file, path);
    }

    const res = await createCategory(category);
    return NextResponse.json(res, { status: 201 });
  } catch (e) {
    return handleAuthError(e);
  }
};
