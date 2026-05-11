import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getTaxReport } from "@/services/ReportService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ success: false, message: "Missing required parameters: from, to" }, { status: 400 });
    }

    const data = await getTaxReport(from, to);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
