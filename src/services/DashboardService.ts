import { productRepository } from "@/repositories/ProductRepository";
import { orderRepository } from "@/repositories/OrderRepository";
import { Order } from "@/model/Order";
import { PopularItem } from "@/model/PopularItem";
import { reportRepository } from "@/repositories/ReportRepository";

/**
 * Get total inventory valuation
 */
export const getInventoryValue = async (): Promise<InventoryValue> => {
  const products = await reportRepository.findAllProducts();
  let totalValue = 0;
  let productCount = 0;

  products.forEach((p) => {
    const buyingPrice = p.buyingPrice || 0;
    const stock = p.totalStock || p.currentStock || 0;
    totalValue += buyingPrice * stock;
    productCount++;
  });

  return {
    totalValue,
    productCount,
    averageValue: productCount > 0 ? totalValue / productCount : 0,
  };
};

/**
 * Get high-level profit margins
 */
export const getProfitMargins = async (): Promise<ProfitMargins> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const overview = await getOverviewByDateRange(startOfMonth, endOfMonth);

  // Gross Margin = (Gross Sales - COGS) / Gross Sales
  const grossMargin = overview.totalGrossSales > 0
    ? ((overview.totalGrossSales - overview.totalBuyingCost) / overview.totalGrossSales) * 100
    : 0;

  // Net Margin = Net Profit / Net Sales
  const netMargin = overview.totalNetSales > 0
    ? (overview.totalProfit / overview.totalNetSales) * 100
    : 0;

  return {
    grossMargin: Math.round(grossMargin * 100) / 100,
    netMargin: Math.round(netMargin * 100) / 100,
    operatingMargin: Math.round(netMargin * 0.8 * 100) / 100, // Estimated operating margin
  };
};

/**
 * Get revenue distribution by category
 */
export const getRevenueByCategory = async (): Promise<CategoryRevenue[]> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const orders = await orderRepository.findByStatusInDateRange(startOfMonth, endOfMonth);
  const categoryMap = new Map<string, number>();

  orders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const cat = item.categoryName || "Uncategorized";
        const revenue = (item.price || 0) * (item.quantity || 0);
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + revenue);
      });
    }
  });

  return Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Get monthly expense summary
 */
export const getExpenseSummary = async (): Promise<ExpenseSummary[]> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const expenses = await reportRepository.findExpensesForReport({
    start: startOfMonth,
    end: endOfMonth,
  });

  const categoryMap = new Map<string, number>();
  let totalAmount = 0;

  expenses.forEach((exp) => {
    const cat = exp.category || "General";
    const amount = exp.amount || 0;
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);
    totalAmount += amount;
  });

  return Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
  }));
};

/**
 * Dashboard Overview Response
 */
export interface DashboardOverview {
  totalOrders: number;
  totalGrossSales: number; // Gross Sale = total + discount - orderFee
  totalNetSales: number; // Net Sale = total - orderFee
  totalShipping: number; // Total shipping collected (pass-through)
  totalDiscount: number;
  totalBuyingCost: number; // Product COGS
  totalFees: number; // Transaction and other fees
  totalProfit: number; // Net Profit (after COGS, shipping, and fees)
}

export interface InventoryValue {
  totalValue: number;
  productCount: number;
  averageValue: number;
}

export interface ProfitMargins {
  grossMargin: number;
  netMargin: number;
  operatingMargin: number;
}

export interface CategoryRevenue {
  name: string;
  value: number;
}

export interface ExpenseSummary {
  category: string;
  amount: number;
  percentage: number;
}

/**
 * Yearly Sales Performance Response (for chart)
 */
export interface YearlySalesPerformance {
  website: number[]; // 12 months (0=Jan, 11=Dec)
  store: number[];
  year: number;
}

/**
 * Get daily snapshot for the dashboard (today's data)
 */
export const getDailySnapshot = async (): Promise<DashboardOverview> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return getOverviewByDateRange(startOfDay, endOfDay);
};

/**
 * Get overview data for a specific date range
 */
