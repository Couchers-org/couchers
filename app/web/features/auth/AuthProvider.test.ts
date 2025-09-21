import { UnauthenticatedCallback } from "@couchers/services";
import { act, renderHook } from "@testing-library/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import { service } from "@/service";
import * as serviceClientsModule from "@/serviceClients";
import wrapper from "@/test/hookWrapper";
import i18n from "@/test/i18n";
import { addDefaultUser } from "@/test/utils";

import { useAuthContext } from "./AuthProvider";

const { t } = i18n;

jest.mock("../../service/client");

const logoutMock = service.user.logout as jest.Mock;
const getIsJailedMock = service.jail.getIsJailed as jest.Mock;

describe("AuthProvider", () => {
  it("sets an unauthenticatedErrorHandler function that logs out correctly", async () => {
    logoutMock.mockResolvedValue(new Empty());
    addDefaultUser();

    // mock out setUnauthenticatedErrorHandler to set our own handler var
    const initialHandler = async () => {};
    let handler: UnauthenticatedCallback = initialHandler;

    const mockSetHandler = jest.fn((fn: UnauthenticatedCallback) => {
      handler = fn;
    });

    jest
      .spyOn(serviceClientsModule, "setUnauthenticatedCallback")
      .mockImplementation(mockSetHandler);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
    });

    expect(mockSetHandler).toHaveBeenCalled();
    await act(async () => {
      await handler(false);
    });
    expect(result.current.authState.isAuthenticated).toBe(false);
    expect(result.current.authState.error).toBe(t("auth:logged_out_message"));
  });

  it("sets an unauthenticatedErrorHandler function that redirects to jail if jailed correctly", async () => {
    getIsJailedMock.mockResolvedValue({ isJailed: true });
    addDefaultUser();

    // mock out setUnauthenticatedErrorHandler to set our own handler var
    const initialHandler = async () => {};
    let handler: UnauthenticatedCallback = initialHandler;

    const mockSetHandler = jest.fn((fn: UnauthenticatedCallback) => {
      handler = fn;
    });

    jest
      .spyOn(serviceClientsModule, "setUnauthenticatedCallback")
      .mockImplementation(mockSetHandler);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
    });

    expect(mockSetHandler).toHaveBeenCalled();
    await act(async () => {
      await handler(true);
    });
    expect(result.current.authState.isAuthenticated).toBe(true);
    expect(result.current.authState.isJailed).toBe(true);
  });
});
