import {
  type Metadata,
  MethodDescriptor,
  MethodType,
  type Request,
  RpcError,
  StatusCode,
  type UnaryResponse,
} from "grpc-web";
import { getInjectedValue } from "utils/nativeLink";

// When the web app runs inside the native mobile WebView, gRPC-web calls are
// relayed to the native layer (which performs the actual HTTP request) instead
// of going out through the WebView's own XHR transport. This is wired in as the
// innermost unary interceptor, so it stands in for the transport itself.

// Ceiling for a relayed call when the request carries no gRPC deadline.
const RELAY_TIMEOUT_MS = 30_000;

interface ProtoMessage {
  serializeBinary(): Uint8Array;
}

type DeserializeFn = (bytes: Uint8Array) => unknown;

// The relay is only used when the native app explicitly advertises support via
// the injected `apiRelay` flag. Older native builds lack the flag, so the web
// app keeps using its own transport and is never bricked by a web-only deploy.
function isApiRelayEnabled(): boolean {
  return getInjectedValue("apiRelay") === true;
}

// grpc-web's MethodDescriptor stores the response deserializer under a minified
// property name. Rather than hard-code it, probe a descriptor we construct
// ourselves to discover which key holds it.
let deserializeKey: string | null = null;
function getDeserializeKey(): string {
  if (deserializeKey !== null) {
    return deserializeKey;
  }
  const marker: DeserializeFn = (bytes) => bytes;
  const probe = new MethodDescriptor(
    "probe",
    MethodType.UNARY,
    Object as never,
    Object as never,
    (message: never) => message,
    marker,
  );
  const key = Object.keys(probe).find(
    (k) => (probe as unknown as Record<string, unknown>)[k] === marker,
  );
  if (!key) {
    throw new Error(
      "nativeApiRelay: unable to locate grpc-web response deserializer",
    );
  }
  deserializeKey = key;
  return key;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Wrap a serialized message in a gRPC-web data frame: 1 flag byte + 4-byte
// big-endian length prefix.
export function frameMessage(payload: Uint8Array): Uint8Array {
  const frame = new Uint8Array(5 + payload.length);
  new DataView(frame.buffer).setUint32(1, payload.length);
  frame.set(payload, 5);
  return frame;
}

interface ParsedResponse {
  message?: Uint8Array;
  trailers: Record<string, string>;
}

function parseHeaderBlock(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) {
      continue;
    }
    out[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
  }
  return out;
}

// Walk the gRPC-web framed response body: data frames carry the message, the
// trailer frame (high bit of the flag byte set) carries grpc-status.
export function parseFrames(body: Uint8Array): ParsedResponse {
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  let offset = 0;
  let message: Uint8Array | undefined;
  let trailers: Record<string, string> = {};
  while (offset + 5 <= body.length) {
    const flag = body[offset];
    const length = view.getUint32(offset + 1);
    const payload = body.subarray(offset + 5, offset + 5 + length);
    offset += 5 + length;
    if ((flag & 0x80) !== 0) {
      trailers = parseHeaderBlock(new TextDecoder().decode(payload));
    } else {
      message = payload;
    }
  }
  return { message, trailers };
}

function decodeGrpcMessage(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

interface RelayResponse {
  httpStatus: number;
  headers: Record<string, string>;
  body: Uint8Array;
}

interface PendingCall {
  resolve: (response: RelayResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pendingCalls = new Map<string, PendingCall>();
let callCounter = 0;

if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    let payload;
    try {
      payload =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }
    if (payload?.type !== "API_RESPONSE" || !payload.data) {
      return;
    }
    const { id, error, httpStatus, headers, bodyBase64 } = payload.data;
    const pending = pendingCalls.get(id);
    if (!pending) {
      return;
    }
    pendingCalls.delete(id);
    clearTimeout(pending.timer);
    if (error) {
      pending.reject(new RpcError(StatusCode.UNAVAILABLE, error, {}));
      return;
    }
    pending.resolve({
      httpStatus: httpStatus ?? 0,
      headers: headers ?? {},
      body: base64ToBytes(bodyBase64 ?? ""),
    });
  });
}

