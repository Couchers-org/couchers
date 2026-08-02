import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

import InviteCodesPage from "./InviteCodesPage";

const { t } = i18n;

const listInviteCodesMock = service.account.listInviteCodes as MockedService<typeof service.account.listInviteCodes>;
const createInviteCodeMock = service.account.createInviteCode as MockedService<typeof service.account.createInviteCode>;
const disableInviteCodeMock = service.account.disableInviteCode as MockedService<
  typeof service.account.disableInviteCode
>;

describe("InviteCodesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders codes sorted by newest first and shows Disable only for active", async () => {
    const now = Math.floor(Date.now() / 1000);
    listInviteCodesMock.mockResolvedValue({
      inviteCodesList: [
        {
          code: "OLD123",
          created: { seconds: now - 3600, nanos: 0 },
          disabled: undefined,
          uses: 0,
          url: "",
        },
        {
          code: "NEW456",
          created: { seconds: now, nanos: 0 },
          disabled: undefined,
          uses: 2,
          url: "",
        },
        {
          code: "DISABLED",
          created: { seconds: now - 7200, nanos: 0 },
          disabled: { seconds: now - 1000, nanos: 0 },
          uses: 1,
          url: "",
        },
      ],
    });

    render(<InviteCodesPage />, { wrapper });

    // Verify order by DOM sequence of code labels
    const codeLabels = await screen.findAllByTestId("invite-code-link");
    expect(codeLabels[0]).toHaveTextContent(`${window.location.origin}/invite?code=NEW456`);
    expect(codeLabels[1]).toHaveTextContent(`${window.location.origin}/invite?code=OLD123`);
    expect(codeLabels[2]).toHaveTextContent(`${window.location.origin}/invite?code=DISABLED`);

    // Active codes have Disable action, disabled does not
    expect(screen.getAllByRole("button", { name: t("global:invites.disable_link") })).toHaveLength(2);
  });

  it("creates a new invite code when clicking Create", async () => {
    listInviteCodesMock.mockResolvedValue({ inviteCodesList: [] });
    createInviteCodeMock.mockResolvedValue({ code: "X", url: "" });

    render(<InviteCodesPage />, { wrapper });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: t("global:create") }));

    await waitFor(() => expect(createInviteCodeMock).toHaveBeenCalled());
  });

  it("copies the share link and shows feedback", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    const now = Math.floor(Date.now() / 1000);
    listInviteCodesMock.mockResolvedValue({
      inviteCodesList: [
        {
          code: "COPYME",
          created: { seconds: now, nanos: 0 },
          disabled: undefined,
          uses: 0,
          url: "",
        },
      ],
    });

    render(<InviteCodesPage />, { wrapper });
    const user = userEvent.setup();

    await user.click(await screen.findByLabelText(t("global:copy_button.a11y")));

    // Feedback tooltip appears
    expect(await screen.findByText(t("global:copy_button.copied_tooltip"))).toBeVisible();
  });

  it("disables an active code when clicking Disable", async () => {
    const now = Math.floor(Date.now() / 1000);
    listInviteCodesMock.mockResolvedValue({
      inviteCodesList: [
        {
          code: "ACTIVE",
          created: { seconds: now, nanos: 0 },
          disabled: undefined,
          uses: 0,
          url: "",
        },
      ],
    });

    disableInviteCodeMock.mockResolvedValue(undefined);

    render(<InviteCodesPage />, { wrapper });
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", {
        name: t("global:invites.disable_link"),
      }),
    );

    await waitFor(() => {
      expect(disableInviteCodeMock).toHaveBeenCalledWith("ACTIVE");
    });
  });
});
