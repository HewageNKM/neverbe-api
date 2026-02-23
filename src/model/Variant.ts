import { Img } from "./Img";
import { Size } from "./Size";

export interface Variant {
  variantId: string;
  variantName: string;
  images: Img[];
  sizes: Size[];
}