function relayToNative(
  path: string,
  headers: Record<string, string>,
  framedBody: Uint8Array,
  timeoutMs: number,
): Promise<RelayResponse> {
  callCounter += 1;
  const id = `api-${callCounter}`;
  return new Promise<RelayResponse>((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingCalls.delete(id);
      reject(
        new RpcError(
          StatusCode.DEADLINE_EXCEEDED,
          "Native API relay timed out",
          {},
        ),
      );
    }, timeoutMs);
    pendingCalls.set(id, { resolve, reject, timer });
    window.ReactNativeWebView!.postMessage(
      JSON.stringify({
        type: "API_REQUEST",
        data: { id, path, headers, bodyBase64: bytesToBase64(framedBody) },
      }),
    );
  });
}

function buildHeaders(metadata: Metadata): {
  headers: Record<string, string>;
  timeoutMs: number;
} {
  const headers: Record<string, string> = {
    "Content-Type": "application/grpc-web+proto",
    "X-Grpc-Web": "1",
    "X-User-Agent": "grpc-web-javascript/0.1",
    Accept: "application/grpc-web+proto",
  };
  let timeoutMs = RELAY_TIMEOUT_MS;
  for (const [key, value] of Object.entries(metadata)) {
    if (key === "deadline") {
      timeoutMs = Math.max(0, Number(value) - Date.now());
      headers["grpc-timeout"] = `${Math.ceil(timeoutMs)}m`;
    } else {
      headers[key] = value;
    }
  }
  return { headers, timeoutMs };
}

export class NativeApiRelayInterceptor {
  async intercept(
    request: Request<unknown, unknown>,
    invoker: (
      request: Request<unknown, unknown>,
    ) => Promise<UnaryResponse<unknown, unknown>>,
  ): Promise<UnaryResponse<unknown, unknown>> {
    if (!isApiRelayEnabled()) {
      return invoker(request);
    }

    const descriptor = request.getMethodDescriptor();
    const requestMessage = request.getRequestMessage() as ProtoMessage;
    const { headers, timeoutMs } = buildHeaders(request.getMetadata());
    const framed = frameMessage(requestMessage.serializeBinary());

    const {
      httpStatus,
      headers: responseHeaders,
      body,
    } = await relayToNative(descriptor.getName(), headers, framed, timeoutMs);

    const { message, trailers } = parseFrames(body);

    const rawStatus = trailers["grpc-status"] ?? responseHeaders["grpc-status"];
    const grpcStatus = rawStatus !== undefined ? Number(rawStatus) : null;
    const grpcMessage = decodeGrpcMessage(
      trailers["grpc-message"] ?? responseHeaders["grpc-message"] ?? "",
    );

    if (grpcStatus !== null && grpcStatus !== StatusCode.OK) {
      throw new RpcError(grpcStatus, grpcMessage, trailers);
    }
    if (grpcStatus === null && httpStatus !== 200) {
      throw new RpcError(
        StatusCode.UNKNOWN,
        `Native API relay HTTP ${httpStatus}`,
        {},
      );
    }
    if (!message) {
      throw new RpcError(
        StatusCode.UNKNOWN,
        "Native API relay returned an empty response",
        {},
      );
    }

    const deserialize = (
      descriptor as unknown as Record<string, DeserializeFn>
    )[getDeserializeKey()];
    const responseMessage = deserialize(message);

    return {
      getResponseMessage: () => responseMessage,
      getMetadata: () => ({}),
      getMethodDescriptor: () => descriptor,
      getStatus: () => ({ code: StatusCode.OK, details: "", metadata: {} }),
    } as UnaryResponse<unknown, unknown>;
  }
}
