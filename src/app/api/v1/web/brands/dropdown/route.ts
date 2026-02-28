import { getBrandsForDropdown } from "@/services/OtherService";
import { NextResponse } from "next/server";


export const GET = async (req: Request) => {
  try {
    console.log("[Brands API] Incoming request");

    // --- Step 1: Fetch brands ---
    const brands = await getBrandsForDropdown();
    console.log(`[Brands API] Brands fetched: ${brands.length}`);
    console.log("[Brands API] Brands data:", brands);

    return NextResponse.json(brands, { status: 200 });
  } catch (e: any) {
    console.error("[Brands API] Failed to fetch brands:", e.message, e.stack);
    return NextResponse.json(
      { message: "Internal Server Error", error: e.message },
      { status: 500 }
    );
  }
};
