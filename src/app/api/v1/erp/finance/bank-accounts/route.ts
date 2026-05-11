import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getBankAccounts,
  createBankAccount,
  getBankAccountsDropdown,
  getTotalBalance,
} from "@/services/BankAccountService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_bank_accounts");

    const url = new URL(req.url);
    const dropdown = url.searchParams.get("dropdown") === "true";
    const summary = url.searchParams.get("summary") === "true";

    if (dropdown) {
      const data = await getBankAccountsDropdown();
      return NextResponse.json(data);
    }

    if (summary) {
      const total = await getTotalBalance();
      return NextResponse.json({ totalBalance: total });
    }

    const data = await getBankAccounts();
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "manage_bank_accounts");

    const formData = await req.formData();
    const data = formData.get("data");

    if (!data) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const body = JSON.parse(data as string);
    const account = await createBankAccount(body);
    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
