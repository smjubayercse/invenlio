import { describe, expect, it } from "vitest";
import {
  canPack,
  poActions,
  positiveQuantity,
  remainingToAllocate,
  requiresLot,
  requiresSerial,
} from "../features/workflow";
describe("workflow guards", () => {
  it("allows only valid receiving quantities", () => {
    expect(positiveQuantity("0")).toBe(false);
    expect(positiveQuantity("-1")).toBe(false);
    expect(positiveQuantity("2.5")).toBe(true);
    expect(positiveQuantity("abc")).toBe(false);
  });
  it("guards PO lifecycle and approval permission", () => {
    expect(poActions("DRAFT", ["purchase-order:update"], true).submit).toBe(
      true,
    );
    expect(poActions("DRAFT", [], true).submit).toBe(false);
    expect(
      poActions("SUBMITTED", ["purchase-order:update"], true).approve,
    ).toBe(false);
    expect(
      poActions("SUBMITTED", ["purchase-order:approve"], true).approve,
    ).toBe(true);
  });
  it("shows partial allocation as remaining backorder", () => {
    expect(remainingToAllocate("10", "4")).toBe("6");
    expect(remainingToAllocate("10", "10")).toBe("0");
  });
  it("prevents packaging more than picked quantity", () => {
    expect(canPack("5", "3", "3")).toBe(false);
    expect(canPack("5", "3", "2")).toBe(true);
    expect(canPack("5", "3", "0")).toBe(false);
  });
  it("captures lot and serial identities for combined tracking", () => {
    expect(requiresLot("LOT_AND_SERIAL")).toBe(true);
    expect(requiresSerial("LOT_AND_SERIAL")).toBe(true);
    expect(requiresSerial("LOT")).toBe(false);
  });
});
