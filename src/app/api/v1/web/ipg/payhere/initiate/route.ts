import { NextRequest, NextResponse } from "next/server";
import { IPGService } from "@/services/IPGService";
import { verifyToken } from "@/services/WebAuthService";

export const POST = async (req: NextRequest) => {
  try {
    console.log("[PayHere Initiate API] Incoming request");

    // --- Step 1: Verify user token ---
    const idToken = await verifyToken(req);
    console.log("[PayHere Initiate API] Token verified:", idToken.uid);

    // --- Step 2: Parse request body ---
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json(
        { error: "Missing data field" },
        { status: 400 }
      );
    }

    const body = JSON.parse(dataString);
    console.log("[PayHere Initiate API] Request body:", body);

    // --- Step 3: Generate payload via IPGService ---
    const payload = IPGService.generatePayHerePayload(body);

    console.log("✅ PayHere initiate payload prepared:", payload);
    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    console.error("❌ PayHere initiate error:", error.message, error.stack);
    return NextResponse.json(
      { message: "Error generating PayHere payload", error: error.message },
      { status: 500 },
    );
  }
};
