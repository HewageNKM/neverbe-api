import { getPaymentMethods } from "@/services/WebProductService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        console.log("[Payment Methods API] Incoming request");

        const methods = await getPaymentMethods();
        console.log("[Payment Methods API] Fetched payment methods count:", methods?.length || 0);
        console.log("[Payment Methods API] Methods:", methods);

        return NextResponse.json(methods, { status: 200 });
    } catch (e: any) {
        console.error("[Payment Methods API] Failed to fetch payment methods:", e.message, e.stack);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
