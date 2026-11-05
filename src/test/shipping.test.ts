import { describe, expect, it } from "vitest";
import { requiresDeliveryAddress } from "@/lib/shipping";

describe("requiresDeliveryAddress", () => {
  it("requires an address for merchant home delivery", () => {
    expect(requiresDeliveryAddress("home")).toBe(true);
  });

  it("does not require a home address for store pickup", () => {
    expect(requiresDeliveryAddress("desk")).toBe(false);
  });
});
