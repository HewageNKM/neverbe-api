import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/services/AuthService";

export const POST = async (req: NextRequest) => {
  try {
    return NextResponse.json({ message: "Logout successful" }, { status: 200 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};
