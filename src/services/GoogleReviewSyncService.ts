import axios from "axios";
import { reviewRepository } from "../repositories/ReviewRepository";
import { Review } from "../interfaces/Review";

/**
 * Service to sync reviews from Google Business Profile (via Places API)
 */
export class GoogleReviewSyncService {
  private static GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1/places";

  /**
   * Sync reviews for a given Place ID
   * @param placeId Google Place ID
   * @param apiKey Google Places API Key
   */
  async syncGoogleReviews(placeId: string, apiKey: string): Promise<number> {
    try {
      const response = await axios.get(`${GoogleReviewSyncService.GOOGLE_PLACES_API_URL}/${placeId}`, {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "reviews",
          "Referer": process.env.WEB_BASE_URL || "https://neverbe.lk",
        },
      });

      const result = response.data;
      if (!result || !result.reviews) {
        console.warn("[Google Sync] No reviews found for placeId:", placeId, response.data);
        return 0;
      }

      const googleReviews = result.reviews;
      let syncCount = 0;

      for (const gr of googleReviews) {
        const externalId = gr.name || `google_${gr.publishTime}`;
        
        // Check if review already exists
        const existing = await reviewRepository.getByExternalId(externalId);
        if (existing) {
          // If it exists but is pending, approve it (since it's from Google)
          if (existing.status === "PENDING") {
            console.log("[Google Sync] Approving existing pending Google review:", externalId);
            await reviewRepository.updateReview(existing.reviewId!, { status: "APPROVED" });
            syncCount++;
          } else {
            console.log("[Google Sync] Google Review already exists and is approved:", externalId);
          }
          continue;
        }

        const reviewData: Partial<Review> = {
          userName: gr.authorAttribution?.displayName || "Google User",
          rating: gr.rating,
          review: gr.text?.text || "",
          status: "APPROVED",
          source: "GOOGLE",
          externalId: externalId,
          createdAt: gr.publishTime || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false,
        };

        await reviewRepository.createReview(reviewData);
        syncCount++;
        console.log("[Google Sync] Synced new review:", externalId);
      }

      return syncCount;
    } catch (error: any) {
      console.error("[Google Sync] Error syncing reviews:", error.message);
      throw error;
    }
  }
}

export const googleReviewSyncService = new GoogleReviewSyncService();
