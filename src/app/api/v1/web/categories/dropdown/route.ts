import { getCategoriesForDropdown } from "@/services/OtherService";
import { NextResponse } from "next/server";


export const GET = async (req: Request) => {
  try {
    console.log("[Categories API] Incoming request");

    // --- Step 1: Fetch categories ---
    const categories = await getCategoriesForDropdown();
    console.log(`[Categories API] Categories fetched: ${categories.length}`);
    console.log("[Categories API] Categories data:", categories);

    return NextResponse.json(categories, { status: 200 });
  } catch (e: any) {
    console.error("[Categories API] Failed to fetch categories:", e.message, e.stack);
    return NextResponse.json(
      { message: "Internal Server Error", error: e.message },
      { status: 500 }
    );
  }
};
