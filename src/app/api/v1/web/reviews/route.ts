import { getWebReviews, createReview } from "@/services/ReviewService";
import { verifyToken } from "@/services/WebAuthService";
import { verifyCaptchaToken } from "@/services/CapchaService";
import { uploadCompressedImage } from "@/services/StorageService";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { Review } from "@/interfaces/Review";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const itemId = searchParams.get("itemId") || undefined;

    const reviews = await getWebReviews(limit, itemId);
    
    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await verifyToken(req);
    const uid = token.uid;
    const userName = token.name || "Customer";

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ error: "Missing data field" }, { status: 400 });
    }

    const data = JSON.parse(dataString) as any;
    
    // Verify reCAPTCHA
    if (!data.captchaToken) {
      return NextResponse.json({ error: "Missing captcha token" }, { status: 400 });
    }
    const isHuman = await verifyCaptchaToken(data.captchaToken);
    if (!isHuman) {
      return NextResponse.json({ error: "Invalid captcha" }, { status: 403 });
    }

    // Handle Images
    const imageFiles = formData.getAll("images") as File[];
    const uploadedImages = [];
    
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("One or more images exceed 5MB limit");
        }
        
        const fileId = nanoid(8).toLowerCase();
        const filePath = `reviews/${uid}/${fileId}_img.webp`;
        const url = await uploadCompressedImage(file, filePath);
        uploadedImages.push({ url, file: filePath, order: uploadedImages.length });
      }
    }

    const result = await createReview(uid, userName, {
      ...data,
      images: uploadedImages,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
