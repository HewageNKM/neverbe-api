import { reviewRepository } from "@/repositories/ReviewRepository";
import { Review } from "@/interfaces/Review";

/**
 * ReviewService - Business logic for product reviews
 */

export const getWebReviews = async (
  limit: number = 10,
  itemId?: string,
  source?: string,
) => {
  return reviewRepository.getLatestWebReviews(limit, itemId, source);
};

export const createReview = async (uid: string, userName: string, data: Partial<Review>) => {
  return reviewRepository.createReview({
    ...data,
    userId: uid,
    userName: userName,
  });
};

export const getUserReviews = async (uid: string) => {
  return reviewRepository.getReviewsByUserId(uid);
};

export const updateReview = async (uid: string, reviewId: string, data: any) => {
  // Verify ownership
  const reviews = await reviewRepository.getReviewsByUserId(uid);
  if (!reviews.some((r) => r.reviewId === reviewId)) {
    throw new Error("Review not found or ownership mismatch");
  }
  return reviewRepository.updateReview(reviewId, data);
};

export const deleteReview = async (uid: string, reviewId: string) => {
  // Verify ownership
  const reviews = await reviewRepository.getReviewsByUserId(uid);
  if (!reviews.some((r) => r.reviewId === reviewId)) {
    throw new Error("Review not found or ownership mismatch");
  }
  return reviewRepository.deleteReview(reviewId);
};

import { otherRepository } from "@/repositories/OtherRepository";
import { googleReviewSyncService } from "./GoogleReviewSyncService";

export const triggerBackgroundSync = async () => {
  try {
    const key = "google_reviews";
    const metadata = await otherRepository.getSyncMetadata(key);
    
    const lastSyncAt = metadata?.lastSyncAt ? new Date(metadata.lastSyncAt) : new Date(0);
    const now = new Date();
    
    // Sync if more than 24 hours ago
    const hoursSinceSync = (now.getTime() - lastSyncAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSync >= 24) {
      console.log(`[Background Sync] Last sync was ${hoursSinceSync.toFixed(2)} hours ago. Triggering sync...`);
      
      // Update metadata first to prevent concurrent triggers
      await otherRepository.updateSyncMetadata(key, { isSyncing: true, lastSyncAt: now.toISOString() });
      
      const placeId = "ChIJ2TyZoff_4joRgDt7is46uRk";
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      
      if (apiKey) {
        // We don't await this if we want it truly background, but for simple cloud functions,
        // it's safer to await it here if we call this from an API route.
        // However, the Places API call is very fast.
        await googleReviewSyncService.syncGoogleReviews(placeId, apiKey);
        await otherRepository.updateSyncMetadata(key, { isSyncing: false });
        console.log("[Background Sync] Sync completed successfully.");
      } else {
        console.error("[Background Sync] Missing API Key. Sync skipped.");
        await otherRepository.updateSyncMetadata(key, { isSyncing: false, lastSyncAt: lastSyncAt.toISOString() }); // Reset lastSyncAt
      }
    }
  } catch (error) {
    console.error("[Background Sync] Error during background sync:", error);
  }
};
