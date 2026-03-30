import { NextRequest, NextResponse } from "next/server";
import { getHybridIntelligence } from "@/services/HybridIntelligenceService";

export const GET = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const forceRefresh = searchParams.get("refresh") === "true";

    const intelligence = await getHybridIntelligence();

    return NextResponse.json(intelligence);
  } catch (error: any) {
    console.error("[API/HybridIntelligence] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Unbalanced neural network training or AI reasoning. Please try again later."
      }, 
      { status: 500 }
    );
  }
};
