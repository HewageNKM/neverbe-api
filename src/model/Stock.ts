export interface Stock {
  id?: string
  name: string;
  address?: string;
  status: boolean; 
  createdAt?: string | Date;
  updatedAt?: string | Date;
}