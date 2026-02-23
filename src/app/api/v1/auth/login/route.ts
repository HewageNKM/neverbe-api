import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest, loginUser } from "@/services/AuthService";
import { errorResponse } from "@/utils/apiResponse";

export const POST = async (req: NextRequest) => {
  try {
    const isAuthorized = await authorizeRequest(req);
    if (!isAuthorized) {
      return errorResponse("Unauthorized", 401);
    }

    const { uid } = await req.json();

    if (!uid) {
      return errorResponse("Missing User ID", 400);
    }

    const user = await loginUser(uid);

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error("Login Error:", error);
    return errorResponse(error);
  }
};
