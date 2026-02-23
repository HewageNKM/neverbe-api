export interface Payment {
  amount: number;
  paymentMethod: string;
  paymentMethodId?: string;
  id: string;
  cardNumber: string;
}
