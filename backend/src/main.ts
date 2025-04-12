import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, LogLevel } from '@nestjs/common';

const getLogLevels = () => {
  const defaultLevels = ['fatal', 'error', 'warn', 'log'] as LogLevel[];
  const logLevelsStr = process.env.LOG_LEVELS;

  if (!logLevelsStr) {
    console.warn('No log levels provided.');
    return defaultLevels;
  }

  try {
    const logLevels = JSON.parse(logLevelsStr) as LogLevel[];
    if (Array.isArray(logLevels)) {
      return logLevels;
    }
    console.warn('Log levels are not array and thus have been ignored.');
  } catch (e) {
    console.error("Log levels couldn't be parsed.", e);
  }

  return defaultLevels;
};

async function bootstrap() {
  const logLevels = getLogLevels();
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      logLevels,
    }),
  });
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
