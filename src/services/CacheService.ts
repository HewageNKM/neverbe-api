import { cacheRepository } from "@/repositories/CacheRepository";
import { Timestamp } from "firebase-admin/firestore";

/**
 * CacheService - Business logic for dashboard and session caching
 * Delegates persistence to cacheRepository
 */

const inMemoryCache = new Map<string, { data: any; expiry: number }>();

/**
 * Get data from cache (In-memory first, then repository)
 */
export const getCache = async (key: string): Promise<any | null> => {
  const now = Date.now();

  // 1. Check In-Memory
  const mem = inMemoryCache.get(key);
  if (mem && mem.expiry > now) {
    console.log(`[CacheService] Memory Hit: ${key}`);
    return mem.data;
  }

  // 2. Check Repository
  try {
    const cached = await cacheRepository.findByKey(key);
    if (cached) {
      const { data, expiry } = cached as { data: any; expiry: Timestamp };
      if (expiry.toMillis() > now) {
        console.log(`[CacheService] Repository Hit: ${key}`);
        // Backfill memory
        inMemoryCache.set(key, { data, expiry: expiry.toMillis() });
        return data;
      } else {
        console.log(`[CacheService] Repository Expired: ${key}`);
        await cacheRepository.deleteByKey(key);
      }
    }
  } catch (error) {
    console.error(`[CacheService] Get Error for ${key}:`, error);
  }

  return null;
};

/**
 * Set data to cache (Repository + In-memory)
 */
export const setCache = async (
  key: string,
  data: any,
  ttlHours: number = 24,
): Promise<void> => {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + ttlHours);
  const expiryTimestamp = Timestamp.fromDate(expiryDate);

  try {
    await cacheRepository.setWithExpiry(key, data, expiryTimestamp);
    inMemoryCache.set(key, { data, expiry: expiryDate.getTime() });
    console.log(`[CacheService] Cached: ${key} (TTL: ${ttlHours}h)`);
  } catch (error) {
    console.error(`[CacheService] Set Error for ${key}:`, error);
  }
};

/**
 * Clear specific cache key
 */
export const clearCache = async (key: string): Promise<void> => {
  inMemoryCache.delete(key);
  try {
    await cacheRepository.deleteByKey(key);
    console.log(`[CacheService] Cleared: ${key}`);
  } catch (error) {
    console.error(`[CacheService] Clear Error for ${key}:`, error);
  }
};
