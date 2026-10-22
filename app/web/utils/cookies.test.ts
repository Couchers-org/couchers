import { getCookie } from "./cookies";

let cookies = "";

beforeEach(() => {
  cookies = "";
  Object.defineProperty(document, "cookie", {
    get: () => cookies,
    configurable: true,
  });
});

describe("getCookie", () => {
  it("reads a cookie by name", () => {
    cookies = "NEXT_LOCALE=en; couchers-user-id=42";
    expect(getCookie("couchers-user-id")).toBe("42");
  });

  it("returns undefined when the cookie isn't set", () => {
    cookies = "NEXT_LOCALE=en";
    expect(getCookie("couchers-user-id")).toBeUndefined();
  });

  it("doesn't match a cookie whose name merely ends with the one asked for", () => {
    cookies = "not-couchers-user-id=42";
    expect(getCookie("couchers-user-id")).toBeUndefined();
  });

  it("keeps equals signs in the value", () => {
    cookies = "token=abc=def";
    expect(getCookie("token")).toBe("abc=def");
  });
});
