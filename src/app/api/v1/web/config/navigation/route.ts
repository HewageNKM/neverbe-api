import { getNavigationConfig } from "@/services/OtherService";
import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async () => {
  try {
    const config = await getNavigationConfig();
    return NextResponse.json(config);
  } catch (error: unknown) {
    console.error("[Navigation API] Error:", error);
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
