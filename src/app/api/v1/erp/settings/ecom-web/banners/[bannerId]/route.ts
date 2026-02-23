import { authorizeRequest } from "@/services/AuthService";
import { deleteBanner } from "@/services/WebsiteService";
import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const DELETE = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_website");
    if (!response) {
      return errorResponse("Unauthorized", 401);
    }
    const name = new URL(req.url).pathname.split("/")[5];
    const writeResult = await deleteBanner(name || "");
    return NextResponse.json(writeResult);
  } catch (error: any) {
    console.error("[Banners API] Delete Error:", error);
    return errorResponse(error);
  }
};
