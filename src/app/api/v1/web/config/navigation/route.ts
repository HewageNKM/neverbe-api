import { getNavigationConfig } from "@/services/OtherService";
import { NextResponse } from "next/server";
import { handleAuthError } from "@/services/AuthService";

export const GET = async () => {
  try {
    const config = await getNavigationConfig();
    return NextResponse.json(config);
  } catch (error: unknown) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
