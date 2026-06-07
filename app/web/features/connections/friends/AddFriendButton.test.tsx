import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React, { useState } from "react";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

import AddFriendButton from "./AddFriendButton";

const { t } = i18n;

const sendFriendRequestMock = service.api.sendFriendRequest as jest.Mock<
  ReturnType<typeof service.api.sendFriendRequest>
>;

const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;

const accountInfo = {
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "+46701740605",
  phoneVerified: true,
  timezone: "Australia/Broken_Hill",
  hasStrongVerification: false,
  birthdateVerificationStatus: 1,
  genderVerificationStatus: 3,
  doNotEmail: false,
  hasDonated: false,
  isSuperuser: false,
  uiLanguagePreference: "",
  profilePublicVisibility: 1,
  isVolunteer: false,
  myHomeComplete: false,
  shouldShowDonationBanner: false,
};

const incompleteAccountInfo = { ...accountInfo, profileComplete: false };

function TestComponent() {
  const [mutationError, setMutationError] = useState("");

  return (
    <>
      {mutationError ? <p>{mutationError}</p> : <p>Success!</p>}
      <AddFriendButton userId={2} setMutationError={setMutationError} />
    </>
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AddFriendButton", () => {
  beforeEach(() => {
    getAccountInfoMock.mockResolvedValue(accountInfo);
  });

  it("renders the button correctly", () => {
    render(<TestComponent />, { wrapper });
    expect(
      screen.getByRole("button", {
        name: t("connections:add_friend"),
      }),
    ).toBeVisible();
  });

  it("shows confirmation dialog when add friend button is clicked", async () => {
    render(<TestComponent />, { wrapper });

    const button = screen.getByRole("button", {
      name: t("connections:add_friend"),
    });
    await waitFor(() => expect(button).toBeEnabled());

    const user = userEvent.setup();
    await user.click(button);

    expect(
      await screen.findByText(
        t("connections:add_friend_confirmation_dialog.title"),
      ),
    ).toBeVisible();
    expect(sendFriendRequestMock).not.toHaveBeenCalled();
  });

  it("does not send request if confirmation is cancelled", async () => {
    render(<TestComponent />, { wrapper });

    const button = screen.getByRole("button", {
      name: t("connections:add_friend"),
    });
    await waitFor(() => expect(button).toBeEnabled());

    const user = userEvent.setup();
    await user.click(button);
    await screen.findByText(
      t("connections:add_friend_confirmation_dialog.title"),
    );

    await user.click(screen.getByRole("button", { name: t("global:cancel") }));
    expect(sendFriendRequestMock).not.toHaveBeenCalled();
  });

  it("shows loading state correctly if the add friend action is still running", async () => {
    // A never resolving promise will always be pending...
    sendFriendRequestMock.mockImplementation(() => new Promise(() => void 0));
    render(<TestComponent />, { wrapper });

    const button = screen.getByRole("button", {
      name: t("connections:add_friend"),
    });
    await waitFor(() => expect(button).toBeEnabled());

    const user = userEvent.setup();
    await user.click(button);
    await user.click(
      await screen.findByRole("button", {
        name: t("connections:add_friend_confirmation_dialog.confirm"),
      }),
    );

    await waitFor(() =>
      expect(
        screen.queryByText(
          t("connections:add_friend_confirmation_dialog.title"),
        ),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("progressbar")).toBeVisible();
  });

  it("sets no error if the add friend action succeeded", async () => {
    sendFriendRequestMock.mockResolvedValue(new Empty());
    render(<TestComponent />, { wrapper });

    const button = screen.getByRole("button", {
      name: t("connections:add_friend"),
    });
    await waitFor(() => expect(button).toBeEnabled());

    const user = userEvent.setup();
    await user.click(button);
    await user.click(
      await screen.findByRole("button", {
        name: t("connections:add_friend_confirmation_dialog.confirm"),
      }),
    );

    expect(await screen.findByText(/Success/)).toBeInTheDocument();
  });

  it("sets an error if the add friend action failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    sendFriendRequestMock.mockRejectedValue(
      new Error("Failed to add funny dog"),
    );
    render(<TestComponent />, { wrapper });

    const button = screen.getByRole("button", {
      name: t("connections:add_friend"),
    });
    await waitFor(() => expect(button).toBeEnabled());

    const user = userEvent.setup();
    await user.click(button);
    await user.click(
      await screen.findByRole("button", {
        name: t("connections:add_friend_confirmation_dialog.confirm"),
      }),
    );

    expect(
      await screen.findByText("Failed to add funny dog"),
    ).toBeInTheDocument();
  });

  it("pops up incomplete profile note if profile is incomplete", async () => {
    getAccountInfoMock.mockResolvedValue(incompleteAccountInfo);
    render(<TestComponent />, { wrapper });

    const button = screen.getByRole("button", {
      name: t("connections:add_friend"),
    });
    await waitFor(() => expect(button).toBeEnabled());

    const user = userEvent.setup();
    await user.click(button);

    expect(
      await screen.findByLabelText(t("profile:complete_profile_dialog.title")),
    ).toBeVisible();
    expect(sendFriendRequestMock).not.toHaveBeenCalled();
  });
});
