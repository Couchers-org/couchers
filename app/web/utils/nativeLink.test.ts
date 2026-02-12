import { base64ToFile } from "./nativeLink";

describe("nativeLink", () => {
  describe("base64ToFile", () => {
    it("converts base64 string to File object", () => {
      // "Hello" in base64
      const base64 = "SGVsbG8=";
      const mimeType = "text/plain";
      const filename = "test.txt";

      const file = base64ToFile(base64, mimeType, filename);

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe(filename);
      expect(file.type).toBe(mimeType);
      expect(file.size).toBe(5); // "Hello" is 5 bytes
    });

    it("handles image base64 data", () => {
      // Small 1x1 red pixel PNG in base64
      const base64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
      const mimeType = "image/png";
      const filename = "pixel.png";

      const file = base64ToFile(base64, mimeType, filename);

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe(filename);
      expect(file.type).toBe(mimeType);
      expect(file.size).toBeGreaterThan(0);
    });

    it("creates file with correct JPEG mime type", () => {
      // Minimal valid JPEG header in base64
      const base64 = "/9j/4AAQSkZJRg==";
      const mimeType = "image/jpeg";
      const filename = "photo.jpg";

      const file = base64ToFile(base64, mimeType, filename);

      expect(file.type).toBe("image/jpeg");
      expect(file.name).toBe("photo.jpg");
    });
  });
});
