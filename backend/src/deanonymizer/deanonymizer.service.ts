import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { CacheService, WrappedCacheManager } from 'src/cache/cache.service';
import { DeanonymizerResponse } from './types';
import { catchError, firstValueFrom } from 'rxjs';

const URL = 'http://localhost:4830/deanonymize';
const IP_NOT_FOUND_ERROR = 'Data not found for IP';
const MAX_RETRIES = 5;
@Injectable()
export class DeanonymizerService {
  private readonly logger = new Logger(DeanonymizerService.name);
  private readonly CACHE_NAMESPACE = 'DEANONYMIZER';
  private readonly cacheManager: WrappedCacheManager;

  constructor(
    private cacheService: CacheService,
    private httpService: HttpService,
  ) {
    this.cacheManager = this.cacheService.createNamespaceWrappedCacheManager(
      this.CACHE_NAMESPACE,
    );
  }

  async deanomyizeIp(
    ip: string,
    retries: number = 0,
  ): Promise<DeanonymizerResponse | undefined> {
    const cachedValue = this.cacheManager.get<DeanonymizerResponse>(ip);

    if (cachedValue) {
      this.logger.debug(`Deanonymized data from CACHE:  ${ip}`);
      return cachedValue;
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService
          .post<DeanonymizerResponse>(URL, {
            ip,
          })
          .pipe(
            catchError((error: AxiosError) => {
              if (error.status === 404) {
                throw new Error(IP_NOT_FOUND_ERROR);
              }

              throw new Error(
                `An error happened while fetching: ${error.status} ${error.code} ${error.response?.data as string}`,
              );
            }),
          ),
      );

      this.logger.debug(`Deanonymized data from REQUEST: ${ip}:`);
      this.cacheManager.set<DeanonymizerResponse>(ip, data);
      return data;
    } catch (error) {
      if ((error as Error).message === IP_NOT_FOUND_ERROR) {
        this.logger.debug(`${IP_NOT_FOUND_ERROR}: ${ip}`);
        return;
      }

      if (retries >= MAX_RETRIES) {
        this.logger.error((error as Error).message);
        return;
      }

      return this.retry(ip, retries + 1);
    }
  }

  async retry(
    ip: string,
    retries: number,
  ): Promise<DeanonymizerResponse | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        void this.deanomyizeIp(ip, retries).then((result) => resolve(result));
      }, 200);
    });
  }
}
