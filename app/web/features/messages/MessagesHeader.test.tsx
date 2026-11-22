import { render, screen } from "@testing-library/react";
import MessagesHeader from "features/messages/MessagesHeader";
import { PingRes } from "proto/api_pb";
import React from "react";
import { service } from "service";
import wrapper, { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser, MockedService } from "test/utils";

const { t } = i18n;

const pingMock = service.api.ping as MockedService<typeof service.api.ping>;

function renderPublicTripsHeader(unseenPublicTripOfferCount: number) {
  pingMock.mockResolvedValue({ unseenPublicTripOfferCount } as PingRes.AsObject);
  const { wrapper } = getHookWrapperWithClient({ public_trips_enabled: { defaultValue: true } });
  render(<MessagesHeader tab="public-trips" />, { wrapper });
}

describe("MessagesHeader", () => {
  beforeEach(() => {
    addDefaultUser();
  });

  it("renders the messages page title", () => {
    render(<MessagesHeader tab="all" />, { wrapper });

    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("renders the mark all read button when tab is 'all'", () => {
    render(<MessagesHeader tab="all" />, { wrapper });

    expect(screen.getByText("Mark all as read")).toBeInTheDocument();
  });

  it("renders the mark all read button when there are unseen public trip invitations", async () => {
    renderPublicTripsHeader(2);

    expect(
      await screen.findByRole("button", { name: t("messages:mark_all_read_button_text_public_trips") }),
    ).toBeVisible();
  });

  it("hides the mark all read button when there are no unseen public trip invitations", async () => {
    renderPublicTripsHeader(0);

    expect(await screen.findByText("Messages")).toBeInTheDocument();
    expect(pingMock).toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: t("messages:mark_all_read_button_text_public_trips") }),
    ).not.toBeInTheDocument();
  });
});
