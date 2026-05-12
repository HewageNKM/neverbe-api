import { orderRepository } from "@/repositories/OrderRepository";
import { pettyCashRepository, paymentRecordRepository } from "@/repositories/FinanceRepositories";
import { getBankAccounts } from "./BankAccountService";
import { getInvoiceAgingSummary } from "./SupplierInvoiceService";
import { formatToSLDate, getNowSL, parseToDayjs } from "./UtilService";
import dayjs from "../utils/dayjs";

/**
 * FinanceDashboardService - Business logic for financial analytics
 * Delegates data access to repositories
 */

export interface FinanceDashboardData {
  cards: {
    totalBankBalance: number;
    totalPayable: number;
    monthlyExpenses: number;
    monthlyIncome: number;
  };
  expenseBreakdown: { category: string; amount: number; color: string }[];
  recentTransactions: any[];
  cashFlow: { date: string; income: number; expense: number }[];
}

export const getFinanceDashboardData = async (): Promise<FinanceDashboardData> => {
  const banks = await getBankAccounts();
  const totalBankBalance = banks.reduce((acc, b) => acc + b.currentBalance, 0);

  const invoiceSummary = await getInvoiceAgingSummary();

  const now = getNowSL();
  const startOfMonth = now.startOf("month").toDate();

  // Use repositories instead of adminFirestore
  const pettyCashData = await pettyCashRepository.findForDashboard(startOfMonth);
  const paymentRecordsData = await paymentRecordRepository.findForDashboard(startOfMonth);
  const ordersData = await orderRepository.findForReport({ start: startOfMonth, end: now.toDate() });

  let monthlyExpenses = 0;
  let monthlyIncome = 0;
  const categoryMap: Record<string, number> = {};
  const cashFlowMap: Record<string, { income: number; expense: number }> = {};

  // Process Orders (Income)
  ordersData.forEach((data: any) => {
    if (data.paymentStatus?.toUpperCase() === "PAID") {
      const amount = Number(data.total) || 0;
      const date = formatToSLDate(data.createdAt);
      if (!cashFlowMap[date]) cashFlowMap[date] = { income: 0, expense: 0 };
      monthlyIncome += amount;
      cashFlowMap[date].income += amount;
    }
  });

  // Process Petty Cash / Expenses
  pettyCashData.forEach((data) => {
    const amount = Number(data.amount) || 0;
    const date = formatToSLDate(data.date);
    if (!cashFlowMap[date]) cashFlowMap[date] = { income: 0, expense: 0 };

    if (data.type === "expense") {
      monthlyExpenses += amount;
      const cat = data.category || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + amount;
      cashFlowMap[date].expense += amount;
    } else {
      monthlyIncome += amount;
      cashFlowMap[date].income += amount;
    }
  });

  // Process Payment Records (Supplier Payments)
  paymentRecordsData.forEach((data) => {
    const amount = Number(data.amount) || 0;
    const date = formatToSLDate(data.date);
    if (!cashFlowMap[date]) cashFlowMap[date] = { income: 0, expense: 0 };
    monthlyExpenses += amount;
    const cat = data.category || "Supplier Payment";
    categoryMap[cat] = (categoryMap[cat] || 0) + amount;
    cashFlowMap[date].expense += amount;
  });

  const colors = ["#16a34a", "#10b981", "#34d399", "#059669", "#047857"];
  const expenseBreakdown = Object.entries(categoryMap)
    .map(([category, amount], index) => ({ category, amount, color: colors[index % colors.length] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const cashFlow = Object.entries(cashFlowMap)
    .map(([date, vals]) => ({ date, ...vals }))
    .sort((a, b) => (parseToDayjs(a.date)?.valueOf() || 0) - (parseToDayjs(b.date)?.valueOf() || 0));

  const recentPetty = await pettyCashRepository.findRecent(5);
  const recentPayments = await paymentRecordRepository.findRecent(5);

  const transactions = [
    ...recentPetty.map((data) => ({
      id: data.id,
      ...data,
      dateVal: parseToDayjs(data.date)?.valueOf() || 0,
      date: formatToSLDate(data.date, "DD/MM/YYYY"),
      category: data.category,
      amount: Number(data.amount),
      type: data.type,
      note: data.note || data.description,
    })),
    ...recentPayments.map((data) => ({
      id: data.id,
      ...data,
      dateVal: parseToDayjs(data.date)?.valueOf() || 0,
      date: formatToSLDate(data.date, "DD/MM/YYYY"),
      category: data.category,
      amount: Number(data.amount),
      type: "expense",
      note: data.description,
    })),
  ]
    .sort((a, b) => b.dateVal - a.dateVal)
    .slice(0, 5);

  return {
    cards: {
      totalBankBalance,
      totalPayable: invoiceSummary.totalPayable || 0,
      monthlyExpenses,
      monthlyIncome,
    },
    expenseBreakdown,
    recentTransactions: transactions,
    cashFlow,
  };
};
