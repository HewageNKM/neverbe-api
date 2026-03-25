import { NextResponse } from "next/server";
import { authorizeAndGetUser } from "@/services/AuthService";
import { processContextualChat } from "@/services/AIService";
import { errorResponse } from "@/utils/apiResponse";

export const POST = async (req: Request) => {
  try {
    // Verify the ID token to ensure caller is an admin/staff
    const user = await authorizeAndGetUser(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return errorResponse("Missing data field", 400);
    }

    const body = JSON.parse(dataString);
    const { contextData, messages } = body;

    if (!contextData || !messages || !Array.isArray(messages)) {
      return errorResponse(
        "Missing required fields: contextData or messages array.",
        400,
      );
    }

    const responseText = await processContextualChat(contextData, messages);

    return NextResponse.json({
      success: true,
      data: {
        text: responseText,
      },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
};
