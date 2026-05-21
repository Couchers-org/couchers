import { MethodDescriptor, MethodType, Request, RpcError } from "grpc-web";

import {
  frameMessage,
  NativeApiRelayInterceptor,
  parseFrames,
} from "./nativeApiRelay";

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function trailerFrame(text: string): Uint8Array {
  const payload = new TextEncoder().encode(text);
  const frame = new Uint8Array(5 + payload.length);
  frame[0] = 0x80;
  new DataView(frame.buffer).setUint32(1, payload.length);
  frame.set(payload, 5);
  return frame;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function makeRequest(): Request<unknown, unknown> {
  const descriptor = new MethodDescriptor(
    "/org.couchers.test.Test/Echo",
    MethodType.UNARY,
    Object as never,
    Object as never,
    (message: never) => message,
    (bytes: Uint8Array) => ({ echoed: Array.from(bytes) }),
  );
  return {
    getMethodDescriptor: () => descriptor,
    getRequestMessage: () => ({
      serializeBinary: () => Uint8Array.from([9, 9, 9]),
    }),
    getMetadata: () => ({}),
  } as unknown as Request<unknown, unknown>;
}

describe("gRPC-web framing helpers", () => {
  it("frames a message with a 5-byte length prefix", () => {
    const framed = frameMessage(Uint8Array.from([1, 2, 3, 4]));
    expect(framed[0]).toBe(0);
    expect(new DataView(framed.buffer).getUint32(1)).toBe(4);
    expect(Array.from(framed.slice(5))).toEqual([1, 2, 3, 4]);
  });

  it("parses a data frame and a trailer frame", () => {
    const body = concat(
      frameMessage(Uint8Array.from([7, 8])),
      trailerFrame("grpc-status:0\r\ngrpc-message:ok\r\n"),
    );
    const { message, trailers } = parseFrames(body);
    expect(Array.from(message!)).toEqual([7, 8]);
    expect(trailers["grpc-status"]).toBe("0");
    expect(trailers["grpc-message"]).toBe("ok");
  });
});

describe("NativeApiRelayInterceptor", () => {
  afterEach(() => {
    delete window.ReactNativeWebView;
  });

  it("passes through to the invoker when not in a native embed", async () => {
    const invoker = jest.fn(async () => ({
      getResponseMessage: () => "direct",
    }));
    const interceptor = new NativeApiRelayInterceptor();

    const response = await interceptor.intercept(
      makeRequest(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invoker as any,
    );

    expect(invoker).toHaveBeenCalled();
    expect(response.getResponseMessage()).toBe("direct");
  });

  it("relays the call to native and deserializes the response", async () => {
    const postMessage = jest.fn();
    window.ReactNativeWebView = {
      postMessage,
      injectedObjectJson: () => JSON.stringify({ apiRelay: true }),
    };
    const invoker = jest.fn();
    const interceptor = new NativeApiRelayInterceptor();

    const promise = interceptor.intercept(
      makeRequest(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invoker as any,
    );

    const sent = JSON.parse(postMessage.mock.calls[0][0]);
    expect(sent.type).toBe("API_REQUEST");
    expect(sent.data.path).toBe("/org.couchers.test.Test/Echo");

    const body = concat(
      frameMessage(Uint8Array.from([5, 6])),
      trailerFrame("grpc-status:0\r\n"),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        data: JSON.stringify({
          type: "API_RESPONSE",
          data: {
            id: sent.data.id,
            httpStatus: 200,
            headers: {},
            bodyBase64: toBase64(body),
          },
        }),
      }),
    );

    const response = await promise;
    expect(invoker).not.toHaveBeenCalled();
    expect(response.getResponseMessage()).toEqual({ echoed: [5, 6] });
  });

  it("throws an RpcError when native returns a non-OK grpc-status", async () => {
    const postMessage = jest.fn();
    window.ReactNativeWebView = {
      postMessage,
      injectedObjectJson: () => JSON.stringify({ apiRelay: true }),
    };
    const interceptor = new NativeApiRelayInterceptor();

    const promise = interceptor.intercept(
      makeRequest(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.fn() as any,
    );

    const sent = JSON.parse(postMessage.mock.calls[0][0]);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: JSON.stringify({
          type: "API_RESPONSE",
          data: {
            id: sent.data.id,
            httpStatus: 200,
            headers: {},
            bodyBase64: toBase64(
              trailerFrame("grpc-status:5\r\ngrpc-message:nope\r\n"),
            ),
          },
        }),
      }),
    );

    await expect(promise).rejects.toBeInstanceOf(RpcError);
    await expect(promise).rejects.toMatchObject({ code: 5, message: "nope" });
  });
});
