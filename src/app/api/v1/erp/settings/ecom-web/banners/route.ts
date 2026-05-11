import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { addABanner, getAllBanners } from "@/services/WebsiteService";
import { uploadCompressedImage } from "@/services/StorageService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_website");
    const banners = await getAllBanners();
    return NextResponse.json(banners);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "update_website");
    const formData = await req.formData();
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const { path } = JSON.parse(rawData);
    const bannerFile = formData.get("banner") as File;

    if (!bannerFile) {
      return NextResponse.json({ success: false, message: "Banner image is required" }, { status: 400 });
    }

    // Generate unique WebP filename
    const timestamp = Date.now();
    const cleanFileName = bannerFile.name.replace(/[^a-z0-9.]/gi, "_").split(".")[0];
    const filePath = `${path}/${timestamp}_${cleanFileName}.webp`;

    const url = await uploadCompressedImage(bannerFile, filePath);
    const writeResult = await addABanner({
      url,
      fileName: bannerFile.name,
    });
    return NextResponse.json(writeResult);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
