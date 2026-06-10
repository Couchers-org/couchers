const mockExtra: Record<string, unknown> = {};

jest.mock("expo-constants", () => ({
  expoConfig: { extra: mockExtra },
}));

function loadUrls() {
  // require so jest.resetModules() re-evaluates the module-level defaults
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/config/urls") as typeof import("@/config/urls");
}

describe("web base URL resolution", () => {
  const ENV_DEFAULT = "https://couchers.org"; // set in jest.setup.ts

  beforeEach(() => {
    jest.resetModules();
    for (const key of Object.keys(mockExtra)) {
      delete mockExtra[key];
    }
    delete process.env.EXPO_PUBLIC_COUCHERS_ENV;
  });

  it("falls back to the env default without overrides or manifest URL", () => {
    const urls = loadUrls();
    expect(urls.getWebBaseUrl()).toBe(ENV_DEFAULT);
    expect(urls.getDefaultWebBaseUrl()).toBe(ENV_DEFAULT);
  });

  it("uses the OTA manifest web URL as the default when present", () => {
    mockExtra.otaWebBaseUrl =
      "https://couchers-git-branch-couchers-org.vercel.app/";
    const urls = loadUrls();
    // trailing slash is normalized off
    expect(urls.getWebBaseUrl()).toBe(
      "https://couchers-git-branch-couchers-org.vercel.app",
    );
    expect(urls.getDefaultWebBaseUrl()).toBe(
      "https://couchers-git-branch-couchers-org.vercel.app",
    );
  });

  it("prefers an explicit user override over the manifest URL", async () => {
    mockExtra.otaWebBaseUrl = "https://branch.vercel.app";
    const urls = loadUrls();
    await urls.setUrlOverrides({
      apiBaseUrl: null,
      webBaseUrl: "https://override.example.com",
    });
    expect(urls.getWebBaseUrl()).toBe("https://override.example.com");
    await urls.clearUrlOverrides();
    expect(urls.getWebBaseUrl()).toBe("https://branch.vercel.app");
  });

  it("ignores a non-string manifest value", () => {
    mockExtra.otaWebBaseUrl = { nested: "https://branch.vercel.app" };
    const urls = loadUrls();
    expect(urls.getWebBaseUrl()).toBe(ENV_DEFAULT);
  });

  it("ignores the manifest URL in prod builds", () => {
    process.env.EXPO_PUBLIC_COUCHERS_ENV = "prod";
    mockExtra.otaWebBaseUrl = "https://branch.vercel.app";
    const urls = loadUrls();
    expect(urls.getWebBaseUrl()).toBe(ENV_DEFAULT);
    expect(urls.getDefaultWebBaseUrl()).toBe(ENV_DEFAULT);
  });

  it("does not affect the API base URL", () => {
    mockExtra.otaWebBaseUrl = "https://branch.vercel.app";
    const urls = loadUrls();
    expect(urls.getApiBaseUrl()).toBe(urls.getDefaultApiBaseUrl());
  });
});
