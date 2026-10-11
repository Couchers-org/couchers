import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileLink from "components/ProfileLink/ProfileLink";
import { service } from "service";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { createMatchMedia } from "test/utils";
import { useIsNativeEmbed } from "utils/nativeLink";

import ProfileSheet from "./ProfileSheet";
import { ProfileSheetProvider } from "./ProfileSheetContext";

jest.mock("service");
jest.mock("utils/nativeLink", () => ({
  ...jest.requireActual("utils/nativeLink"),
  useIsNativeEmbed: jest.fn(),
}));

const [user] = users;
const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  (service.user.getUser as jest.Mock).mockImplementation(getUser);
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

async function tapProfileLink({ isNativeEmbed, width }: { isNativeEmbed: boolean; width: number }) {
  (useIsNativeEmbed as jest.Mock).mockReturnValue(isNativeEmbed);
  window.matchMedia = createMatchMedia(width);
  render(
    <ProfileSheetProvider>
      <ProfileLink userId={user.userId} username={user.username} openInNewTab>
        Link to the profile
      </ProfileLink>
      <ProfileSheet />
    </ProfileSheetProvider>,
    { wrapper },
  );
  await userEvent.click(screen.getByRole("link", { name: "Link to the profile" }));
}

describe("ProfileSheet", () => {
  it("shows the profile in the native app at tablet width", async () => {
    await tapProfileLink({ isNativeEmbed: true, width: 1180 });
    expect(await screen.findByRole("heading", { name: user.name })).toBeVisible();
  });

  it("shows the profile in a narrow browser window", async () => {
    await tapProfileLink({ isNativeEmbed: false, width: 400 });
    expect(await screen.findByRole("heading", { name: user.name })).toBeVisible();
  });

  it("leaves the profile to the page on desktop web", async () => {
    await tapProfileLink({ isNativeEmbed: false, width: 1180 });
    expect(screen.queryByRole("heading", { name: user.name })).not.toBeInTheDocument();
  });
});
