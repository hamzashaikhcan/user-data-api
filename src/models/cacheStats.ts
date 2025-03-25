export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    maxSize: number;
    hitRate: number;
    responseTimesMs: {
      cached: number[];
      uncached: number[];
    };
    averageResponseTimeMs: {
      cached: number;
      uncached: number;
      overall: number;
    };
  }
  
  export class CacheStatsTracker {
    private hits: number = 0;
    private misses: number = 0;
    private responseTimesCached: number[] = [];
    private responseTimesUncached: number[] = [];
  
    recordHit(responseTimeMs: number): void {
      this.hits++;
      this.responseTimesCached.push(responseTimeMs);
    }
  
    recordMiss(responseTimeMs: number): void {
      this.misses++;
      this.responseTimesUncached.push(responseTimeMs);
    }
  
    getStats(currentSize: number, maxSize: number): CacheStats {
      const totalRequests = this.hits + this.misses;
      const hitRate = totalRequests === 0 ? 0 : (this.hits / totalRequests) * 100;
  
      const avgCachedTime = this.calculateAverage(this.responseTimesCached);
      const avgUncachedTime = this.calculateAverage(this.responseTimesUncached);
      
      const allTimes = [...this.responseTimesCached, ...this.responseTimesUncached];
      const avgOverallTime = this.calculateAverage(allTimes);
  
      return {
        hits: this.hits,
        misses: this.misses,
        size: currentSize,
        maxSize,
        hitRate,
        responseTimesMs: {
          cached: this.responseTimesCached,
          uncached: this.responseTimesUncached
        },
        averageResponseTimeMs: {
          cached: avgCachedTime,
          uncached: avgUncachedTime,
          overall: avgOverallTime
        }
      };
    }
  
    reset(): void {
      this.hits = 0;
      this.misses = 0;
      this.responseTimesCached = [];
      this.responseTimesUncached = [];
    }
  
    private calculateAverage(array: number[]): number {
      if (array.length === 0) return 0;
      const sum = array.reduce((acc, val) => acc + val, 0);
      return sum / array.length;
    }
  }