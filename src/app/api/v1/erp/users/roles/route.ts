import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  createRole,
  getAllRoles,
  getAllPermissions,
} from "@/services/RoleService";
import { AppError } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  if (!(await authorizeRequest(req, "manage_roles"))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const roles = await getAllRoles();
    const permissions = getAllPermissions();
    return NextResponse.json({ roles, permissions });
  } catch (e: any) {
    return NextResponse.json(
      { message: e.message || "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await authorizeRequest(req, "manage_roles"))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const roleId = await createRole(body);
    return NextResponse.json(
      { message: "Role created", roleId },
      { status: 201 }
    );
  } catch (e: any) {
    const status = e instanceof AppError ? e.statusCode : 500;
    return NextResponse.json(
      { message: e.message || "Failed to create role" },
      { status }
    );
  }
}
