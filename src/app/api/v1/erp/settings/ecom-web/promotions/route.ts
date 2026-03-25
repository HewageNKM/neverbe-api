import { promotionRepository } from "@/repositories/PromotionRepository";
import { adminStorageBucket } from "@/firebase/firebaseAdmin";
import { errorResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_website");
    if (!response) {
      return errorResponse("Unauthorized", 401);
    }
    const promotions = await promotionRepository.findAll();
    return NextResponse.json(promotions);
  } catch (error: any) {
    console.error("[Promotions API] Error:", error);
    return errorResponse(error);
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_website");
    if (!response) {
      return errorResponse("Unauthorized", 401);
    }
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const link = formData.get("link") as string;

    if (!file || !title || !link) {
      return errorResponse("Missing required fields", 400);
    }

    const { url } = await uploadFile(file, "promotions");
    const result = await promotionRepository.create({
      name: title,
      description: title,
      type: "PERCENTAGE", // Default for marketing banners
      status: "ACTIVE",
      isActive: true,
      bannerUrl: url,
      bannerTitle: title,
      link: link,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
      usageCount: 0,
      stackable: false,
      priority: 0,
      conditions: [],
      actions: [],
    } as any);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[Promotions API] Error:", error);
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
