import { shippingRepository } from "@/repositories/ShippingRepository";
import { productRepository } from "@/repositories/ProductRepository";

export const calculateShippingCost = async (items: any[]) => {
  if (!items || items.length === 0) return 0;

  const SHIPPING_FLAT_RATE_1 = 380;
  const SHIPPING_FLAT_RATE_2 = 500;

  // 1. Calculate Total Weight
  let totalWeight = 0;

  for (const item of items) {
    const product = await productRepository.findById(item.itemId);
    if (product) {
      const weightInGrams = product.weight || 1000;
      const weightInKg = weightInGrams / 1000;
      totalWeight += weightInKg * item.quantity;
    } else {
      totalWeight += 1 * item.quantity;
    }
  }

  // 2. Fetch Active Shipping Rules
  const rules = await shippingRepository.getActiveRules();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  let cost = 0;

  if (rules.length > 0) {
    // Find matching rule
    const match = rules.find(
      (r) => totalWeight >= r.minWeight && totalWeight < r.maxWeight
    );

    if (match) {
      if (match.isIncremental && match.baseWeight !== undefined && match.perKgRate !== undefined) {
        const extraWeight = Math.max(0, totalWeight - match.baseWeight);
        const extraCost = Math.ceil(extraWeight) * match.perKgRate;
        cost = match.rate + extraCost;
      } else {
        cost = match.rate;
      }
    } else {
      // Fallback: Max rule or standard logic?
      rules.sort((a, b) => b.maxWeight - a.maxWeight);
      if (totalWeight >= rules[0].maxWeight) {
        const maxRule = rules[0];
        if (maxRule.isIncremental && maxRule.baseWeight !== undefined && maxRule.perKgRate !== undefined) {
          const extraWeight = Math.max(0, totalWeight - maxRule.baseWeight);
          const extraCost = Math.ceil(extraWeight) * maxRule.perKgRate;
          cost = maxRule.rate + extraCost;
        } else {
          cost = maxRule.rate;
        }
      } else {
        cost = totalItems <= 1 ? SHIPPING_FLAT_RATE_1 : SHIPPING_FLAT_RATE_2;
      }
    }
  } else {
    cost = totalItems === 0 ? 0 : totalItems === 1 ? SHIPPING_FLAT_RATE_1 : SHIPPING_FLAT_RATE_2;
  }

  return cost;
};
