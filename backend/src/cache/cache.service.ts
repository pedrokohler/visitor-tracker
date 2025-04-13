import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as NodeCache from 'node-cache';
import { Events } from 'src/events';

const DEFAULT_TTL_IN_SECONDS = 600;

export type WrappedCacheManager = ReturnType<
  CacheService['createNamespaceWrappedCacheManager']
>;

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cacheManager: NodeCache;

  constructor(private eventEmitter: EventEmitter2) {
    this.cacheManager = new NodeCache({
      stdTTL: DEFAULT_TTL_IN_SECONDS,
      checkperiod: 0.5,
    });

    this.cacheManager.on('expired', (cacheKey: string, value: unknown) => {
      const { namespace, key } =
        this.extractNamespaceAndKeyFromCacheKey(cacheKey);

      this.eventEmitter.emit(Events.CACHE_EXPIRED, {
        namespace,
        key,
        value,
      });
    });
  }

  extractNamespaceAndKeyFromCacheKey(cacheKey: string) {
    const [namespace, key] = cacheKey.split('-');
    return { namespace, key };
  }

  generateKey(namespace: string, key: string): string {
    return `${namespace}-${key}`;
  }

  delete(namespace: string, key: string): number {
    const cacheKey = this.generateKey(namespace, key);
    return this.cacheManager.del(cacheKey);
  }

  get<T>(namespace: string, key: string): T | undefined {
    const cacheKey = this.generateKey(namespace, key);
    return this.cacheManager.get<T>(cacheKey);
  }

  set<T>(
    namespace: string,
    key: string,
    value: T,
    ttl: number | string = 0,
  ): boolean {
    const cacheKey = this.generateKey(namespace, key);
    return this.cacheManager.set<T>(cacheKey, value, ttl);
  }

  getAll<T>(namespace: string) {
    const keys = this.cacheManager.keys().filter((cacheKey) => {
      const { namespace: keyNamespace } =
        this.extractNamespaceAndKeyFromCacheKey(cacheKey);
      return keyNamespace === namespace;
    });

    return this.cacheManager.mget<T>(keys);
  }

  createNamespaceWrappedCacheManager(
    namespace: string,
    defaultTtlInSeconds: number | string = DEFAULT_TTL_IN_SECONDS,
  ) {
    const deleteFn = (key: string): number => {
      return this.delete(namespace, key);
    };

    const get = <T>(key: string) => {
      return this.get<T>(namespace, key);
    };

    const set = <T>(
      key: string,
      value: T,
      ttl: number | string = defaultTtlInSeconds,
    ) => {
      return this.set<T>(namespace, key, value, ttl);
    };

    const getAll = <T>() => {
      return this.getAll<T>(namespace);
    };

    return {
      delete: deleteFn,
      get,
      set,
      getAll,
    };
  }
}
