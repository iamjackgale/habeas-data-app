import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const DEFAULT_TTL = 3600000; // 1 hour in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  url: string;
}

/**
 * Generate a cache key from a URL
 */
function generateCacheKey(url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  return `${hash}.json`;
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache directory:', error);
  }
}

/**
 * Get cached data by URL if it exists and is not expired
 */
export async function getCachedData<T>(url: string): Promise<T | null> {
  try {
    await ensureCacheDir();
    const cacheKey = generateCacheKey(url);
    const cachePath = path.join(CACHE_DIR, cacheKey);
    
    console.log(`[Cache] Checking cache for: ${url}`);
    console.log(`[Cache] Cache key: ${cacheKey}`);
    
    const content = await fs.readFile(cachePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(content);
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Check if cache is still valid
    if (age < entry.ttl) {
      console.log(`[Cache] ✓ HIT - Age: ${Math.round(age / 1000)}s / TTL: ${Math.round(entry.ttl / 1000)}s`);
      return entry.data;
    } else {
      console.log(`[Cache] ✗ EXPIRED - Age: ${Math.round(age / 1000)}s / TTL: ${Math.round(entry.ttl / 1000)}s`);
      // Remove expired cache file
      await fs.unlink(cachePath).catch(() => {});
      return null;
    }
  } catch (error) {
    // Cache miss or error reading cache
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[Cache] Read error:', error);
    } else {
      console.log('[Cache] ✗ MISS - No cached entry found');
    }
    return null;
  }
}

/**
 * Set cached data with URL as key
 */
export async function setCachedData<T>(
  url: string,
  data: T,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    await ensureCacheDir();
    const cacheKey = generateCacheKey(url);
    const cachePath = path.join(CACHE_DIR, cacheKey);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      url, // Store URL for debugging
    };
    
    await fs.writeFile(cachePath, JSON.stringify(entry, null, 2), 'utf-8');
    console.log(`[Cache] ✓ STORED - TTL: ${Math.round(ttl / 1000)}s - ${url}`);
  } catch (error) {
    console.error('[Cache] Write error:', error);
  }
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    await Promise.all(
      files.map(file => fs.unlink(path.join(CACHE_DIR, file)))
    );
    console.log(`Cleared ${files.length} cache files`);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Clear expired cache entries
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    const now = Date.now();
    let cleaned = 0;
    
    for (const file of files) {
      const cachePath = path.join(CACHE_DIR, file);
      try {
        const content = await fs.readFile(cachePath, 'utf-8');
        const entry: CacheEntry<any> = JSON.parse(content);
        const age = now - entry.timestamp;
        
        if (age >= entry.ttl) {
          await fs.unlink(cachePath);
          cleaned++;
        }
      } catch (error) {
        // If we can't read/parse the file, remove it
        await fs.unlink(cachePath).catch(() => {});
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache files`);
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}
