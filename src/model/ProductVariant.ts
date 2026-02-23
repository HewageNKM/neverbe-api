import { Img } from "./Img";

export interface ProductVariant {
    id?: string,
    variantId: string,
    variantName: string,
    images: Img[],
    sizes: string[],
    status: boolean,
}