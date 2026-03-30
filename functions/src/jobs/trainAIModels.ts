import { onSchedule } from "firebase-functions/v2/scheduler";
import { updateHybridIntelligence } from "../services/HybridIntelligenceService";
import * as logger from "firebase-functions/logger";

export const trainAIModels = onSchedule("every 60 minutes", async (event) => {
  logger.info("[trainAIModels] Starting scheduled ML training job...");
  try {
    const result = await updateHybridIntelligence();
    logger.info("[trainAIModels] Success:", result.data.generatedAt);
  } catch (error) {
    logger.error("[trainAIModels] Fatal error in ML job:", error);
  }
});
