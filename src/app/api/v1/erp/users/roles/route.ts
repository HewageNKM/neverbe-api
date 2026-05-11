import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  createRole,
  getAllRoles,
  getAllPermissions,
} from "@/services/RoleService";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "manage_roles");

    const roles = await getAllRoles();
    const permissions = getAllPermissions();
    return NextResponse.json({ roles, permissions });
  } catch (e: any) {
    return handleAuthError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission(req, "manage_roles");

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body = JSON.parse(dataString);
    const roleId = await createRole(body);
    return NextResponse.json(
      { message: "Role created", roleId },
      { status: 201 }
    );
  } catch (e: any) {
    return handleAuthError(e);
  }
}
