import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import users from "test/fixtures/users.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser, MockedService } from "test/utils";

import { ProfileUserProvider } from "../hooks/useProfileUser";
import NewMessage from "./NewMessage";

const { t } = i18n;

jest.mock("features/analytics/hooks", () => ({
  useLogEvent: () => jest.fn(),
}));

jest.mock("features/antibot/antibot", () => ({
  doAntibot: jest.fn(),
}));

jest.mock("features/userQueries/useLiteUsers", () => ({
  useLiteUser: () => ({ isLoading: false, error: null }),
}));

const sendDirectMessageMock = service.conversations.sendDirectMessage as MockedService<
  typeof service.conversations.sendDirectMessage
>;

const [, hostUser] = users;
const HOST_REQUEST_TEXT = "Could you host me from the 3rd to the 5th?";

function renderNewMessage({ nudge = true } = {}) {
  const onRequestInstead = jest.fn();
  const { wrapper } = getHookWrapperWithClient({ host_request_nudge: { defaultValue: nudge } });
  render(
    <ProfileUserProvider user={hostUser}>
      <NewMessage setIsMessaging={jest.fn()} onRequestInstead={onRequestInstead} />
    </ProfileUserProvider>,
    { wrapper },
  );
  return { onRequestInstead };
}

async function typeAndSend(text: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(t("profile:message_form.message")), text);
  await user.click(screen.getByRole("button", { name: t("global:send") }));
  return user;
}

describe("NewMessage", () => {
  beforeEach(() => {
    addDefaultUser();
    sendDirectMessageMock.mockResolvedValue(1);
  });

  it("nudges towards a request, and hands over the text", async () => {
    const { onRequestInstead } = renderNewMessage();
    const user = await typeAndSend(HOST_REQUEST_TEXT);

    expect(sendDirectMessageMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: t("profile:message_form.request_instead") }));
    expect(onRequestInstead).toHaveBeenCalledWith(HOST_REQUEST_TEXT);
  });

  it("sends the message if the user ignores the nudge", async () => {
    renderNewMessage();
    const user = await typeAndSend(HOST_REQUEST_TEXT);

    await user.click(screen.getByRole("button", { name: t("profile:message_form.send_as_message") }));
    await waitFor(() => expect(sendDirectMessageMock).toHaveBeenCalledWith(hostUser.userId, HOST_REQUEST_TEXT));
  });

  it.each([
    ["the message doesn't look like a request", { nudge: true }, "Fancy a coffee while I'm in Berlin?"],
    ["the flag is off", { nudge: false }, HOST_REQUEST_TEXT],
  ])("sends straight away when %s", async (_, options, text) => {
    renderNewMessage(options);
    await typeAndSend(text);

    await waitFor(() => expect(sendDirectMessageMock).toHaveBeenCalledWith(hostUser.userId, text));
    expect(screen.queryByText(t("profile:message_form.request_instead"))).not.toBeInTheDocument();
  });
});