export const getOverviewByDateRange = async (
  startDate: Date,
  endDate: Date,
): Promise<DashboardOverview> => {
  try {
    const orders = await orderRepository.findByStatusInDateRange(startDate, endDate);

    // Collect unique product IDs for COGS calculation
    const productIds: Set<string> = new Set();
    orders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => { if (item.itemId) productIds.add(item.itemId); });
      }
    });

    // Fetch product data for buying prices in batch
    const products = await productRepository.findByIds(Array.from(productIds));
    const productPriceMap = new Map(products.map(p => [p.id, p.buyingPrice || 0]));

    // Calculate totals
    let totalOrders = 0;
    let totalGrossSales = 0;
    let totalNetSales = 0;
    let totalDiscount = 0;
    let totalBuyingCost = 0;
    let totalTransactionFee = 0;
    let totalFee = 0;
    let totalShipping = 0;

    orders.forEach((order) => {
      totalOrders++;
      const orderTotal = order.total || 0;
      const orderDiscount = order.discount || 0;
      const promoDiscount = order.promotionDiscount || 0;
      const orderShippingFee = order.shippingFee || 0;
      const orderTransactionFee = order.transactionFeeCharge || 0;
      const orderFee = order.fee || 0;

      const itemDiscounts = Array.isArray(order.items)
        ? order.items.reduce((sum, item) => sum + (item.discount || 0), 0)
        : 0;

      const allDiscounts = orderDiscount + promoDiscount + itemDiscounts;

      // Net Sale = total - orderFee
      const netSale = orderTotal - orderFee;
      totalNetSales += netSale;

      // Gross Sale (Sales) = total + allDiscounts - orderFee - orderShippingFee
      const grossSale = orderTotal + allDiscounts - orderFee - orderShippingFee;
      totalGrossSales += grossSale;

      totalShipping += orderShippingFee;
      totalDiscount += allDiscounts;

      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const buyingPrice = item.bPrice ?? productPriceMap.get(item.itemId) ?? 0;
          const quantity = item.quantity || 0;
          totalBuyingCost += buyingPrice * quantity;
        });
      }
      totalTransactionFee += orderTransactionFee;
      totalFee += orderFee;
    });

    const totalProfit = totalNetSales + totalFee - (totalBuyingCost + totalShipping + totalTransactionFee);

    return {
      totalOrders,
      totalGrossSales,
      totalNetSales,
      totalShipping,
      totalDiscount,
      totalBuyingCost,
      totalFees: totalFee,
      totalProfit,
    };
  } catch (error: any) {
    console.error("[DashboardService] Error:", error);
    throw error;
  }
};

/**
 * Get yearly sales performance for chart
 */
export const getYearlySalesPerformance = async (year?: number): Promise<YearlySalesPerformance> => {
  const currentYear = year || new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const orders = await orderRepository.findByStatusInDateRange(startOfYear, endOfYear);

  const websiteOrders = new Array(12).fill(0);
  const storeOrders = new Array(12).fill(0);

  orders.forEach((order) => {
    const createdAt = (order.createdAt as any)?.toDate?.() || new Date(order.createdAt as any);
    if (createdAt) {
      const monthIndex = createdAt.getMonth();
      const source = order.from?.toString().toLowerCase();
      if (source === "store") {
        storeOrders[monthIndex]++;
      } else {
        websiteOrders[monthIndex]++;
      }
    }
  });

  return { website: websiteOrders, store: storeOrders, year: currentYear };
};

export interface RecentOrder {
  orderId: string;
  paymentStatus: string;
  customerName: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  createdAt: string;
}

export const getRecentOrders = async (limitCount: number = 6): Promise<RecentOrder[]> => {
  const orders = await orderRepository.findRecent(limitCount);
  return orders.map((data) => {
    const netAmount = data.total || 0;
    const grossAmount = Array.isArray(data.items)
      ? data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : netAmount;
    const discountAmount = Math.max(0, grossAmount - netAmount - (data.shippingFee || 0) + (data.fee || 0));

    return {
      orderId: data.orderId || (data as any).id,
      paymentStatus: data.paymentStatus || "Unknown",
      customerName: data.customer?.name || "Guest Customer",
      grossAmount,
      discountAmount,
      netAmount,
      createdAt: (data.createdAt as any)?.toDate?.()?.toLocaleString() || String(data.createdAt),
    };
  });
};

