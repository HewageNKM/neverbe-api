import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getCategoryById,
  updateCategory,
  softDeleteCategory,
} from "@/services/CategoryService";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) => {
  try {
    const { categoryId } = await params;
    await requirePermission(req, "view_master_data");

    const category = await getCategoryById(categoryId);
    
    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (e) {
    return handleAuthError(e);
  }
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) => {
  try {
    const { categoryId } = await params;
    await requirePermission(req, "view_master_data");

    const formData = await req.formData();
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const data = JSON.parse(rawData);
    if (!data.name || data.status === undefined) {
      return NextResponse.json({ success: false, message: "Name and Status are required" }, { status: 400 });
    }
    
    const file = formData.get("file") as File;
    if (file) {
      const { uploadCompressedImage } = await import("@/services/StorageService");
      const path = `categories/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      data.imageUrl = await uploadCompressedImage(file, path);
    }
    
    const res = await updateCategory(categoryId, data);
    return NextResponse.json(res);
  } catch (e) {
    return handleAuthError(e);
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) => {
  try {
    const { categoryId } = await params;
    await requirePermission(req, "view_master_data");

    const res = await softDeleteCategory(categoryId);
    return NextResponse.json(res);
  } catch (e) {
    return handleAuthError(e);
  }
};
