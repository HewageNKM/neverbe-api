import { getSliders } from "@/services/OtherService";
import { NextResponse } from "next/server";
import { handleAuthError } from "@/services/AuthService";

export const GET = async () => {
  try {
    const sliders = await getSliders();
    return NextResponse.json(sliders);
  } catch (error: unknown) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
