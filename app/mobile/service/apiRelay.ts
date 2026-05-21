// Native side of the gRPC-web relay: the web app (running in the WebView)
// hands us an already-framed gRPC-web request; we perform the actual HTTP call
// from native code and hand the raw response back. See app/web/service/
// nativeApiRelay.ts for the WebView side.

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export interface ApiRequestPayload {
  id: string;
  path: string;
  headers: Record<string, string>;
  bodyBase64: string;
}

export interface ApiResponsePayload {
  id: string;
  httpStatus?: number;
  headers?: Record<string, string>;
  bodyBase64?: string;
  error?: string;
}

const B64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const B64_LOOKUP = (() => {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64_CHARS.length; i += 1) {
    table[B64_CHARS.charCodeAt(i)] = i;
  }
  return table;
})();

export function bytesToBase64(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const hasByte1 = i + 1 < bytes.length;
    const hasByte2 = i + 2 < bytes.length;
    const b0 = bytes[i];
    const b1 = hasByte1 ? bytes[i + 1] : 0;
    const b2 = hasByte2 ? bytes[i + 2] : 0;
    result += B64_CHARS[b0 >> 2];
    result += B64_CHARS[((b0 & 0x03) << 4) | (b1 >> 4)];
    result += hasByte1 ? B64_CHARS[((b1 & 0x0f) << 2) | (b2 >> 6)] : "=";
    result += hasByte2 ? B64_CHARS[b2 & 0x3f] : "=";
  }
  return result;
}

export function base64ToBytes(value: string): Uint8Array {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const sextet = code < 128 ? B64_LOOKUP[code] : -1;
    if (sextet === -1) {
      continue;
    }
    buffer = (buffer << 6) | sextet;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}

function parseResponseHeaders(raw: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of raw.split(/[\r\n]+/)) {
    const idx = line.indexOf(":");
    if (idx === -1) {
      continue;
    }
    headers[line.slice(0, idx).trim().toLowerCase()] = line
      .slice(idx + 1)
      .trim();
  }
  return headers;
}

export function relayApiRequest(
  request: ApiRequestPayload,
): Promise<ApiResponsePayload> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_BASE_URL + request.path);
    xhr.responseType = "arraybuffer";
    xhr.withCredentials = true;
    for (const [key, value] of Object.entries(request.headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.onload = () => {
      resolve({
        id: request.id,
        httpStatus: xhr.status,
        headers: parseResponseHeaders(xhr.getAllResponseHeaders()),
        bodyBase64: bytesToBase64(new Uint8Array(xhr.response as ArrayBuffer)),
      });
    };
    xhr.onerror = () => {
      resolve({ id: request.id, error: "Network request failed" });
    };
    xhr.ontimeout = () => {
      resolve({ id: request.id, error: "Request timed out" });
    };
    xhr.send(base64ToBytes(request.bodyBase64));
  });
}
