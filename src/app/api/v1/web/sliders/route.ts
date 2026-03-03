import { getSliders } from "@/services/OtherService";
import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async () => {
  try {
    const sliders = await getSliders();
    return NextResponse.json(sliders);
  } catch (error: unknown) {
    console.error("[Sliders API] Error:", error);
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
