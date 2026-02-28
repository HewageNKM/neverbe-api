import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/firebase/firebaseAdmin";
import { BagItem } from "@/interfaces/BagItem";

export const POST = async (req: NextRequest) => {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ cost: 0 });
    }

    // 1. Calculate Total Weight
    let totalWeight = 0;
    const productCache = new Map();

    const SHIPPING_FLAT_RATE_1 = 380;
    const SHIPPING_FLAT_RATE_2 = 500;

    // Prefetch products to get weights
    // Ideally we optimize this, but for checkout (few items) simple loop or Promise.all is fine
    for (const item of items) {
      // Check cache first
      if (productCache.has(item.itemId)) {
        const w = productCache.get(item.itemId);
        totalWeight += w * item.quantity;
        continue;
      }

      const doc = await adminFirestore
        .collection("products")
        .doc(item.itemId)
        .get();
      if (doc.exists) {
        const data = doc.data();
        const weightInGrams = data?.weight || 1000;
        const weightInKg = weightInGrams / 1000;
        productCache.set(item.itemId, weightInKg);
        totalWeight += weightInKg * item.quantity;
      } else {
        // If product not found, default 1kg
        totalWeight += 1 * item.quantity;
      }
    }

    // 2. Fetch Active Shipping Rules
    const rulesSnapshot = await adminFirestore
      .collection("shipping_rules")
      .where("isActive", "==", true)
      .get();

    let cost = 0;
    const totalItems = items.reduce(
      (acc: number, item: any) => acc + item.quantity,
      0
    );

    if (!rulesSnapshot.empty) {
      const rules = rulesSnapshot.docs.map((doc) => doc.data());

      // Find matching rule
      const match = rules.find(
        (r: any) => totalWeight >= r.minWeight && totalWeight < r.maxWeight
      );

      if (match) {
        if (
          match.isIncremental &&
          match.baseWeight !== undefined &&
          match.perKgRate !== undefined
        ) {
          const extraWeight = Math.max(0, totalWeight - match.baseWeight);
          const extraCost = Math.ceil(extraWeight) * match.perKgRate;
          cost = match.rate + extraCost;
        } else {
          cost = match.rate;
        }
      } else {
        // Fallback: Max rule or standard logic?
        // Sort by maxWeight desc
        rules.sort((a: any, b: any) => b.maxWeight - a.maxWeight);
        if (totalWeight >= rules[0].maxWeight) {
          const maxRule = rules[0];
          if (
            maxRule.isIncremental &&
            maxRule.baseWeight !== undefined &&
            maxRule.perKgRate !== undefined
          ) {
            const extraWeight = Math.max(0, totalWeight - maxRule.baseWeight);
            const extraCost = Math.ceil(extraWeight) * maxRule.perKgRate;
            cost = maxRule.rate + extraCost;
          } else {
            cost = maxRule.rate;
          }
        } else {
          // Fallback legacy
          cost = totalItems <= 1 ? SHIPPING_FLAT_RATE_1 : SHIPPING_FLAT_RATE_2;
        }
      }
    } else {
      // Fallback Legacy
      cost =
        totalItems === 0
          ? 0
          : totalItems === 1
          ? SHIPPING_FLAT_RATE_1
          : SHIPPING_FLAT_RATE_2;
    }

    return NextResponse.json({ cost });
  } catch (error) {
    console.error("Shipping calc error:", error);
    // Fallback safe
    return NextResponse.json({ cost: 500 });
  }
};
