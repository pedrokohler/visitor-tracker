import { Logger } from '@nestjs/common';

export const parseArrayFromString = ({
  stringToParse,
  logger,
  warnMessage,
}: {
  stringToParse: unknown;
  logger: Logger;
  warnMessage: string;
}) => {
  if (typeof stringToParse !== 'string') {
    logger.warn(warnMessage);
    return [];
  }

  const arr = stringToParse.split(',');

  if (!arr || !arr?.[0]) {
    logger.warn(warnMessage);
    return [];
  }

  return arr;
};
