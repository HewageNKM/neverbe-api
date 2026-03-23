import { NextRequest, NextResponse } from "next/server";
import { getDomexTracking } from "@/services/TrackingService";
import { getOrderByIdForInvoice } from "@/services/WebOrderService";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) => {
  try {
    const orderId = (await context.params).orderId;
    if (!orderId) {
      return NextResponse.json({ message: "Order ID is required" }, { status: 400 });
    }

    // 1. Fetch order to get tracking number
    // We use WebOrderService's method which is typically what web clients use
    const order = await getOrderByIdForInvoice(orderId);
    
    if (!order.trackingNumber) {
      return NextResponse.json({ 
        message: "No tracking information available",
        data: [] 
      }, { status: 200 });
    }

    // 2. Scrape live tracking data
    const trackingHistory = await getDomexTracking(order.trackingNumber);

    return NextResponse.json({ 
      data: {
        trackingNumber: order.trackingNumber,
        courier: order.courier || "Domex",
        history: trackingHistory
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("[Web Tracking API] Error:", error.message);
    // Even if scraping fails, return the tracking number so the frontend can show a fallback link
    return NextResponse.json({ 
      data: {
        trackingNumber: null, // We'll try to get it again or rely on the error catch
        history: [],
        error: "Live tracking currently unavailable"
      }
    }, { status: 200 });
  }
};
