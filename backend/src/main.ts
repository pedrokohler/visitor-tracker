import { NestFactory } from '@nestjs/core';
import { ConsoleLogger, Logger, LogLevel } from '@nestjs/common';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SocketIoAdapter } from './sessions/socket.io.adapter';
import { parseArrayFromString } from './utils/parseArrayFromString';

const getLogLevels = (logger: Logger): LogLevel[] => {
  const defaultLevels = ['fatal', 'error', 'warn', 'log'] as LogLevel[];

  const configLevels = parseArrayFromString({
    stringToParse: process.env.LOG_LEVELS,
    logger,
    warnMessage: 'No log levels provided. Using default levels.',
  }) as LogLevel[];

  return configLevels.length === 0 ? defaultLevels : configLevels;
};

const getHosts = ({
  configService,
  logger,
}: {
  configService: ConfigService<unknown, boolean>;
  logger: Logger;
}) => {
  const hostsConfig = configService.get<string>('CORS_ALLOWED_ORIGINS');

  return parseArrayFromString({
    stringToParse: hostsConfig,
    logger,
    warnMessage: 'No valid CORS_ALLOWED_ORIGIN provided. Using empty array.',
  });
};

async function bootstrap() {
  const logger = new Logger('BOOTSTRAPPING');
  const logLevels = getLogLevels(logger);
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      logLevels,
    }),
  });

  const configService = app.get(ConfigService);

  const hosts = getHosts({ configService, logger });

  app.enableCors({
    origin: hosts,
    credentials: true,
  });

  app.useWebSocketAdapter(new SocketIoAdapter(app, configService));
  app.enableCors({ origin: hosts });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
