import { verifyToken } from "@/services/WebAuthService";
import { verifyCODOTP } from "@/services/NotificationService";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    console.log("[COD OTP Verification API] Incoming request");

    // Verify user token
    const idToken = await verifyToken(req);
    console.log("[COD OTP Verification API] Token verified:", idToken.uid);

    // Parse request body
    const body = await req.json();
    const { phoneNumber, otp } = body;
    console.log("[COD OTP Verification API] Request body:", body);

    if (!phoneNumber) {
      console.warn("[COD OTP Verification API] Missing phone number in request");
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 });
    }

    if (!otp) {
      console.warn("[COD OTP Verification API] Missing OTP in request");
      return NextResponse.json({ success: false, message: "OTP is required" }, { status: 400 });
    }

    // Verify the OTP
    console.log("[COD OTP Verification API] Verifying OTP...");
    const res = await verifyCODOTP(phoneNumber, otp);
    console.log("[COD OTP Verification API] OTP verification response:", res);

    return NextResponse.json({ ...res, success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[COD OTP Verification API] Error:", error.message, error.stack);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};
