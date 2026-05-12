import { getERPSettings } from "@/services/SettingsService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    console.log("[Settings API] Fetching settings...");

    const settings = await getERPSettings();
    console.log("[Settings API] Settings fetched successfully.");

    return NextResponse.json(settings, { status: 200 });
  } catch (error: any) {
    console.error("[Settings API] Error:", error.message, error.stack);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};
