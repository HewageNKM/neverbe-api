import { verifyToken } from "@/services/WebAuthService";
import md5 from "crypto-js/md5";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    console.log("[PayHere Initiate API] Incoming request");

    // --- Step 1: Verify user token ---
    const idToken = await verifyToken(req);
    console.log("[PayHere Initiate API] Token verified:", idToken.uid);

    // --- Step 2: Parse request body ---
    const body = await req.json();
    const {
      orderId,
      amount,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      items,
      returnUrl,
      cancelUrl,
      notifyUrl,
    } = body;
    console.log("[PayHere Initiate API] Request body:", body);

    // --- Step 3: Load merchant credentials ---
    const merchantId = process.env.PAYHERE_MERCHANT_ID!;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;
    const currency = "LKR";

    if (!merchantId || !merchantSecret) {
      throw new Error("PayHere merchant credentials missing in environment.");
    }
    console.log("[PayHere Initiate API] Merchant credentials loaded");

    // --- Step 4: Format amount ---
    const amountFormatted = parseFloat(amount)
      .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .replace(/,/g, "");
    console.log("[PayHere Initiate API] Formatted amount:", amountFormatted);

    // --- Step 5: Generate hashed secret and signature ---
    const hashedSecret = md5(merchantSecret).toString().toUpperCase();
    const hash = md5(
      merchantId + orderId + amountFormatted + currency + hashedSecret
    )
      .toString()
      .toUpperCase();
    console.log("[PayHere Initiate API] Generated hash:", hash);

    // --- Step 6: Prepare payload for frontend ---
    const payload = {
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id: orderId,
      items,
      amount: amountFormatted,
      currency,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address,
      city,
      country: "Sri Lanka",
      hash,
    };

    console.log("✅ PayHere initiate payload prepared:", payload);
    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error("[PayHere Initiate API] Error:", err.message, err.stack);
    return NextResponse.json(
      { message: "Error generating PayHere payload", error: err.message },
      { status: 500 }
    );
  }
};
