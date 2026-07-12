import { renderHook, waitFor } from "@testing-library/react";
import { useProfileSheet } from "features/profile/ProfileSheetContext";
import { service } from "service";
import wrapper from "test/hookWrapper";

import useMessageUser from "./useMessageUser";

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush }),
  default: {
    events: { on: jest.fn(), off: jest.fn() },
  },
}));

jest.mock("features/profile/ProfileSheetContext", () => ({
  useProfileSheet: jest.fn(),
}));

jest.mock("service");

const mockOpenGroupChat = jest.fn();
const mockSetMutationError = jest.fn();
const mockSetIsMessaging = jest.fn();

describe("useMessageUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useProfileSheet as jest.Mock).mockReturnValue({
      openGroupChat: mockOpenGroupChat,
      openProfileSheet: jest.fn(),
      closeProfileSheet: jest.fn(),
      openProfileUserId: null,
      openGroupChatId: null,
      closeGroupChat: jest.fn(),
    });
  });

  it("opens group chat in sheet when sheet is open and thread exists", async () => {
    (useProfileSheet as jest.Mock).mockReturnValue({
      openGroupChat: mockOpenGroupChat,
      openProfileSheet: jest.fn(),
      closeProfileSheet: jest.fn(),
      openProfileUserId: 1,
      openGroupChatId: null,
      closeGroupChat: jest.fn(),
    });
    (service.conversations.getDirectMessage as jest.Mock).mockResolvedValue(
      123,
    );

    const { result } = renderHook(
      () =>
        useMessageUser({
          userId: 1,
          setMutationError: mockSetMutationError,
          setIsMessaging: mockSetIsMessaging,
        }),
      { wrapper },
    );

    result.current.mutate();
    await waitFor(() => expect(mockOpenGroupChat).toHaveBeenCalledWith(123));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to group chat route when sheet is not open and thread exists", async () => {
    (service.conversations.getDirectMessage as jest.Mock).mockResolvedValue(
      123,
    );

    const { result } = renderHook(
      () =>
        useMessageUser({
          userId: 1,
          setMutationError: mockSetMutationError,
          setIsMessaging: mockSetIsMessaging,
        }),
      { wrapper },
    );

    result.current.mutate();
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockOpenGroupChat).not.toHaveBeenCalled();
  });

  it("opens inline compose form when no thread exists", async () => {
    (service.conversations.getDirectMessage as jest.Mock).mockResolvedValue(
      false,
    );

    const { result } = renderHook(
      () =>
        useMessageUser({
          userId: 1,
          setMutationError: mockSetMutationError,
          setIsMessaging: mockSetIsMessaging,
        }),
      { wrapper },
    );

    result.current.mutate();
    await waitFor(() => expect(mockSetIsMessaging).toHaveBeenCalledWith(true));
    expect(mockOpenGroupChat).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
