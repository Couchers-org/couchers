import { Linking } from "react-native";

import { getNotificationPath } from "@/utils/getNotificationPath";

// Mock Linking.openURL
jest.mock("react-native", () => ({
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
  },
}));

describe("getNotificationPath", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("extracts path from full URL", () => {
    expect(
      getNotificationPath("https://couchers.org/messages/requests/123"),
    ).toBe("/messages/requests/123");
  });

  it("extracts path with query params", () => {
    expect(
      getNotificationPath("https://couchers.org/search?location=Berlin"),
    ).toBe("/search?location=Berlin");
  });

  it("handles base paths", () => {
    expect(getNotificationPath("https://couchers.org/messages")).toBe(
      "/messages",
    );
  });

  it("handles leave-reference paths", () => {
    expect(
      getNotificationPath("https://couchers.org/leave-reference/surfed/91/320"),
    ).toBe("/leave-reference/surfed/91/320");
  });

  it("returns path as-is if URL parsing fails", () => {
    expect(getNotificationPath("/messages/456")).toBe("/messages/456");
  });

  it("returns null for undefined", () => {
    expect(getNotificationPath(undefined)).toBeNull();
  });

  it("returns null for non-string values", () => {
    // @ts-expect-error testing invalid input
    expect(getNotificationPath(123)).toBeNull();
    // @ts-expect-error testing invalid input
    expect(getNotificationPath(null)).toBeNull();
  });

  it("handles root path", () => {
    expect(getNotificationPath("https://couchers.org/")).toBe("/");
  });

  it("handles different Couchers domains", () => {
    expect(
      getNotificationPath(
        "https://next.couchershq.org/leave-reference/surfed/91/320",
      ),
    ).toBe("/leave-reference/surfed/91/320");

    expect(getNotificationPath("https://www.couchers.org/messages")).toBe(
      "/messages",
    );
  });

  it("opens external URLs in browser and returns null", () => {
    const stripeUrl = "https://pay.stripe.com/receipts/payment/abc123";
    expect(getNotificationPath(stripeUrl)).toBeNull();
    expect(Linking.openURL).toHaveBeenCalledWith(stripeUrl);
  });

  it("opens Stripe checkout URLs in browser and returns null", () => {
    const checkoutUrl = "https://checkout.stripe.com/c/pay/test123";
    expect(getNotificationPath(checkoutUrl)).toBeNull();
    expect(Linking.openURL).toHaveBeenCalledWith(checkoutUrl);
  });
});
