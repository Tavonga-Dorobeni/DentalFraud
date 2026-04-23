import { ToothDentitionType } from "@fdcdf/shared";
import { getDentitionType, isValidFdiToothNumber } from "../../src/common/utils/fdi";

describe("FDI utilities", () => {
  it("validates permanent and primary tooth numbers", () => {
    expect(isValidFdiToothNumber(11)).toBe(true);
    expect(isValidFdiToothNumber(48)).toBe(true);
    expect(isValidFdiToothNumber(55)).toBe(true);
    expect(isValidFdiToothNumber(85)).toBe(true);
    expect(isValidFdiToothNumber(49)).toBe(false);
    expect(isValidFdiToothNumber(86)).toBe(false);
  });

  it("returns the correct dentition type", () => {
    expect(getDentitionType(21)).toBe(ToothDentitionType.PERMANENT);
    expect(getDentitionType(64)).toBe(ToothDentitionType.PRIMARY);
    expect(getDentitionType(96)).toBeUndefined();
  });
});
