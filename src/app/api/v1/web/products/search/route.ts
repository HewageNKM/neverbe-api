import { searchWebProducts } from "@/services/WebProductService";
import { NextRequest, NextResponse } from "next/server";

/**
 * Web Search API - provides SSR searchable results via Algolia
 * Route: /api/v1/web/products/search
 */
export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    const page = Number(url.searchParams.get("page") || 1); // 1-indexed for service
    const size = Number(url.searchParams.get("hitsPerPage") || 40);

    console.log(`[Web Search API] Query: "${query}", Page: ${page}, Size: ${size}`);

    if (!query.trim()) {
      return NextResponse.json({ hits: [], nbHits: 0 }, { status: 200 });
    }

    // Use WebProductService for consistent enrichment (labels, variants)
    const result = await searchWebProducts(query, {
      page,
      size,
    });

    // Match Algolia's response structure for backward compatibility if needed,
    // or return the service's structured response.
    // The service returns { total, dataList }.
    return NextResponse.json({
      hits: result.dataList,
      nbHits: result.total,
    }, { status: 200 });
  } catch (error: any) {
    console.error("[Web Search API] Error:", error.message);
    return NextResponse.json(
      { message: "Search failed", error: error.message },
      { status: 500 },
    );
  }
};
