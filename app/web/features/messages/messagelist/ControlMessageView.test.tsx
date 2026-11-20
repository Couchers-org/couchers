// Installs a mock IntersectionObserver for the message's on-visible hook.
import "react-intersection-observer/test-utils";

import { render, screen } from "@testing-library/react";
import { HostRequestStatus, Message } from "proto/messages_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLiteUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

import ControlMessageView from "./ControlMessageView";

const { t } = i18n;

const getLiteUserMock = service.user.getLiteUser as jest.Mock;

// User 1 is the default (current) user; user 2 is "Funny Dog".
function statusMessage(status: HostRequestStatus, authorUserId: number): Message.AsObject {
  return {
    ...new Message().toObject(),
    messageId: 10,
    authorUserId,
    hostRequestStatusChanged: { status },
    time: { seconds: 1577900000, nanos: 0 },
  };
}

// On a public-trip invitation the host withdraws and the traveller accepts/declines, so the
// control messages must say "invitation" rather than "request".
describe("ControlMessageView", () => {
  beforeEach(() => {
    addDefaultUser();
    getLiteUserMock.mockImplementation(getLiteUser);
  });

  it("calls a withdrawn invitation an invitation", async () => {
    render(<ControlMessageView message={statusMessage(HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED, 2)} isOffer />, {
      wrapper,
    });

    expect(
      await screen.findByText(t("messages:control_message.invitation_status_changed.cancelled", { user: "Funny" })),
    ).toBeVisible();
  });

  it("calls a cancelled host request a request", async () => {
    render(<ControlMessageView message={statusMessage(HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED, 2)} />, {
      wrapper,
    });

    expect(
      await screen.findByText(t("messages:control_message.host_request_status_changed.cancelled", { user: "Funny" })),
    ).toBeVisible();
  });

  it("uses the second person when the viewer withdrew their own invitation", async () => {
    render(<ControlMessageView message={statusMessage(HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED, 1)} isOffer />, {
      wrapper,
    });

    expect(
      await screen.findByText(t("messages:control_message.invitation_status_changed.cancelled_self")),
    ).toBeVisible();
  });

  it("calls an accepted invitation an invitation", async () => {
    render(<ControlMessageView message={statusMessage(HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED, 2)} isOffer />, {
      wrapper,
    });

    expect(
      await screen.findByText(t("messages:control_message.invitation_status_changed.accepted", { user: "Funny" })),
    ).toBeVisible();
  });
});
