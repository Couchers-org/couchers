import { act, renderHook } from "@testing-library/react-hooks";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";

import { service } from "../../service";
import * as client from "../../service/client";
import wrapper from "../../test/hookWrapper";
import { addDefaultUser } from "../../test/utils";
import { useAuthContext } from "./AuthProvider";
import {
  JAILED_ERROR_MESSAGE,
  LOGGED_OUT_ERROR_MESSAGE,
  YOU_WERE_LOGGED_OUT,
} from "./constants";

const logoutMock = service.user.logout as jest.Mock;
const getIsJailedMock = service.jail.getIsJailed as jest.Mock;

describe("AuthProvider", () => {
  it("sets an unauthenticatedErrorHandler function that logs out correctly", async () => {
    logoutMock.mockResolvedValue(new Empty());
    addDefaultUser();

    //mock out setUnauthenticatedErrorHandler to set our own handler var
    const initialHandler = async () => {};
    let handler: (e: GrpcError) => Promise<void> = initialHandler;
    const mockSetHandler = jest.fn((fn: (e: GrpcError) => Promise<void>) => {
      handler = fn;
    });
    jest
      .spyOn(client, "setUnauthenticatedErrorHandler")
      .mockImplementation(mockSetHandler);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
    });

    expect(mockSetHandler).toBeCalled();
    await act(async () => {
      await handler({ message: LOGGED_OUT_ERROR_MESSAGE } as GrpcError);
    });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.error).toBe(YOU_WERE_LOGGED_OUT);
  });

  it("sets an unauthenticatedErrorHandler function that redirects to jail if jailed correctly", async () => {
    getIsJailedMock.mockResolvedValue({ isJailed: true });
    addDefaultUser();

    //mock out setUnauthenticatedErrorHandler to set our own handler var
    const initialHandler = async () => {};
    let handler: (e: GrpcError) => Promise<void> = initialHandler;
    const mockSetHandler = jest.fn((fn: (e: GrpcError) => Promise<void>) => {
      handler = fn;
    });
    jest
      .spyOn(client, "setUnauthenticatedErrorHandler")
      .mockImplementation(mockSetHandler);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
    });

    expect(mockSetHandler).toBeCalled();
    await act(async () => {
      await handler({ message: JAILED_ERROR_MESSAGE } as GrpcError);
    });
    expect(result.current.authState.authenticated).toBe(true);
    expect(result.current.authState.jailed).toBe(true);
  });
});
