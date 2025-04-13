import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { CacheService, WrappedCacheManager } from 'src/cache/cache.service';
import { DeanonymizerResponse } from './types';
import { catchError, firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { parseNumberFromString } from 'src/utils/parseNumberFromString';

const IP_NOT_FOUND_ERROR = 'Data not found for IP';
@Injectable()
export class DeanonymizerService {
  private readonly logger = new Logger(DeanonymizerService.name);
  private readonly CACHE_NAMESPACE = 'DEANONYMIZER';
  private readonly cacheManager: WrappedCacheManager;
  private readonly DEANONYMIZER_URL: string;
  private readonly MAX_RETRIES: number;

  constructor(
    private cacheService: CacheService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.cacheManager = this.cacheService.createNamespaceWrappedCacheManager(
      this.CACHE_NAMESPACE,
    );

    this.DEANONYMIZER_URL =
      this.configService.get<string>('DEANONYMIZER_URL') ??
      'http://localhost:4830/deanonymize';

    this.MAX_RETRIES = parseNumberFromString({
      stringToParse: this.configService.get<string>('MAX_FETCH_RETRIES'),
      fallbackValue: 5,
    });
  }

  async deanonymizeIp(
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
          .post<DeanonymizerResponse>(this.DEANONYMIZER_URL, {
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

      if (retries >= this.MAX_RETRIES) {
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
        void this.deanonymizeIp(ip, retries).then((result) => resolve(result));
      }, 200);
    });
  }
}
