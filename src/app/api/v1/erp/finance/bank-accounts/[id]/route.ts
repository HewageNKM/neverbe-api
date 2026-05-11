import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount,
  updateBankAccountBalance,
} from "@/services/BankAccountService";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "view_bank_accounts");

    const { id } = await params;
    const account = await getBankAccountById(id);

    if (!account) {
      return NextResponse.json({ success: false, message: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "manage_bank_accounts");

    const { id } = await params;
    const formData = await req.formData();
    const data = formData.get("data");

    if (!data) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const body = JSON.parse(data as string);

    // Check if this is a balance update
    if (body.balanceUpdate) {
      const account = await updateBankAccountBalance(
        id,
        body.amount,
        body.type
      );
      return NextResponse.json(account);
    }

    const account = await updateBankAccount(id, body);
    return NextResponse.json(account);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "manage_bank_accounts");

    const { id } = await params;
    await deleteBankAccount(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
