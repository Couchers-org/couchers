import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import mockUsers from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser, MockedService } from "test/utils";

import { ProfileUserProvider } from "../hooks/useProfileUser";
import Overview from "./Overview";

const { t } = i18n;

const getAccountInfoMock = service.account.getAccountInfo as MockedService<typeof service.account.getAccountInfo>;

const accountInfo = {
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "",
  phoneVerified: false,
  timezone: "UTC",
  hasStrongVerification: false,
  birthdateVerificationStatus: 1,
  genderVerificationStatus: 1,
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

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Overview", () => {
  beforeEach(() => {
    addDefaultUser();
  });

  it("shows profile incomplete dialog when request button clicked and profile is incomplete", async () => {
    getAccountInfoMock.mockResolvedValue(incompleteAccountInfo);

    render(
      <ProfileUserProvider user={mockUsers[1]}>
        <Overview setIsRequesting={jest.fn()} setIsMessaging={jest.fn()} tab="about" />
      </ProfileUserProvider>,
      { wrapper },
    );

    const requestButton = await screen.findByRole("button", {
      name: t("profile:actions.request"),
    });
    await waitFor(() => expect(requestButton).toBeEnabled());

    const user = userEvent.setup();
    await user.click(requestButton);

    expect(await screen.findByLabelText(t("profile:complete_profile_dialog.title"))).toBeVisible();
  });
});
