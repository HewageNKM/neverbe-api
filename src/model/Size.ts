export interface Size {
  id?: string;
  name: string;
  status: boolean;
  isDeleted?: boolean;
  createdAt?: FirebaseFirestore.Timestamp | string;
  updatedAt?: FirebaseFirestore.Timestamp | string;
}
