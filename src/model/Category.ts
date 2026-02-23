export interface Category {
  id?: string;
  name: string;
  description?: string;
  status: boolean;
  isDeleted?: boolean;
  createdAt?: FirebaseFirestore.Timestamp | string;
  updatedAt?: FirebaseFirestore.Timestamp | string;
}
