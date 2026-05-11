import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getComboById,
  updateCombo,
  deleteCombo,
} from "@/services/ComboService";
import { NextRequest, NextResponse } from "next/server";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const GET = async (req: NextRequest, props: Props) => {
  const params = await props.params;
  try {
    await requirePermission(req, "view_combos");

    const combo = await getComboById(params.id);
    if (!combo) {
      return NextResponse.json({ success: false, message: "Combo not found" }, { status: 404 });
    }
    return NextResponse.json(combo);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const PUT = async (req: NextRequest, props: Props) => {
  const params = await props.params;
  try {
    await requirePermission(req, "update_combos");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const comboData = JSON.parse(rawData);

    const updated = await updateCombo(params.id, comboData, file || undefined);
    return NextResponse.json(updated);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const DELETE = async (req: NextRequest, props: Props) => {
  const params = await props.params;
  try {
    await requirePermission(req, "delete_combos");

    const result = await deleteCombo(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
