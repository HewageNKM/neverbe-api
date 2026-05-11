import { Timestamp } from "@firebase/firestore";

import { Img } from "../model/Img";

export interface Review {
  reviewId: string;
  itemId: string;
  rating: number;
  review: string;
  userId: string;
  userName: string;
  images?: Img[];
  source?: "GOOGLE" | "WEB";
  externalId?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  isDeleted?: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
