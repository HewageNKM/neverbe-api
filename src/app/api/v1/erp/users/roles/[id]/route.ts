import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getRole, updateRole, deleteRole } from "@/services/RoleService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(req, "manage_roles");

    const { id } = await params;
    const role = await getRole(id);
    if (!role) {
      return NextResponse.json({ success: false, message: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (e: any) {
    return handleAuthError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(req, "manage_roles");

    const { id } = await params;
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body = JSON.parse(dataString);
    await updateRole(id, body);
    return NextResponse.json({ message: "Role updated" });
  } catch (e: any) {
    return handleAuthError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(req, "manage_roles");

    const { id } = await params;
    await deleteRole(id);
    return NextResponse.json({ message: "Role deleted" });
  } catch (e: any) {
    return handleAuthError(e);
  }
}
