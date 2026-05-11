/**
 * Time Synchronization Service
 * Manages server clock offset to ensure all clients show synchronized timers
 */

const STORAGE_KEY = 'tokshop_time_sync';
const OFFSET_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

interface TimeSyncData {
  offsetMs: number;
  lastSyncedAt: number;
  source: 'socket' | 'http' | 'initial';
}

class TimeSyncService {
  private offsetMs: number = 0;
  private lastSyncedAt: number = 0;
  private source: 'socket' | 'http' | 'initial' = 'initial';
  private subscribers: Set<() => void> = new Set();

  constructor() {
    // Load from localStorage on init
    this.loadFromStorage();
  }

  /**
   * Initialize or update offset from server timestamp
   */
  updateFromServerTime(serverTime: number, source: 'socket' | 'http' = 'socket'): void {
    const localTime = Date.now();
    const newOffset = serverTime - localTime;
    
    // Only update if this is a fresher source or offset changed significantly
    const offsetChanged = Math.abs(newOffset - this.offsetMs) > 500; // 500ms threshold
    const isFresherSource = source === 'socket' && this.source === 'http';
    
    if (offsetChanged || isFresherSource || this.isExpired()) {
      this.offsetMs = newOffset;
      this.lastSyncedAt = localTime;
      this.source = source;
      
      console.log('⏰ Time sync updated:', {
        offsetMs: this.offsetMs,
        offsetSec: (this.offsetMs / 1000).toFixed(2),
        source: this.source,
        serverTime,
        localTime
      });
      
      this.saveToStorage();
      this.notifySubscribers();
    }
  }

  /**
   * Get current server offset in milliseconds
   */
  getOffset(): number {
    if (this.isExpired()) {
      console.warn('⚠️ Time sync offset expired, using 0 until next sync');
      return 0;
    }
    return this.offsetMs;
  }

  /**
   * Get current time adjusted for server offset
   */
  adjustedNow(): number {
    return Date.now() + this.getOffset();
  }

  /**
   * Check if current offset is expired
   */
  isExpired(): boolean {
    if (this.lastSyncedAt === 0) return true;
    return Date.now() - this.lastSyncedAt > OFFSET_EXPIRY_MS;
  }

  /**
   * Subscribe to offset updates
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of offset change
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data: TimeSyncData = {
        offsetMs: this.offsetMs,
        lastSyncedAt: this.lastSyncedAt,
        source: this.source
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save time sync to localStorage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: TimeSyncData = JSON.parse(stored);
        
        // Only use if not expired
        if (Date.now() - data.lastSyncedAt < OFFSET_EXPIRY_MS) {
          this.offsetMs = data.offsetMs;
          this.lastSyncedAt = data.lastSyncedAt;
          this.source = data.source;
          
          console.log('⏰ Time sync loaded from storage:', {
            offsetMs: this.offsetMs,
            offsetSec: (this.offsetMs / 1000).toFixed(2),
            age: ((Date.now() - this.lastSyncedAt) / 1000).toFixed(1) + 's'
          });
        } else {
          console.log('⏰ Stored time sync expired, waiting for fresh sync');
        }
      }
    } catch (error) {
      console.error('Failed to load time sync from localStorage:', error);
    }
  }

  /**
   * Clear stored offset (for testing/debugging)
   */
  clear(): void {
    this.offsetMs = 0;
    this.lastSyncedAt = 0;
    this.source = 'initial';
    localStorage.removeItem(STORAGE_KEY);
    this.notifySubscribers();
  }

  /**
   * Get sync status info
   */
  getStatus() {
    return {
      offsetMs: this.offsetMs,
      offsetSec: (this.offsetMs / 1000).toFixed(2),
      lastSyncedAt: this.lastSyncedAt,
      age: this.lastSyncedAt ? ((Date.now() - this.lastSyncedAt) / 1000).toFixed(1) + 's' : 'never',
      source: this.source,
      expired: this.isExpired()
    };
  }
}

// Singleton instance
export const timeSync = new TimeSyncService();

// Helper to calculate remaining time for auctions
export function getAuctionRemainingTime(endTime: number): number {
  const adjustedNow = timeSync.adjustedNow();
  return Math.floor((endTime - adjustedNow) / 1000);
}
