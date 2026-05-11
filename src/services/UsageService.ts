import { usageRepository } from "@/repositories/UsageRepository";

/**
 * UsageService - Business logic for AI/ML usage tracking
 * Delegates data access to usageRepository
 */

export const logUsage = async (
  source: "TF" | "GEMINI" | "HYBRID",
  durationMs: number,
  metadata: Record<string, any> = {},
): Promise<void> => {
  try {
    await usageRepository.log(source, durationMs, metadata);
    console.log(`[UsageService] Logged ${source} usage: ${durationMs}ms`);
  } catch (error) {
    console.error(`[UsageService] Error for ${source} log:`, error);
  }
};
