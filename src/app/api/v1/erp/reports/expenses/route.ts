import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getExpenseReport } from "@/services/ReportService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const category = url.searchParams.get("category") || undefined;

    if (!from || !to) {
      return NextResponse.json({ success: false, message: "Missing required parameters: from, to" }, { status: 400 });
    }

    const data = await getExpenseReport(from, to, category);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
