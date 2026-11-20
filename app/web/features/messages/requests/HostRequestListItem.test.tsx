import { render, screen } from "@testing-library/react";
import { HostRequest } from "proto/requests_pb";
import { service } from "service";
import hostRequest from "test/fixtures/hostRequest";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLiteUser, getUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

import HostRequestListItem from "./HostRequestListItem";

const { t } = i18n;

const getLiteUserMock = service.user.getLiteUser as jest.Mock;
const getUserMock = service.user.getUser as jest.Mock;

// The default user (id 1) is the surfer on the fixture; user 2 is the host.
function request(overrides: Partial<HostRequest.AsObject> = {}): HostRequest.AsObject {
  return { ...hostRequest, ...overrides };
}

describe("HostRequestListItem", () => {
  beforeEach(() => {
    addDefaultUser();
    getLiteUserMock.mockImplementation(getLiteUser);
    // useCurrentUser supplies the author name in the message preview.
    getUserMock.mockImplementation(getUser);
  });

  // jspb serialises an unset publicTripId as 0, so a plain request must not be
  // mistaken for a public-trip offer.
  it("shows the surfing chip, not the public trip chip, for a normal request", async () => {
    render(<HostRequestListItem hostRequest={request()} />, { wrapper });

    expect(await screen.findByText(t("messages:messages_page.tabs.surfing"))).toBeVisible();
    expect(screen.queryByText(t("messages:host_request_item.public_trip_chip"))).not.toBeInTheDocument();
  });

  it("shows the hosting chip when the viewer is the host", async () => {
    render(<HostRequestListItem hostRequest={request({ hostUserId: 1, surferUserId: 2 })} />, { wrapper });

    expect(await screen.findByText(t("messages:messages_page.tabs.hosting"))).toBeVisible();
  });

  it("shows the public trip chip for an offer", async () => {
    render(<HostRequestListItem hostRequest={request({ publicTripId: 7 })} />, { wrapper });

    expect(await screen.findByText(t("messages:host_request_item.public_trip_chip"))).toBeVisible();
  });
});
