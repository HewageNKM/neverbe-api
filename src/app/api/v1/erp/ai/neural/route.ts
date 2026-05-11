import { NextResponse } from "next/server";
console.error("[CRITICAL DEBUG] Neural Route File Loaded");
import { predictMonthlySales } from "@/services/AIService";
import { reportRepository } from "@/repositories/ReportRepository";
import { predictionRepository } from "@/repositories/PredictionRepository";
import dayjs from "dayjs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";
    const reqYear = searchParams.get("year");
    const reqMonth = searchParams.get("month");

    const targetMonthStr = reqYear && reqMonth
      ? `${reqYear}-${reqMonth.padStart(2, '0')}`
      : dayjs().format("YYYY-MM");

    const isHistorical = targetMonthStr < dayjs().format("YYYY-MM");

    // 1. Check if we have a prediction for this month
    const existing = await predictionRepository.findByMonth(targetMonthStr);

    if (existing && !forceRefresh) {
      return NextResponse.json({ success: true, data: existing.data });
    }

    // 2. If not, generate a new one using Gemini
    // Use 2 years of data (730 days) ending at the target month end
    const endDate = reqYear && reqMonth
      ? dayjs(targetMonthStr).endOf("month").toDate()
      : new Date();
    const from = dayjs(endDate).subtract(730, "day").toDate();

    const historicalOrders = await reportRepository.findOrdersForAnalysis({
      start: from,
      end: endDate,
      paymentStatus: "Paid"
    });

    // Simplify data for Gemini (group by month for 2-year trend)
    const monthlySummary: Record<string, number> = {};
    const dailyTargetContext: any[] = [];

    historicalOrders.forEach(o => {
      const d = dayjs(o.createdAt.toDate());
      const mKey = d.format("YYYY-MM");
      monthlySummary[mKey] = (monthlySummary[mKey] || 0) + (o.total || 0);

      // If order is within the target month, keep daily granularity
      if (mKey === targetMonthStr) {
        dailyTargetContext.push({
          date: d.format("YYYY-MM-DD"),
          total: o.total || 0
        });
      }
    });

    const prediction = await predictMonthlySales({
      monthlySalesTrend: monthlySummary,
      targetMonthDailyActuals: dailyTargetContext,
      inventoryCount: (await reportRepository.findAllProducts()).length,
      timestamp: new Date().toISOString(),
      isHistoricalRequest: isHistorical
    }, reqMonth || dayjs(targetMonthStr).format("MMMM"), reqYear ? parseInt(reqYear) : dayjs(targetMonthStr).year());

    // 3. Save to repository
    await predictionRepository.savePrediction(targetMonthStr, prediction);

    return NextResponse.json({ success: true, data: prediction });
  } catch (error: any) {
    console.error("[Neural Route] Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
