import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GetAccountInfoRes } from "proto/account_pb";
import { GetPostalVerificationStatusRes, PostalVerificationStatus } from "proto/postal_verification_pb";
import { routeToBadge } from "routes";
import { service } from "service";
import users from "test/fixtures/users.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { getUser } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService } from "test/utils";

import VerificationPage from "./VerificationPage";

const { t } = i18n;

const getAccountInfoMock = service.account.getAccountInfo as MockedService<typeof service.account.getAccountInfo>;
const getPostalStatusMock = service.postalVerification.getPostalVerificationStatus as MockedService<
  typeof service.postalVerification.getPostalVerificationStatus
>;
const verifyPostalCodeMock = service.postalVerification.verifyPostalCode as MockedService<
  typeof service.postalVerification.verifyPostalCode
>;
const initiatePostalMock = service.postalVerification.initiatePostalVerification as MockedService<
  typeof service.postalVerification.initiatePostalVerification
>;
const confirmPostalMock = service.postalVerification.confirmPostalAddress as MockedService<
  typeof service.postalVerification.confirmPostalAddress
>;

const baseAccountInfo: GetAccountInfoRes.AsObject = {
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "",
  phoneVerified: false,
  timezone: "Australia/Melbourne",
  hasStrongVerification: false,
  birthdateVerificationStatus: 1,
  genderVerificationStatus: 3,
  doNotEmail: false,
  hasDonated: true,
  isSuperuser: false,
  uiLanguagePreference: "",
  profilePublicVisibility: 1,
  isVolunteer: false,
  myHomeComplete: false,
  shouldShowDonationBanner: false,
  featureFlagAttributesJson: "",
};

const noPostalAttempt: GetPostalVerificationStatusRes.AsObject = {
  hasPostalVerification: false,
  hasActiveAttempt: false,
  postalVerificationAttemptId: 0,
  status: PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_UNKNOWN,
  canInitiateNewAttempt: true,
};

const parisAddress = {
  addressLine1: "12 Rue de la Paix",
  addressLine2: "",
  city: "Paris",
  state: "",
  postalCode: "75002",
  countryCode: "FR",
};

function renderPage({
  accountInfo = {},
  isPostalEnabled = false,
}: { accountInfo?: Partial<GetAccountInfoRes.AsObject>; isPostalEnabled?: boolean } = {}) {
  getAccountInfoMock.mockResolvedValue({ ...baseAccountInfo, ...accountInfo });
  const { wrapper } = getHookWrapperWithClient(
    isPostalEnabled ? { postal_verification_enabled: { defaultValue: true } } : {},
  );
  render(<VerificationPage />, { wrapper });
}

const getUserMock = service.user.getUser as jest.Mock;
const getBadgesMock = service.resources.getBadges as MockedService<typeof service.resources.getBadges>;
const profileName = users.find((user) => user.userId === defaultUser.userId)!.name;

