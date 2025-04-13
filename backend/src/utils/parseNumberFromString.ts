export const parseNumberFromString = ({
  stringToParse,
  fallbackValue,
}: {
  stringToParse: unknown;
  fallbackValue: number;
}) => {
  if (typeof stringToParse !== 'string') {
    return fallbackValue;
  }

  const value = Number(stringToParse);

  return isNaN(value) ? fallbackValue : value;
};
