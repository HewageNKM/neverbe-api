import { getActiveBrands } from "@/services/BrandService";
import { NextResponse } from "next/server";
import { handleAuthError } from "@/services/AuthService";

export const GET = async () => {
  try {
    const brands = await getActiveBrands();
    return NextResponse.json(brands);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