describe("VerificationPage", () => {
  beforeEach(() => {
    addDefaultUser();
    getUserMock.mockImplementation(getUser);
    getPostalStatusMock.mockResolvedValue(noPostalAttempt);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("explains how verification data is used", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: t("auth:verification_page.data_use.header") })).toBeVisible();
  });

  describe("strong verification", () => {
    it("lists what you need and links to the instructions when not verified", async () => {
      renderPage();

      expect(
        await screen.findByRole("heading", { name: t("auth:verification_page.strong.requirements_header") }),
      ).toBeVisible();
      expect(screen.getByText(t("auth:verification_page.strong.requirements.passport"))).toBeVisible();
      expect(screen.getByRole("link", { name: t("auth:strong_verification.start_button") })).toHaveAttribute(
        "href",
        "/strong-verification",
      );
    });

    it("offers to delete the passport data when verified", async () => {
      renderPage({ accountInfo: { hasStrongVerification: true } });

      expect(await screen.findByText(t("auth:verification_page.strong.verified_message"))).toBeVisible();
      expect(screen.getByRole("button", { name: t("auth:strong_verification.delete_button") })).toBeVisible();
      expect(
        screen.queryByRole("heading", { name: t("auth:verification_page.strong.requirements_header") }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows the profile badge phone and postal verification each earn", async () => {
    getBadgesMock.mockResolvedValue({
      badgesList: [
        { id: "phone_verified", name: "Phone verified", description: "Verified their phone number", color: "#71b768" },
        { id: "postal_verified", name: "Postal verified", description: "Verified their address", color: "#4f8fc7" },
      ],
    });
    renderPage({ isPostalEnabled: true });

    // the real badge chips, linking to their badge pages
    expect((await screen.findByText("Phone verified")).closest("a")).toHaveAttribute(
      "href",
      routeToBadge("phone_verified"),
    );
    expect((await screen.findByText("Postal verified")).closest("a")).toHaveAttribute(
      "href",
      routeToBadge("postal_verified"),
    );
    expect(screen.getAllByText(t("auth:verification_page.earned_badge_caption"))).toHaveLength(2);
  });

  describe("phone verification", () => {
    it("asks the user to donate first when they haven't", async () => {
      renderPage({ accountInfo: { hasDonated: false } });

      expect(await screen.findByText(/You need to/)).toBeVisible();
      expect(screen.queryByRole("button", { name: t("auth:change_phone.add_button_text") })).not.toBeInTheDocument();
    });

    it("shows the add form when there is no number", async () => {
      renderPage();

      expect(await screen.findByRole("button", { name: t("auth:change_phone.add_button_text") })).toBeVisible();
    });

    it("asks for the SMS code when a number is awaiting verification", async () => {
      renderPage({ accountInfo: { phone: "+46701740605", phoneVerified: false } });

      expect(await screen.findByLabelText(t("auth:change_phone.code_label"))).toBeVisible();
      expect(screen.getByRole("button", { name: t("auth:change_phone.verify_button_text") })).toBeVisible();
    });

    it("offers to remove or change the number once verified", async () => {
      renderPage({ accountInfo: { phone: "+46701740605", phoneVerified: true } });

      expect(await screen.findByRole("button", { name: t("auth:change_phone.remove_button_text") })).toBeVisible();
      expect(
        screen.getByRole("button", { name: t("auth:verification_page.phone.use_another_number_button") }),
      ).toBeVisible();
    });
  });

  describe("postal verification", () => {
    it("is hidden when the feature flag is off", async () => {
      renderPage({ isPostalEnabled: false });

      // Wait for the page to settle before asserting an absence.
      await screen.findByRole("heading", { name: t("auth:verification_page.phone.header") });
      expect(
        screen.queryByRole("heading", { name: t("auth:verification_page.postal.header") }),
      ).not.toBeInTheDocument();
      expect(getPostalStatusMock).not.toHaveBeenCalled();
    });

    it("asks the user to donate first when they haven't", async () => {
      renderPage({ isPostalEnabled: true, accountInfo: { hasDonated: false } });

      expect(await screen.findByRole("heading", { name: t("auth:verification_page.postal.header") })).toBeVisible();
      // <Trans> swaps the tagged span for a link, so match the rendered text.
      const donatePrompt = t("auth:verification_page.postal.need_to_donate").replace(/<\/?[a-zA-Z0-9_]+>/g, "");
      expect(await screen.findByText((_, element) => element?.textContent === donatePrompt)).toBeVisible();
      // No point offering the form: the backend would reject it.
      expect(
        screen.queryByLabelText(t("auth:verification_page.postal.address_form.address_line_1_label")),
      ).not.toBeInTheDocument();
    });

    it("starts on the address form when there is no attempt", async () => {
      renderPage({ isPostalEnabled: true });

      expect(await screen.findByRole("heading", { name: t("auth:verification_page.postal.header") })).toBeVisible();
      expect(
        await screen.findByLabelText(t("auth:verification_page.postal.address_form.address_line_1_label")),
      ).toBeVisible();

      // The four steps are labelled, and the first is the one we're on.
      expect(screen.getByText(t("auth:verification_page.postal.steps.address"))).toBeVisible();
      expect(screen.getByText(t("auth:verification_page.postal.steps.code"))).toBeVisible();
      expect(screen.getByText(t("auth:verification_page.postal.step_number", { step_number: 1 }))).toBeVisible();
      expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent(
        t("auth:verification_page.postal.steps.address"),
      );
    });

    it("does not submit an address that is missing a required field", async () => {
      const user = userEvent.setup();
      renderPage({ isPostalEnabled: true });

      await user.click(
        await screen.findByRole("button", { name: t("auth:verification_page.postal.address_form.submit_button") }),
      );

      await waitFor(() => {
        expect(initiatePostalMock).not.toHaveBeenCalled();
      });
      expect(
        screen.getAllByText(t("auth:verification_page.postal.address_form.required_field_error")).length,
      ).toBeGreaterThan(0);
    });

    it("submits a complete address and moves on to confirmation", async () => {
      const user = userEvent.setup();
      initiatePostalMock.mockResolvedValue({
        postalVerificationAttemptId: 7,
        correctedAddress: parisAddress,
        addressWasCorrected: true,
      });
      renderPage({ isPostalEnabled: true });

      // the name comes from their profile and can't be edited here
      const nameField = await screen.findByLabelText(
        t("auth:verification_page.postal.address_form.recipient_name_label"),
      );
      await waitFor(() => expect(nameField).toHaveValue(profileName));
      expect(nameField).toBeDisabled();

      await user.type(
        screen.getByLabelText(t("auth:verification_page.postal.address_form.address_line_1_label")),
        "12 rue de la paix",
      );
      await user.type(screen.getByLabelText(t("auth:verification_page.postal.address_form.city_label")), "paris");
      await user.selectOptions(
        screen.getByLabelText(t("auth:verification_page.postal.address_form.country_label")),
        "FR",
      );

      // The next status poll reflects the attempt the backend just created.
      getPostalStatusMock.mockResolvedValue({
        ...noPostalAttempt,
        hasActiveAttempt: true,
        canInitiateNewAttempt: false,
        postalVerificationAttemptId: 7,
        status: PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_PENDING_ADDRESS_CONFIRMATION,
        address: parisAddress,
      });

      await user.click(
        screen.getByRole("button", { name: t("auth:verification_page.postal.address_form.submit_button") }),
      );

      await waitFor(() => {
        expect(initiatePostalMock).toHaveBeenCalledWith(
          expect.objectContaining({ addressLine1: "12 rue de la paix", city: "paris", countryCode: "FR" }),
        );
      });
      expect(
        await screen.findByRole("button", { name: t("auth:verification_page.postal.confirm.submit_button") }),
      ).toBeVisible();
      // the confirm step shows who the card is addressed to
      const willPostTo = screen.getByText(
        t("auth:verification_page.postal.confirm.will_post_to_header"),
      ).parentElement!;
      expect(within(willPostTo).getByText(profileName)).toBeVisible();
    });

    it("confirms the corrected address", async () => {
      const user = userEvent.setup();
      confirmPostalMock.mockResolvedValue({});
      getPostalStatusMock.mockResolvedValue({
        ...noPostalAttempt,
        hasActiveAttempt: true,
        canInitiateNewAttempt: false,
        postalVerificationAttemptId: 7,
        status: PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_PENDING_ADDRESS_CONFIRMATION,
        address: parisAddress,
      });
      renderPage({ isPostalEnabled: true });

      await user.click(
        await screen.findByRole("button", { name: t("auth:verification_page.postal.confirm.submit_button") }),
      );

      await waitFor(() => {
        expect(confirmPostalMock).toHaveBeenCalledWith(7);
      });
    });

    it("tells the user when the postcard went out", async () => {
      getPostalStatusMock.mockResolvedValue({
        ...noPostalAttempt,
        hasActiveAttempt: true,
        canInitiateNewAttempt: false,
        postalVerificationAttemptId: 7,
        status: PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_IN_PROGRESS,
        address: parisAddress,
        postcardSentAt: { seconds: 1786492800, nanos: 0 },
      });
      renderPage({ isPostalEnabled: true });

      expect(await screen.findByText(/was mailed on/)).toBeVisible();
    });

    it("reports a wrong code with the number of tries left", async () => {
      const user = userEvent.setup();
      verifyPostalCodeMock.mockResolvedValue({ success: false, remainingAttempts: 4 });
      getPostalStatusMock.mockResolvedValue({
        ...noPostalAttempt,
        hasActiveAttempt: true,
        canInitiateNewAttempt: false,
        postalVerificationAttemptId: 7,
        status: PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION,
        address: parisAddress,
      });
      renderPage({ isPostalEnabled: true });

      await user.type(await screen.findByLabelText(t("auth:verification_page.postal.code_form.code_label")), "x7km4q");
      await user.click(
        screen.getByRole("button", { name: t("auth:verification_page.postal.code_form.submit_button") }),
      );

      expect(await screen.findByText(t("auth:verification_page.postal.code_form.wrong_code_message"))).toBeVisible();
      expect(verifyPostalCodeMock).toHaveBeenCalledWith("X7KM4Q");
      expect(
        screen.getByText(t("auth:verification_page.postal.code_form.attempts_left", { remaining: 4, count: 5 })),
      ).toBeVisible();
    });

    it("shows the success state once the address is verified", async () => {
      getPostalStatusMock.mockResolvedValue({
        ...noPostalAttempt,
        hasPostalVerification: true,
        postalVerificationAttemptId: 7,
        status: PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_SUCCEEDED,
        address: parisAddress,
      });
      renderPage({ isPostalEnabled: true });

      expect(await screen.findByText(t("auth:verification_page.postal.verified_message"))).toBeVisible();
      expect(
        screen.queryByLabelText(t("auth:verification_page.postal.address_form.address_line_1_label")),
      ).not.toBeInTheDocument();
    });
  });
});
