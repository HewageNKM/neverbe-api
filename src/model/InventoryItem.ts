export interface InventoryItem {
    id?: string,
    productId: string,   
    productName?: string,
    variantId: string,
    variantName?: string,
    size: string,
    stockId: string, 
    stockName?: string,
    quantity: number, 
}