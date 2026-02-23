import { Size } from "./Size";

export interface StocksReport {
  type: "shoes" | "sandals" | "accessories";
  data: [
    {
      itemId: string;
      manufacturer: string;
      brand: string;
      itemName: string;
      data: [
        {
          variantId: string;
          variantName: string;
          stock: Size[];
        }
      ];
    }
  ];
}
