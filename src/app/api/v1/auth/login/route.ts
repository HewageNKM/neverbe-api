import { NextRequest, NextResponse } from "next/server";
import { loginUser, handleAuthError } from "@/services/AuthService";

export const POST = async (req: NextRequest) => {
  try {
    let uid: string | undefined;
    const contentType = req.headers.get("content-type") || "";
    console.log(`[LoginRoute] Received request. Content-Type: ${contentType}`);

    if (contentType.includes("application/json")) {
      const body = await req.json();
      uid = body.uid;
      console.log(`[LoginRoute] JSON Body UID: ${uid}`);
    } else {
      const formData = await req.formData();
      const dataString = formData.get("data") as string;
      if (dataString) {
        const parsed = JSON.parse(dataString);
        uid = parsed.uid;
        console.log(`[LoginRoute] FormData UID: ${uid}`);
      }
    }

    if (!uid) {
      console.warn(`[LoginRoute] Missing UID in request body`);
      return NextResponse.json({ success: false, message: "Missing User ID (uid)" }, { status: 400 });
    }

    const user = await loginUser(uid);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found in system" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error("Login Route Error:", error);
    return handleAuthError(error);
  }
};
