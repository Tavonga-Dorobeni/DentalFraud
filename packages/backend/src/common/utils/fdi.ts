import { ToothDentitionType } from "@fdcdf/shared";

const permanentQuadrants = new Set([1, 2, 3, 4]);
const primaryQuadrants = new Set([5, 6, 7, 8]);

export const isValidFdiToothNumber = (toothNumber: number): boolean => {
  if (!Number.isInteger(toothNumber)) {
    return false;
  }

  const quadrant = Math.floor(toothNumber / 10);
  const position = toothNumber % 10;

  if (permanentQuadrants.has(quadrant)) {
    return position >= 1 && position <= 8;
  }

  if (primaryQuadrants.has(quadrant)) {
    return position >= 1 && position <= 5;
  }

  return false;
};

export const getDentitionType = (toothNumber: number): ToothDentitionType | undefined => {
  if (!isValidFdiToothNumber(toothNumber)) {
    return undefined;
  }

  const quadrant = Math.floor(toothNumber / 10);
  return quadrant <= 4 ? ToothDentitionType.PERMANENT : ToothDentitionType.PRIMARY;
};
