interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface StorageConfig {
  sessionKey: string | number;
  meetingKey?: string | number;
}

class DataStorage {
  private static instance: DataStorage;
  private cache = new Map<string, CacheItem<any>>();
  private static CACHE_STATIC_DURATION = 30 * 60 * 1000
  private static CACHE_DYNAMIC_DURATION = 30 * 60 * 1000
  
  // TTL configurations in milliseconds
  private readonly TTL_CONFIG = {
    // Static data - longer cache
    drivers: DataStorage.CACHE_STATIC_DURATION,
    session: DataStorage.CACHE_STATIC_DURATION,        
    meeting: DataStorage.CACHE_STATIC_DURATION,        
    
    // Dynamic data - shorter cache
    laps: DataStorage.CACHE_DYNAMIC_DURATION,                
    position: DataStorage.CACHE_DYNAMIC_DURATION,            
    stint: DataStorage.CACHE_DYNAMIC_DURATION,              
    raceControl: DataStorage.CACHE_DYNAMIC_DURATION,         
    pit: DataStorage.CACHE_DYNAMIC_DURATION,                
    weather: DataStorage.CACHE_DYNAMIC_DURATION,             
  };

  static getInstance(): DataStorage {
    if (!DataStorage.instance) {
      DataStorage.instance = new DataStorage();
    }
    return DataStorage.instance;
  }

  private getCacheKey(dataType: string, config: StorageConfig): string {
    if (dataType === 'meeting') {
      return `meeting_${config.meetingKey}`;
    }
    return `${dataType}_${config.sessionKey}`;
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  // Store data with appropriate TTL
  set<T>(dataType: string, data: T, config: StorageConfig): void {
    const key = this.getCacheKey(dataType, config);
    const ttl = this.TTL_CONFIG[dataType as keyof typeof this.TTL_CONFIG] || 5 * 60 * 1000; // default 5 min
    
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Store in memory cache
    this.cache.set(key, cacheItem);
    
    // Also store in sessionStorage for persistence
    try {
      sessionStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn(`Failed to store ${dataType} in sessionStorage:`, error);
    }
  }

  // Get data from cache
  get<T>(dataType: string, config: StorageConfig): T | null {
    const key = this.getCacheKey(dataType, config);
    
    // Try memory cache first
    let cacheItem = this.cache.get(key);
    
    // If not in memory, try sessionStorage
    if (!cacheItem) {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          cacheItem = JSON.parse(stored);
          // Restore to memory cache
          this.cache.set(key, cacheItem);
        }
      } catch (error) {
        console.warn(`Failed to retrieve ${dataType} from sessionStorage:`, error);
      }
    }

    if (!cacheItem || this.isExpired(cacheItem)) {
      return null;
    }

    return cacheItem.data;
  }

  // Check if data exists and is fresh
  has(dataType: string, config: StorageConfig): boolean {
    return this.get(dataType, config) !== null;
  }

  // Clear specific data type
  clear(dataType: string, config: StorageConfig): void {
    const key = this.getCacheKey(dataType, config);
    this.cache.delete(key);
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to clear ${dataType} from sessionStorage:`, error);
    }
  }

  // Clear all data for a session
  clearSession(sessionKey: string | number): void {
    const keysToRemove: string[] = [];
    
    // Clear memory cache
    for (const [key] of this.cache) {
      if (key.includes(`_${sessionKey}`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to clear ${key} from sessionStorage:`, error);
      }
    });
  }

  // Clear all data for a meeting
  clearMeeting(meetingKey: string | number): void {
    const key = `meeting_${meetingKey}`;
    this.cache.delete(key);
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to clear meeting data from sessionStorage:`, error);
    }
  }

  // Get cache statistics
  getStats(): { memorySize: number; sessionStorageSize: number } {
    const memorySize = this.cache.size;
    let sessionStorageSize = 0;
    
    try {
      sessionStorageSize = sessionStorage.length;
    } catch (error) {
      console.warn('Failed to get sessionStorage size:', error);
    }
    
    return { memorySize, sessionStorageSize };
  }

  // Clean expired items
  cleanup(): void {
    const keysToRemove: string[] = [];
    
    for (const [key, item] of this.cache) {
      if (this.isExpired(item)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to cleanup ${key} from sessionStorage:`, error);
      }
    });
  }
}

// Export singleton instance
export const dataStorage = DataStorage.getInstance();

// Helper functions for common operations
export const storageHelpers = {
  // Store session-based data
  storeSessionData: <T>(dataType: string, data: T, sessionKey: string | number) => {
    dataStorage.set(dataType, data, { sessionKey });
  },

  // Store meeting data
  storeMeetingData: <T>(data: T, meetingKey: string | number) => {
    dataStorage.set('meeting', data, { sessionKey: '', meetingKey });
  },

  // Get session-based data
  getSessionData: <T>(dataType: string, sessionKey: string | number): T | null => {
    return dataStorage.get<T>(dataType, { sessionKey });
  },

  // Get meeting data
  getMeetingData: <T>(meetingKey: string | number): T | null => {
    return dataStorage.get<T>('meeting', { sessionKey: '', meetingKey });
  },

  // Check if session data exists
  hasSessionData: (dataType: string, sessionKey: string | number): boolean => {
    return dataStorage.has(dataType, { sessionKey });
  },

  // Check if meeting data exists
  hasMeetingData: (meetingKey: string | number): boolean => {
    return dataStorage.has('meeting', { sessionKey: '', meetingKey });
  }
};

export default dataStorage;
