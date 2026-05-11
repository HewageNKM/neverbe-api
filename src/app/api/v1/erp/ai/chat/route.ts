import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { processContextualChat } from "@/services/AIService";

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "view_dashboard");

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body = JSON.parse(dataString);
    const { contextData, messages } = body;

    if (!contextData || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: contextData or messages array." },
        { status: 400 }
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
    return handleAuthError(error);
  }
};