export const getPopularItems = async (
  limit: number = 10,
  month: number,
  year: number,
): Promise<PopularItem[]> => {
  const startDay = new Date(year, month, 1);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(year, month + 1, 0);
  endDay.setHours(23, 59, 59, 999);

  const orders = await orderRepository.findPaidOrdersInDateRange(startDay, endDay);

  const itemsMap = new Map<string, number>();
  orders.forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const count = itemsMap.get(item.itemId) || 0;
        itemsMap.set(item.itemId, count + item.quantity);
      });
    }
  });

  const sortedEntries = Array.from(itemsMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const productIds = sortedEntries.map(([id]) => id);
  const products = await productRepository.findByIds(productIds);
  const productMap = new Map(products.map(p => [p.id, p]));

  return sortedEntries.map(([itemId, count]) => {
    const product = productMap.get(itemId);
    if (!product) return null;
    return { item: product as any, soldCount: count };
  }).filter(Boolean) as PopularItem[];
};

export interface LowStockItem {
  productId: string;
  productName: string;
  variantName: string;
  size: string;
  currentStock: number;
  thumbnail?: string;
}

export const getLowStockAlerts = async (threshold: number = 5, limit: number = 10): Promise<LowStockItem[]> => {
  return await productRepository.findLowStockAlerts(threshold, limit);
};

export interface MonthlyComparison {
  currentMonth: { orders: number; revenue: number; profit: number; };
  lastMonth: { orders: number; revenue: number; profit: number; };
  percentageChange: { orders: number; revenue: number; profit: number; };
}

export const getMonthlyComparison = async (): Promise<MonthlyComparison> => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [currentData, lastData] = await Promise.all([
    getOverviewByDateRange(currentMonthStart, currentMonthEnd),
    getOverviewByDateRange(lastMonthStart, lastMonthEnd),
  ]);

  const calcChange = (current: number, last: number): number => {
    if (last === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - last) / last) * 100);
  };

  return {
    currentMonth: { orders: currentData.totalOrders, revenue: currentData.totalNetSales, profit: currentData.totalProfit },
    lastMonth: { orders: lastData.totalOrders, revenue: lastData.totalNetSales, profit: lastData.totalProfit },
    percentageChange: {
      orders: calcChange(currentData.totalOrders, lastData.totalOrders),
      revenue: calcChange(currentData.totalNetSales, lastData.totalNetSales),
      profit: calcChange(currentData.totalProfit, lastData.totalProfit),
    },
  };
};

export interface OrderStatusDistribution {
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
}

export const getOrderStatusDistribution = async (): Promise<OrderStatusDistribution> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const orders = await orderRepository.findByStatusInDateRange(startOfMonth, endOfMonth, ["Paid", "PAID", "Pending", "Processing", "Completed", "Cancelled"]);

  const distribution: OrderStatusDistribution = { pending: 0, processing: 0, completed: 0, cancelled: 0 };
  orders.forEach((order) => {
    const status = order.status?.toLowerCase() || "pending";
    if (status === "pending") distribution.pending++;
    else if (status === "processing") distribution.processing++;
    else if (status === "completed") distribution.completed++;
    else if (status === "cancelled") distribution.cancelled++;
  });

  return distribution;
};

export interface PendingOrdersCount {
  pendingPayment: number;
  pendingFulfillment: number;
  total: number;
}

export const getPendingOrdersCount = async (): Promise<PendingOrdersCount> => {
  const [pendingPayment, pendingFulfillment] = await Promise.all([
    orderRepository.countByPaymentStatus("Pending"),
    orderRepository.countByStatusAndPayment("Paid", ["Pending", "Processing"]),
  ]);

  return { pendingPayment, pendingFulfillment, total: pendingPayment + pendingFulfillment };
};

export interface WeeklyTrends { labels: string[]; orders: number[]; revenue: number[]; }

export const getWeeklyTrends = async (): Promise<WeeklyTrends> => {
  const now = new Date();
  const labels: string[] = [];
  const orders: number[] = [];
  const revenue: number[] = [];

  const days = Array.from({ length: 7 }, (_, i) => 6 - i);
  const trends = await Promise.all(days.map(async (i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));

    const dayOrders = await orderRepository.findPaidOrdersInDateRange(start, end);
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      orderCount: dayOrders.length,
      revenueSum: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };
  }));

  trends.forEach(t => {
    labels.push(t.label);
    orders.push(t.orderCount);
    revenue.push(t.revenueSum);
  });

  return { labels, orders, revenue };
};


