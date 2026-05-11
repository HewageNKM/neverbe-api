import { NextRequest, NextResponse } from "next/server";
import { requirePermission, loginUser, handleAuthError } from "@/services/AuthService";

export const POST = async (req: NextRequest) => {
  try {
    await requirePermission(req);

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const { uid } = JSON.parse(dataString);

    if (!uid) {
      return NextResponse.json({ success: false, message: "Missing User ID" }, { status: 400 });
    }

    const user = await loginUser(uid);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};
