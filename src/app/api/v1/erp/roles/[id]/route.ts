import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getRole, updateRole, deleteRole } from "@/services/RoleService";
import { AppError } from "@/utils/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await authorizeRequest(req, "manage_roles"))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const role = await getRole(id);
    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (e: any) {
    return NextResponse.json(
      { message: e.message || "Failed to fetch role" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await authorizeRequest(req, "manage_roles"))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await updateRole(id, body);
    return NextResponse.json({ message: "Role updated" });
  } catch (e: any) {
    const status = e instanceof AppError ? e.statusCode : 500;
    return NextResponse.json(
      { message: e.message || "Failed to update role" },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await authorizeRequest(req, "manage_roles"))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteRole(id);
    return NextResponse.json({ message: "Role deleted" });
  } catch (e: any) {
    const status = e instanceof AppError ? e.statusCode : 500;
    return NextResponse.json(
      { message: e.message || "Failed to delete role" },
      { status }
    );
  }
}
