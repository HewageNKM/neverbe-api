import { NextResponse } from "next/server";
import { requirePermission, handleAuthError, createUser } from "@/services/AuthService";
import { getUsers } from "@/services/UserService";
import { User } from "@/model/User";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "manage_users");

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") as string) || 1;
    const size = parseInt(url.searchParams.get("size") as string) || 20;
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "all";
    const status = url.searchParams.get("status") || "all";

    const result = await getUsers({ page, size, search, role, status });
    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "manage_users");

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body: User = JSON.parse(dataString);
    if (!body) {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

    const userId = await createUser(body);
    return NextResponse.json({ userId }, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};
