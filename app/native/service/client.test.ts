import { StatusCode } from "grpc-web";

import { AuthInterceptor, setUnauthenticatedErrorHandler } from "./client";

describe("AuthInterceptor", () => {
  it("returns a successful response", async () => {
    const invokerMock = jest.fn(() => ({ test: "test" }));
    const interceptor = new AuthInterceptor();
    const response = await interceptor.intercept(null, invokerMock);
    expect(response).toMatchObject({ test: "test" });
  });

  it("calls a set UnauthenticatedErrorHandler on unauthenticated error", async () => {
    const errorHandler = jest.fn();
    const invokerMock = jest.fn(() => {
      throw { code: StatusCode.UNAUTHENTICATED, message: "Unauthenticated" }; //eslint-disable-line no-throw-literal
    });
    const interceptor = new AuthInterceptor();
    setUnauthenticatedErrorHandler(errorHandler);
    await interceptor.intercept(null, invokerMock);
    expect(errorHandler).toBeCalled();
  });

  it("throws on an error that isn't an unauthenticated error", async () => {
    const errorHandler = jest.fn();
    const invokerMock = jest.fn(() => {
      throw { code: StatusCode.NOT_FOUND, message: "Not found" }; //eslint-disable-line no-throw-literal
    });
    const interceptor = new AuthInterceptor();
    setUnauthenticatedErrorHandler(errorHandler);
    await expect(() =>
      interceptor.intercept(null, invokerMock)
    ).rejects.toMatchObject({ code: StatusCode.NOT_FOUND });
    expect(errorHandler).not.toBeCalled();
  });
});
