import { render, screen } from "@testing-library/react";
import { HostRequestStatus } from "proto/messages_pb";
import { HostRequest } from "proto/requests_pb";
import { service } from "service";
import hostRequest from "test/fixtures/hostRequest";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLiteUser } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService } from "test/utils";

import HostRequestView from "./HostRequestView";

const { t } = i18n;

const getHostRequestMock = service.requests.getHostRequest as MockedService<typeof service.requests.getHostRequest>;
const getHostRequestMessagesMock = service.requests.getHostRequestMessages as MockedService<
  typeof service.requests.getHostRequestMessages
>;
const getLiteUserMock = service.user.getLiteUser as jest.Mock;
const getAvailableReferencesMock = service.references.getAvailableReferences as MockedService<
  typeof service.references.getAvailableReferences
>;

const CURRENT_USER = 1;
const OTHER_USER = 2;

// The viewer is always user 1; which role they hold is set by surfer/hostUserId,
// exactly as the backend's generated stay-role columns deliver them.
function renderView(overrides: Partial<HostRequest.AsObject>) {
  // The respond controls only render for a stay that hasn't happened yet, so keep
  // the dates far enough ahead that the tests can't rot.
  getHostRequestMock.mockResolvedValue({
    ...hostRequest,
    fromDate: "2099-01-01",
    toDate: "2099-01-05",
    ...overrides,
  });
  render(<HostRequestView hostRequestId={hostRequest.hostRequestId} />, { wrapper });
}

beforeEach(() => {
  addDefaultUser(CURRENT_USER);
  getLiteUserMock.mockImplementation(getLiteUser);
  getHostRequestMessagesMock.mockResolvedValue({ messagesList: [], lastMessageId: 0, noMore: true });
  // Rendered in the footer by HostRequestReferenceCard; unmocked it errors the query and adds noise
  // that could hide a real failure.
  getAvailableReferencesMock.mockResolvedValue({ canWriteFriendReference: false, availableWriteReferencesList: [] });
});

// A normal request: the surfer wrote it, so the host is the one who accepts.
describe("HostRequestView — normal request", () => {
  it("gives the host the accept/decline card", async () => {
    renderView({
      hostUserId: CURRENT_USER,
      surferUserId: OTHER_USER,
      publicTripId: 0,
      status: HostRequestStatus.HOST_REQUEST_STATUS_PENDING,
    });

    expect(await screen.findByRole("button", { name: t("global:accept") })).toBeVisible();
    expect(screen.queryByRole("button", { name: t("messages:withdraw_offer_button") })).not.toBeInTheDocument();
  });

  it("does not give the surfer an accept button while pending", async () => {
    renderView({
      hostUserId: OTHER_USER,
      surferUserId: CURRENT_USER,
      publicTripId: 0,
      status: HostRequestStatus.HOST_REQUEST_STATUS_PENDING,
    });

    expect(await screen.findByText("2099", { exact: false })).toBeVisible();
    expect(screen.queryByRole("button", { name: t("global:accept") })).not.toBeInTheDocument();
  });
});

// A public-trip offer inverts it: the surfer already posted the trip, and the
// host is the one making the offer, so the surfer is the one who accepts.
describe("HostRequestView — public-trip offer", () => {
  it("gives the offering host the withdraw card, never accept/decline", async () => {
    renderView({
      hostUserId: CURRENT_USER,
      surferUserId: OTHER_USER,
      publicTripId: 7,
      status: HostRequestStatus.HOST_REQUEST_STATUS_PENDING,
    });

    expect(await screen.findByText(t("messages:offer_sent_box_title"))).toBeVisible();
    expect(screen.getByRole("button", { name: t("messages:withdraw_offer_button") })).toBeVisible();
    expect(screen.queryByRole("button", { name: t("global:accept") })).not.toBeInTheDocument();
  });

  it("gives the travelling surfer accept/decline, never withdraw", async () => {
    renderView({
      hostUserId: OTHER_USER,
      surferUserId: CURRENT_USER,
      publicTripId: 7,
      status: HostRequestStatus.HOST_REQUEST_STATUS_PENDING,
    });

    expect(await screen.findByRole("button", { name: t("global:accept") })).toBeVisible();
    expect(screen.queryByRole("button", { name: t("messages:withdraw_offer_button") })).not.toBeInTheDocument();
    expect(screen.queryByText(t("messages:offer_sent_box_title"))).not.toBeInTheDocument();
  });

  it("lets the offering host confirm once the surfer has accepted", async () => {
    renderView({
      hostUserId: CURRENT_USER,
      surferUserId: OTHER_USER,
      publicTripId: 7,
      status: HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
    });

    expect(await screen.findByRole("button", { name: t("messages:confirm_request_button_text") })).toBeVisible();
    expect(screen.getByRole("button", { name: t("messages:withdraw_offer_button") })).toBeVisible();
  });

  it("shows the surfer a confirmation, not a confirm button, once they've accepted", async () => {
    renderView({
      hostUserId: OTHER_USER,
      surferUserId: CURRENT_USER,
      publicTripId: 7,
      status: HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
    });

    expect(
      await screen.findByText(t("messages:offer_accept_confirmation", { name: "Funny" }), { exact: false }),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: t("messages:confirm_request_button_text") })).not.toBeInTheDocument();
  });
});
