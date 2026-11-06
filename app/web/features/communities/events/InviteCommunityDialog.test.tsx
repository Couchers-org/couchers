import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { service } from "service";
import i18n from "test/i18n";

import InviteCommunityDialog from "./InviteCommunityDialog";

const { t } = i18n;

const requestCommunityInviteMock = service.events.RequestCommunityInvite as jest.MockedFunction<
  typeof service.events.RequestCommunityInvite
>;

function renderDialog(props: Partial<React.ComponentProps<typeof InviteCommunityDialog>> = {}) {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <InviteCommunityDialog open eventId={123} onClose={jest.fn()} afterSuccess={jest.fn()} {...props} />
    </QueryClientProvider>,
  );
}

describe("InviteCommunityDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests a community invite when confirm is clicked", async () => {
    requestCommunityInviteMock.mockResolvedValue(new Empty());

    const user = userEvent.setup();

    renderDialog();

    await user.click(
      screen.getByRole("button", {
        name: t("communities:invite_community_dialog_buttons.confirm"),
      }),
    );

    await waitFor(() => {
      expect(requestCommunityInviteMock).toHaveBeenCalledWith(123);
    });
  });

  it("closes without requesting an invite when close is clicked", async () => {
    const user = userEvent.setup();

    renderDialog();

    await user.click(
      screen.getByRole("button", {
        name: t("communities:invite_community_dialog_buttons.close"),
      }),
    );

    expect(requestCommunityInviteMock).not.toHaveBeenCalled();
  });

  it("shows an error if requesting a community invite fails", async () => {
    requestCommunityInviteMock.mockRejectedValue(new Error("Invite failed"));

    const user = userEvent.setup();

    renderDialog();

    await user.click(
      screen.getByRole("button", {
        name: t("communities:invite_community_dialog_buttons.confirm"),
      }),
    );

    expect(await screen.findByText("Invite failed")).toBeVisible();
  });

  it("calls afterSuccess after a successful invite", async () => {
    requestCommunityInviteMock.mockResolvedValue(new Empty());

    const afterSuccess = jest.fn();
    const user = userEvent.setup();

    renderDialog({ afterSuccess });

    await user.click(
      screen.getByRole("button", {
        name: t("communities:invite_community_dialog_buttons.confirm"),
      }),
    );

    await waitFor(() => {
      expect(afterSuccess).toHaveBeenCalled();
    });
  });
});
