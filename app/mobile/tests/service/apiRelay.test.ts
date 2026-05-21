import { base64ToBytes, bytesToBase64 } from "@/service/apiRelay";

describe("apiRelay base64", () => {
  it("encodes known vectors, including every padding length", () => {
    expect(bytesToBase64(Uint8Array.from([]))).toBe("");
    expect(bytesToBase64(Uint8Array.from([102]))).toBe("Zg==");
    expect(bytesToBase64(Uint8Array.from([102, 111]))).toBe("Zm8=");
    expect(bytesToBase64(Uint8Array.from([102, 111, 111]))).toBe("Zm9v");
    expect(bytesToBase64(Uint8Array.from([102, 111, 111, 98, 97, 114]))).toBe(
      "Zm9vYmFy",
    );
  });

  it("decodes a known vector", () => {
    expect(Array.from(base64ToBytes("Zm9vYmFy"))).toEqual([
      102, 111, 111, 98, 97, 114,
    ]);
  });

  it("round-trips arbitrary byte sequences", () => {
    for (const length of [0, 1, 2, 3, 4, 255, 1000]) {
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i += 1) {
        bytes[i] = (i * 31 + 7) & 0xff;
      }
      expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(
        Array.from(bytes),
      );
    }
  });
});
