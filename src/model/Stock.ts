export interface Stock {
  id?: string
  name: string;
  address?: string;
  status: boolean; 
  tags?: string[];
  isDeleted?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}