import { getAllBanners } from "@/services/WebsiteService";
import { NextResponse } from "next/server";
import { handleAuthError } from "@/services/AuthService";

export const GET = async () => {
  try {
    const sliders = await getAllBanners();
    return NextResponse.json(sliders);
  } catch (error: unknown) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
