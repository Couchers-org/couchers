import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTranslation } from "next-i18next";
import { useMutation, useQueryClient } from "react-query";
import { NotificationPreferenceData } from "service/notifications";

import EditNotificationSettingsPage from "./EditNotificationSettingsPage";
import NotificationSettingsSubListItem from "./NotificationSettingsSubListItem";
import useNotificationSettings from "./useNotificationSettings";
import useUpdateNotificationSettings from "./useUpdateNotificationSettings";

jest.mock("react-query", () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("./useUpdateNotificationSettings");

// Mock useNotificationSettings hook
jest.mock("./useNotificationSettings", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock useTranslation hook
jest.mock("next-i18next", () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

describe("EditNotificationSettingsPage", () => {
  const mockMutate = jest.fn();

  const mockNotificationData = {
    groupsList: [
      {
        heading: "Account Security",
        topicsList: [
          {
            topic: "password",
            itemsList: [
              {
                action: "change",
                description: "Your password is changed",
                email: true,
                push: false,
                userEditable: true,
              },
            ],
          },
        ],
      },
      {
        heading: "Host requests",
        topicsList: [
          {
            topic: "host_request",
            itemsList: [
              {
                action: "create",
                description: "Someone sends you a host request",
                email: false,
                push: true,
                userEditable: true,
              },
            ],
          },
        ],
      },
      {
        heading: "Friend requests",
        topicsList: [
          {
            topic: "friend_request",
            itemsList: [
              {
                action: "create",
                description: "Test description not user editable",
                email: true,
                push: false,
                userEditable: false,
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    // Ensure useTranslation returns a function that returns the expected object with a 't' function.
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
    });

    const mockQueryClient = {
      invalidateQueries: jest.fn(),
    };

    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      reset: jest.fn(),
      isLoading: false,
      isError: false,
      status: "idle",
    });

    (useUpdateNotificationSettings as jest.Mock).mockReturnValue({
      updateNotificationSettings: mockMutate,
      reset: jest.fn(),
      isLoading: false,
      isError: false,
      status: "idle",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("Renders loading state correctly", () => {
    (useNotificationSettings as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<EditNotificationSettingsPage />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("Renders error state correctly", () => {
    (useNotificationSettings as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(<EditNotificationSettingsPage />);

    expect(screen.getByText("error_loading")).toBeInTheDocument();
  });

  it("Renders notification settings list correctly when data is loaded", () => {
    (useNotificationSettings as jest.Mock).mockReturnValue({
      data: mockNotificationData,
      isLoading: false,
      isError: false,
    });

    render(<EditNotificationSettingsPage />);

    // Check if the title, description, and list heading are rendered
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByText("list_heading")).toBeInTheDocument();

    // Check if NotificationSettingsListItems are rendered
    expect(screen.getByText("account_security")).toBeInTheDocument();
    expect(screen.getByText("password.change")).toBeInTheDocument();

    expect(screen.getByText("host_request")).toBeInTheDocument();
    expect(screen.getByText("host_request.create")).toBeInTheDocument();
  });

  it("Handles no data gracefully", () => {
    (useNotificationSettings as jest.Mock).mockReturnValue({
      data: { groupsList: [] },
      isLoading: false,
      isError: false,
    });

    render(<EditNotificationSettingsPage />);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.queryByText("account_security")).not.toBeInTheDocument();
    expect(screen.queryByText("password.change")).not.toBeInTheDocument();
  });

  it("Should call updateNotificationSettings on switch click with opposite value", async () => {
    const preferenceData: NotificationPreferenceData = {
      topic: "host_request",
      action: "host_request",
      deliveryMethod: "push",
      enabled: true,
    };

    const { container } = render(
      <NotificationSettingsSubListItem
        topic="host_request"
        action="host_request"
        email={false}
        push={false}
      />,
    );

    const emailSwitch = container.getElementsByClassName("MuiSwitch-input")[0];

    expect(emailSwitch).not.toBeChecked();

    fireEvent.click(emailSwitch);

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        {
          preferenceData: { ...preferenceData, enabled: true },
          setMutationError: expect.any(Function),
        },
        expect.any(Object),
      ),
    );
  });

  it('Should not render list items with "userEditable" set to false', () => {
    (useNotificationSettings as jest.Mock).mockReturnValue({
      data: mockNotificationData,
      isLoading: false,
      isError: false,
    });

    render(<EditNotificationSettingsPage />);

    // Check if the title, description, and list heading are rendered
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByText("list_heading")).toBeInTheDocument();

    // Check if NotificationSettingsListItems are rendered
    expect(screen.getByText("account_security")).toBeInTheDocument();
    expect(screen.getByText("password.change")).toBeInTheDocument();

    expect(screen.getByText("host_request")).toBeInTheDocument();
    expect(screen.getByText("host_request.create")).toBeInTheDocument();

    expect(screen.queryByText("friend_request")).not.toBeInTheDocument();
    expect(screen.queryByText("friend_request.create")).not.toBeInTheDocument();
  });
});
