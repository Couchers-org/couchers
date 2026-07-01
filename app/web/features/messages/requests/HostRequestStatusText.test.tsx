import { render, screen } from "@testing-library/react";
import HostRequestStatusText from "features/messages/requests/HostRequestStatusText";
import { HostRequestStatus } from "proto/conversations_pb";
import wrapper from "test/hookWrapper";

describe("HostRequestStatusText (public-trip offers)", () => {
  it("shows the traveller (surfer) offer copy", () => {
    const { rerender } = render(
      <HostRequestStatusText
        isHost={false}
        isOffer
        requestStatus={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isPast={false}
        otherName="Luca"
      />,
      { wrapper },
    );
    expect(
      screen.getByText("Offer to host you · awaiting your reply"),
    ).toBeVisible();

    rerender(
      <HostRequestStatusText
        isHost={false}
        isOffer
        requestStatus={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
        isPast={false}
        otherName="Luca"
      />,
    );
    expect(screen.getByText("You accepted Luca's offer")).toBeVisible();

    rerender(
      <HostRequestStatusText
        isHost={false}
        isOffer
        requestStatus={HostRequestStatus.HOST_REQUEST_STATUS_REJECTED}
        isPast={false}
        otherName="Luca"
      />,
    );
    expect(screen.getByText("You declined this offer")).toBeVisible();
  });

  it("shows the offering host offer copy", () => {
    const { rerender } = render(
      <HostRequestStatusText
        isHost
        isOffer
        requestStatus={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isPast={false}
        otherName="Mateo"
      />,
      { wrapper },
    );
    expect(screen.getByText("Awaiting Mateo's reply")).toBeVisible();

    rerender(
      <HostRequestStatusText
        isHost
        isOffer
        requestStatus={HostRequestStatus.HOST_REQUEST_STATUS_REJECTED}
        isPast={false}
        otherName="Mateo"
      />,
    );
    expect(screen.getByText("Mateo chose another host")).toBeVisible();
  });
});
