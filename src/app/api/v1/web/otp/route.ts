import { verifyToken } from "@/services/WebAuthService";
import { sendCODVerificationOTP } from "@/services/NotificationService";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    console.log("[COD OTP API] Incoming request");

    // Verify user token
    const idToken = await verifyToken(req);
    console.log("[COD OTP API] Token verified:", idToken.uid);

    // Parse request body
    const body = await req.json();
    const { phoneNumber, captchaToken } = body;
    console.log("[COD OTP API] Request body:", body);

    if (!phoneNumber) {
      console.warn("[COD OTP API] Missing phone number in request");
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 });
    }

    if (!captchaToken) {
      console.warn("[COD OTP API] Missing captcha token in request");
      return NextResponse.json({ success: false, message: "Captcha token is required" }, { status: 400 });
    }

    // Send COD verification OTP
    console.log("[COD OTP API] Sending OTP...");
    const res = await sendCODVerificationOTP(phoneNumber, captchaToken);
    console.log("[COD OTP API] OTP send response:", res);

    return NextResponse.json({ ...res, success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[COD OTP API] Error:", error.message, error.stack);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};
