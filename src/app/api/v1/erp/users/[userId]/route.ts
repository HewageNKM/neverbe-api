import { NextResponse } from "next/server";
import { requirePermission, handleAuthError, updateUser } from "@/services/AuthService";
import { deleteUser } from "@/services/UserService";
import { User } from "@/model/User";

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  try {
    await requirePermission(req, "manage_users");

    const { userId } = await params;
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body: Partial<User> = JSON.parse(dataString);

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    await updateUser(userId, body);

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  try {
    await requirePermission(req, "manage_users");

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    await deleteUser(userId);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return handleAuthError(error);
  }
};
