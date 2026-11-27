import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { GetAccountInfoRes } from "proto/account_pb";
import { PostalVerificationStatus } from "proto/postal_verification_pb";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { getUser } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService } from "test/utils";

import VerifyPostalPage from "./VerifyPostalPage";

const { t } = i18n;

const getAccountInfoMock = service.account.getAccountInfo as MockedService<typeof service.account.getAccountInfo>;
const getPostalStatusMock = service.postalVerification.getPostalVerificationStatus as MockedService<
  typeof service.postalVerification.getPostalVerificationStatus
>;
const verifyPostalCodeMock = service.postalVerification.verifyPostalCode as MockedService<
  typeof service.postalVerification.verifyPostalCode
>;
const getUserMock = service.user.getUser as jest.Mock;

describe("VerifyPostalPage", () => {
  beforeEach(() => {
    addDefaultUser();
    getUserMock.mockImplementation(getUser);
    getAccountInfoMock.mockResolvedValue({ hasDonated: true } as GetAccountInfoRes.AsObject);
    getPostalStatusMock.mockResolvedValue({
      hasPostalVerification: false,
      hasActiveAttempt: true,
      postalVerificationAttemptId: 7,
      status: PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION,
      canInitiateNewAttempt: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fills in the code from the postcard's QR code link", async () => {
    const user = userEvent.setup();
    verifyPostalCodeMock.mockResolvedValue({ success: true, remainingAttempts: 0 });
    mockRouter.setCurrentUrl("/verify-postal?c=x7km4q");
    const { wrapper } = getHookWrapperWithClient();
    render(<VerifyPostalPage />, { wrapper });

    expect(await screen.findByLabelText(t("auth:verification_page.postal.code_form.code_label"))).toHaveValue("X7KM4Q");

    await user.click(screen.getByRole("button", { name: t("auth:verification_page.postal.code_form.submit_button") }));

    await waitFor(() => {
      expect(verifyPostalCodeMock).toHaveBeenCalledWith("X7KM4Q");
    });
  });

  it("leaves the code empty when the link has none", async () => {
    mockRouter.setCurrentUrl("/verify-postal");
    const { wrapper } = getHookWrapperWithClient();
    render(<VerifyPostalPage />, { wrapper });

    expect(await screen.findByLabelText(t("auth:verification_page.postal.code_form.code_label"))).toHaveValue("");
  });
});
