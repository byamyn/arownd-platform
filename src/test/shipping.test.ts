import { describe, expect, it } from "vitest";
import { getShippingFee, requiresDeliveryAddress } from "@/lib/shipping";

describe("direct trade delivery options", () => {
  it("requires an address for merchant home delivery", () => {
    expect(requiresDeliveryAddress("home")).toBe(true);
  });

  it("does not require a home address for store pickup", () => {
    expect(requiresDeliveryAddress("desk")).toBe(false);
  });

  it("keeps store pickup free of delivery fees", () => {
    expect(getShippingFee(16, "desk")).toBe(0);
  });
});
