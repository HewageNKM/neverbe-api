import { verifyToken } from "@/services/WebAuthService";
import { getUserAddresses, saveUserAddress } from "@/services/CustomerService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const token = await verifyToken(req);
    const uid = token.uid;

    const addresses = await getUserAddresses(uid);

    return NextResponse.json(addresses);
  } catch (error: any) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await verifyToken(req);
    const uid = token.uid;

    // Parse body
    const body = await req.json();
    const { type, address, city, phone, isDefault } = body;

    // Validate type
    if (!["Shipping", "Billing"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid address type. Must be 'Shipping' or 'Billing'." },
        { status: 400 }
      );
    }

    const result = await saveUserAddress(uid, {
      type,
      address,
      city,
      phone,
      isDefault,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error saving address:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
