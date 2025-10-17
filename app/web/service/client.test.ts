import { Request, RpcError, StatusCode, UnaryResponse } from "grpc-web";

import { authInterceptor, setUnauthenticatedErrorHandler } from "./client";

describe("AuthInterceptor", () => {
  it("returns a successful response", async () => {
    const invokerMock = jest.fn(
      async () =>
        ({ test: "test" }) as unknown as UnaryResponse<unknown, unknown>,
    );
    const response = await authInterceptor.intercept(
      null as unknown as Request<unknown, unknown>,
      invokerMock,
    );
    expect(response).toMatchObject({ test: "test" });
  });

  it("calls a set UnauthenticatedErrorHandler on unauthenticated error", async () => {
    const errorHandler = jest.fn();
    const invokerMock = jest.fn(() => {
      throw new RpcError(StatusCode.UNAUTHENTICATED, "Unauthenticated", {});
    });
    // const interceptor = new ;
    setUnauthenticatedErrorHandler(errorHandler);
    await authInterceptor.intercept(
      null as unknown as Request<unknown, unknown>,
      invokerMock,
    );
    expect(errorHandler).toHaveBeenCalled();
  });

  it("throws on an error that isn't an unauthenticated error", async () => {
    const errorHandler = jest.fn();
    const invokerMock = jest.fn(() => {
      throw new RpcError(StatusCode.NOT_FOUND, "Not found", {});
    });
    setUnauthenticatedErrorHandler(errorHandler);
    await expect(() =>
      authInterceptor.intercept(
        null as unknown as Request<unknown, unknown>,
        invokerMock,
      ),
    ).rejects.toMatchObject({ code: StatusCode.NOT_FOUND });
    expect(errorHandler).not.toHaveBeenCalled();
  });
});
