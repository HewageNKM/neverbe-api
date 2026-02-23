import { NextResponse } from "next/server";
import { getAvailableStocks } from "@/services/POSService";
import { verifyPosAuth, handleAuthError } from "@/services/AuthService";

// GET - Fetch all available stocks
export async function GET() {
  try {
    await verifyPosAuth("access_pos");
    const stocks = await getAvailableStocks();
    return NextResponse.json(stocks);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
