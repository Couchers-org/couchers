import { act, renderHook } from "@testing-library/react-hooks";
import { useAuthContext } from "./AuthProvider";
import { addDefaultUser } from "../../test/utils";
import * as client from "../../service/client";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { service } from "../../service";
import wrapper from "../../test/hookWrapper";

const logoutMock = service.user.logout as jest.Mock;
logoutMock.mockResolvedValue(new Empty());

describe("AuthProvider", () => {
  it("sets an unauthenticatedErrorHandler function that logs out correctly", async () => {
    addDefaultUser();

    //mock out setUnauthenticatedErrorHandler to set our own handler var
    const initialHandler = async () => {};
    let handler: () => Promise<void> = initialHandler;
    const mockSetHandler = jest.fn((fn: () => Promise<void>) => {
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
      await handler();
    });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.error).toBe("You were logged out.");
  });
});
